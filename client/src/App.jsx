import React, { useEffect } from 'react';
// Use `useParams` for route parameters
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    CssBaseline,
    Breadcrumbs as MUIBreadcrumbs,
    Link as MUILink,
    Typography
} from '@mui/material';
import Layout from './components/Layout';
import useAuthStore from './store/authStore';
import './App.css';

// Import actual page components
import Login from './components/Login';
import Register from './components/Register';

// Import main app components
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import NotePage from './pages/NotePage';
import ImportNotes from './components/ImportNotes';
import SearchResults from './components/SearchResults';

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

// Tag Notes List Component
const TagNotesList = () => {
    const { tag } = useParams();
    const decodedTag = decodeURIComponent(tag);
    const parts = decodedTag.split('/');

    const items = [
        { title: 'Home', href: '/' },
        ...parts.map((part, index) => {
            const path = parts.slice(0, index + 1).join('/');
            return {
                title: part,
                href: `/tags/${encodeURIComponent(path)}`
            };
        })
    ];

    return (
        <>
            <MUIBreadcrumbs sx={{ mb: 2 }}>
                {items.map((item, index) => (
                    index === items.length - 1 ? (
                        <Typography key={index} color="text.primary" variant="h6">
                            {item.title}
                        </Typography>
                    ) : (
                        <MUILink
                            key={index}
                            component={Link}
                            to={item.href}
                            underline="hover"
                            color="inherit"
                            variant="h6"
                        >
                            {item.title}
                        </MUILink>
                    )
                ))}
            </MUIBreadcrumbs>
            <NoteList tag={decodedTag} />
        </>
    );
};

// Main App Component
function MainApp() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<NoteList />} />
                <Route path="/notes/new" element={<NoteEditor />} />
                <Route path="/notes/:id" element={<NotePage />} />
                <Route path="/notes/:id/edit" element={<NotePage />} />
                <Route path="/import" element={<ImportNotes />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/tags/:tag" element={<TagNotesList />} />
                <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
        </Layout>
    );
}

// Main App Component
function App() {
    const { hydrateUser } = useAuthStore();

    useEffect(() => {
        hydrateUser();
    }, [hydrateUser]);

    const { isAuthenticated } = useAuthStore();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                    <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
                    <Route path="/*" element={isAuthenticated ? <MainApp /> : <Navigate to="/login" />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
