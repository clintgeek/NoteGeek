import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSSO } = useAuthStore();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from the URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const state = params.get('state');

        if (!token) {
          console.error('No token found in callback URL');
          throw new Error('Authentication failed: No token received');
        }

        // CSRF protection - state should match what was sent
        const storedState = sessionStorage.getItem('sso_state');
        console.log('State validation:', { received: state, stored: storedState });

        if (!state || !storedState) {
          console.warn('Proceeding without state validation');
        } else if (state !== storedState) {
          console.error('State validation failed', { received: state, stored: storedState });
          throw new Error('Authentication failed: State validation error');
        }

        // Clear the stored state
        sessionStorage.removeItem('sso_state');

        // Store the tokens in auth store
        console.log('Setting SSO tokens');
        const result = await setSSO(token, refreshToken);

        if (!result.success) {
          throw new Error(result.error || 'Failed to process authentication');
        }

        // Redirect to the app home or stored location
        const redirectTo = sessionStorage.getItem('sso_redirect') || '/';
        sessionStorage.removeItem('sso_redirect');

        console.log('Authentication successful, redirecting to:', redirectTo);
        navigate(redirectTo);
      } catch (error) {
        console.error('Error handling SSO callback:', error);
        setError(error.message || 'Authentication failed');
        setLoading(false);
        // After a delay, redirect to login
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate, location, setSSO]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
      p={2}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 500 }}>
          <Typography variant="body1">{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Redirecting to login...
          </Typography>
        </Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="body1" align="center" sx={{ mt: 2 }}>
            Completing authentication...
          </Typography>
        </>
      )}
    </Box>
  );
}