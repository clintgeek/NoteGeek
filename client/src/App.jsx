import React, { useEffect } from 'react';
// Use `useParams` for route parameters
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import useAuthStore from './store/authStore';
import './App.css';

// Import actual page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Import main app components
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import NotePage from './pages/NotePage';

// --- Placeholder Pages/Components for Nested Routes ---
// TODO: Replace these with actual components/logic
const FolderNotesList = () => {
    const { id } = useParams();
    return <div>Notes for Folder ID: {id} <NoteList folderId={id} /></div>;
}
const TagNotesList = () => {
    const { tag } = useParams();
    return <div>Notes for Tag: {tag} <NoteList tag={tag} /></div>;
}
const SearchResults = () => {
     // TODO: Get search query from URL or state
    return <div>Search Results <NoteList isSearch={true} /></div>;
}
// ---

// Updated Main application view inside the layout with Nested Routes
const MainApp = () => {
    return (
        <Layout>
            {/* Use nested Routes */}
            <Routes>
                <Route path="/" element={ <><h2 key="h-all">All Notes</h2><NoteList key="nl-all" /></> } />
                <Route path="/folders/:id" element={ <FolderNotesList /> } />
                <Route path="/tags/:tag" element={ <TagNotesList /> } />
                <Route path="/search" element={ <SearchResults /> } />
                <Route path="/notes/new" element={ <NoteEditor /> } />
                <Route path="/notes/:id" element={ <NotePage /> } />
                <Route path="/notes/:id/edit" element={ <NotePage /> } />
                {/* Default fallback for unmatched routes within MainApp */}
                <Route path="*" element={ <div>Page Not Found within App</div> } />
            </Routes>
        </Layout>
    );
}

// Updated Protected Route using Zustand store
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after login.
        // Could use useLocation() here to pass state if needed
        return <Navigate to="/login" replace />;
    }
    return children;
};
// ---

function App() {
  // Attempt to hydrate user state on initial load
  const hydrateUser = useAuthStore((state) => state.hydrateUser);
  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*" // All other routes are protected
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
        {/* Add specific protected routes inside MainApp later, e.g., /notes/:id */}
      </Routes>
    </Router>
  );
}

export default App;
