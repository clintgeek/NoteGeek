import React from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Switch,
    Button
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';

function Settings() {
    const { logout } = useAuthStore();
    const [darkMode, setDarkMode] = React.useState(false);
    const [notifications, setNotifications] = React.useState(true);

    const handleLogout = () => {
        logout();
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <DarkModeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dark Mode" />
                        <Switch
                            edge="end"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                        />
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemIcon>
                            <NotificationsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Notifications" />
                        <Switch
                            edge="end"
                            checked={notifications}
                            onChange={(e) => setNotifications(e.target.checked)}
                        />
                    </ListItem>
                </List>
            </Paper>

            <Paper sx={{ mb: 3 }}>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <SecurityIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Security"
                            secondary="Manage your account security settings"
                        />
                    </ListItem>
                </List>
            </Paper>

            <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                fullWidth
            >
                Logout
            </Button>
        </Box>
    );
}

export default Settings;