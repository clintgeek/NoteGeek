import React, { useEffect, useState } from 'react';
// Use `useParams` for route parameters
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    CssBaseline,
    Breadcrumbs as MUIBreadcrumbs,
    Link as MUILink,
    Typography,
    GlobalStyles,
    CircularProgress,
    Box
} from '@mui/material';
import Layout from './components/Layout';
import useAuthStore from './store/authStore';
import useNoteStore from './store/noteStore';
import './App.css';

// Import actual page components
import Login from './components/Login';
import Register from './components/Register';

// Import main app components
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import NotePage from './pages/NotePage';
import SearchResults from './components/SearchResults';
import TagNotesList from './components/TagNotesList';

// Create theme
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6098CC', // Perfect header blue from color picker
            light: '#81B1D9', // Lighter shade
            dark: '#4B7AA3', // Darker shade
            contrastText: '#fff',
        },
        secondary: {
            main: '#1976D2', // Alt blue for interactive elements
            light: '#2196F3',
            dark: '#1565C0',
            contrastText: '#fff',
        },
        background: {
            default: '#F5F5F5', // FitnessGeek's background color
            paper: '#FFFFFF', // FitnessGeek's card color
        },
        error: {
            main: '#B00020', // FitnessGeek's error color
        },
        text: {
            primary: '#212121', // FitnessGeek's text color
            secondary: '#757575', // FitnessGeek's placeholder color
            disabled: '#BDBDBD', // FitnessGeek's disabled color
        },
        success: {
            main: '#4CAF50', // FitnessGeek's success color
        },
        warning: {
            main: '#FFC107', // FitnessGeek's warning color
        },
        info: {
            main: '#2196F3', // FitnessGeek's info color
        },
    },
    spacing: (factor) => `${8 * factor}px`, // Base spacing of 8px like FitnessGeek
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 14, // FitnessGeek's medium font size
        h1: {
            fontSize: '2rem', // 28px - FitnessGeek's headline size
            fontWeight: 500,
        },
        h2: {
            fontSize: '1.5rem', // 24px - FitnessGeek's title size
            fontWeight: 500,
        },
        h3: {
            fontSize: '1.25rem', // 20px - FitnessGeek's xxlarge size
            fontWeight: 500,
        },
        h4: {
            fontSize: '1.125rem', // 18px - FitnessGeek's xlarge size
            fontWeight: 500,
        },
        h5: {
            fontSize: '1rem', // 16px - FitnessGeek's large size
            fontWeight: 500,
        },
        h6: {
            fontSize: '0.875rem', // 14px - FitnessGeek's medium size
            fontWeight: 500,
        },
        body1: {
            fontSize: '0.875rem', // 14px - FitnessGeek's medium size
        },
        body2: {
            fontSize: '0.75rem', // 12px - FitnessGeek's small size
        },
    },
    shape: {
        borderRadius: 8, // FitnessGeek's medium border radius
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1), 0px 4px 5px 0px rgba(0,0,0,0.07), 0px 1px 10px 0px rgba(0,0,0,0.06)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 8, // Match FitnessGeek's button style
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#6098CC',
                    color: '#fff',
                    height: '60px',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#FFFFFF',
                    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                },
            },
        },
    },
});

// Global styles to override Material UI defaults
const globalStyles = (
  <GlobalStyles
    styles={{
      // Fix for the problematic minHeight on editor elements
      '.MuiInputBase-root, .MuiOutlinedInput-root, .css-y0i7t3, [class*="css-"]': {
        minHeight: 'auto !important'
      },
      // Add more global styles as needed
    }}
  />
);

// NewNoteWrapper component to clear state before showing editor
function NewNoteWrapper() {
    const { clearSelectedNote } = useNoteStore();
    const [key, setKey] = useState(0);

    // Clear any selected note when mounting this component
    useEffect(() => {
        clearSelectedNote();
        // Force a remount of NoteEditor by changing its key
        setKey(prev => prev + 1);
    }, [clearSelectedNote]);

    return <NoteEditor key={key} />;
}

// Main App Component
function App() {
    const { hydrateUser, isAuthenticated } = useAuthStore();
    const [isHydrating, setIsHydrating] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            await hydrateUser();
            setIsHydrating(false);
        };

        initializeAuth();

        // Add style to prevent scrolling on mind map pages
        const style = document.createElement('style');
        style.textContent = `
            body.mindmap-view {
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [hydrateUser]);

    // Show loading state while hydrating auth
    if (isHydrating) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                >
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    // Protected Route wrapper component
    const ProtectedRoute = ({ children }) => {
        if (!isAuthenticated) {
            return <Navigate to="/login" />;
        }
        return children;
    };

    // Protected Layout wrapper component
    const ProtectedLayout = () => {
        return (
            <ProtectedRoute>
                <Layout>
                    <Outlet />
                </Layout>
            </ProtectedRoute>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {globalStyles}
            <Router>
                <Routes>
                    <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                    <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
                    <Route element={<ProtectedLayout />}>
                        <Route index element={<NoteList />} />
                        <Route path="/notes">
                            <Route path="new" element={<NewNoteWrapper />} />
                            <Route path=":id" element={<NotePage />} />
                            <Route path=":id/edit" element={<NotePage />} />
                        </Route>
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/tags/:tag" element={<TagNotesList />} />
                        <Route path="*" element={<div>Page Not Found</div>} />
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
