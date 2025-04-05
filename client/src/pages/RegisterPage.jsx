import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Title, TextInput, PasswordInput, Button, Text, Alert } from '@mantine/core';
import useAuthStore from '../store/authStore';
// import { IconAlertCircle } from '@tabler/icons-react';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState(null); // For client-side errors like password mismatch
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const apiError = useAuthStore((state) => state.error); // Renamed to avoid conflict
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError(null); // Clear previous client-side errors
        useAuthStore.setState({ error: null }); // Clear previous API errors

        if (password !== confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setFormError('Password must be at least 6 characters long');
            return;
        }

        const success = await register(email, password);
        if (success) {
            navigate('/'); // Navigate to main app on successful registration
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">Create Account</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
                Already have an account? {' '}
                <Text component="a" href="/login" size="sm">
                    Log in
                </Text>
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                 {(formError || apiError) && (
                    <Alert
                        variant="light"
                        color="red"
                        title="Registration Failed"
                        // icon={<IconAlertCircle />}
                        withCloseButton
                        onClose={() => { setFormError(null); useAuthStore.setState({ error: null }); }}
                        mb="md"
                    >
                        {formError || apiError}
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
                     <PasswordInput
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        required
                        mt="md"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                    />
                    <Button type="submit" fullWidth mt="xl" loading={isLoading}>
                        Register
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default RegisterPage;