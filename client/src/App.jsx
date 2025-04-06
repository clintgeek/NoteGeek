import React, { useEffect } from 'react';
// Use `useParams` for route parameters
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Breadcrumbs, Anchor } from '@mantine/core';
import Layout from './components/Layout';
import useAuthStore from './store/authStore';
import useFolderStore from './store/folderStore';
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
    const folders = useFolderStore((state) => state.folders);
    const currentFolder = folders.find(f => f._id === id);

    const items = [
        { title: 'Home', href: '/' },
        { title: currentFolder?.name || 'Loading...', href: '#' }
    ].map((item, index) => (
        <Anchor href={item.href} key={index} size="lg" fw={index === 1 ? 600 : 400}>
            {item.title}
        </Anchor>
    ));

    return (
        <>
            <Breadcrumbs mb="lg" separator="→">
                {items}
            </Breadcrumbs>
            <NoteList folderId={id} />
        </>
    );
}
const TagNotesList = () => {
    const { tag } = useParams();

    const items = [
        { title: 'Home', href: '/' },
        { title: `Tag: ${tag}`, href: '#' }
    ].map((item, index) => (
        <Anchor href={item.href} key={index} size="lg" fw={index === 1 ? 600 : 400}>
            {item.title}
        </Anchor>
    ));

    return (
        <>
            <Breadcrumbs mb="lg" separator="→">
                {items}
            </Breadcrumbs>
            <NoteList tag={tag} />
        </>
    );
}
const SearchResults = () => {
    const items = [
        { title: 'Home', href: '/' },
        { title: 'Search Results', href: '#' }
    ].map((item, index) => (
        <Anchor href={item.href} key={index} size="lg" fw={index === 1 ? 600 : 400}>
            {item.title}
        </Anchor>
    ));

    return (
        <>
            <Breadcrumbs mb="lg" separator="→">
                {items}
            </Breadcrumbs>
            <NoteList isSearch={true} />
        </>
    );
}
// ---

// Updated Main application view inside the layout with Nested Routes
const MainApp = () => {
    return (
        <Layout>
            {/* Use nested Routes */}
            <Routes>
                <Route path="/" element={
                    <>
                        <Breadcrumbs mb="lg" separator="→">
                            <Anchor href="/" size="lg" fw={600}>
                                All Notes
                            </Anchor>
                        </Breadcrumbs>
                        <NoteList />
                    </>
                } />
                <Route path="/folders/:id" element={<FolderNotesList />} />
                <Route path="/tags/:tag" element={<TagNotesList />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/notes/new" element={<NoteEditor />} />
                <Route path="/notes/:id" element={<NotePage />} />
                <Route path="/notes/:id/edit" element={<NotePage />} />
                {/* Default fallback for unmatched routes within MainApp */}
                <Route path="*" element={<div>Page Not Found within App</div>} />
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
