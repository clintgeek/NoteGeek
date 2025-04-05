import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Title, TextInput, PasswordInput, Button, Text, Alert } from '@mantine/core';
import useAuthStore from '../store/authStore';
// import { IconAlertCircle } from '@tabler/icons-react'; // Optional icon for errors

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/'); // Navigate to main app on successful login
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">Welcome back!</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
                Do not have an account yet? {' '}
                <Text component="a" href="/register" size="sm">
                    Create account
                </Text>
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                {error && (
                    <Alert
                        variant="light"
                        color="red"
                        title="Login Failed"
                        // icon={<IconAlertCircle />}
                        withCloseButton
                        onClose={() => useAuthStore.setState({ error: null })} // Clear error on close
                        mb="md"
                    >
                        {error}
                    </Alert>
                )}
                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Email"
                        placeholder="you@example.com"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.currentTarget.value)}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        mt="md"
                        value={password}
                        onChange={(event) => setPassword(event.currentTarget.value)}
                    />
                    {/* Add Remember me checkbox later if needed */}
                    <Button type="submit" fullWidth mt="xl" loading={isLoading}>
                        Sign in
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default LoginPage;