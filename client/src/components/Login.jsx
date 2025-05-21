import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import useAuthStore from '../store/authStore';

function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { initiateSSO } = useAuthStore();

    const handleSSOLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await initiateSSO();
        } catch (err) {
            setError('SSO login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
            <Paper elevation={3} sx={{ p: 4, minWidth: 340, maxWidth: 400 }}>
                {/* Branded header */}
                <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <AutoStoriesOutlinedIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            color: 'primary.main',
                            fontWeight: 'bold',
                            fontSize: '1.6rem',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        NoteGeek
                        <Typography
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                ml: 0.5,
                                mt: 0.5
                            }}
                        >
                            {'</>'}
                        </Typography>
                    </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleSSOLogin}
                    disabled={loading}
                    sx={{ mb: 2, fontWeight: 600 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Login with GeekBase'}
                </Button>
                <Typography variant="body2" color="text.secondary" align="center" mt={2}>
                    Using GeekBase for authentication
                </Typography>
            </Paper>
        </Box>
    );
}

export default Login;