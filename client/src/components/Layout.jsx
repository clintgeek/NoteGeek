import React from 'react';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    Toolbar,
    Typography,
    useTheme,
    Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';

const DRAWER_WIDTH = 240;

function Layout({ children }) {
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [desktopOpen, setDesktopOpen] = React.useState(true);

    const handleDrawerToggle = () => {
        if (window.innerWidth >= theme.breakpoints.values.sm) {
            setDesktopOpen(!desktopOpen);
        } else {
            setMobileOpen(!mobileOpen);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <CssBaseline />

            {/* App Bar - Full Width */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                }}
            >
                <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AutoStoriesOutlinedIcon sx={{ fontSize: 22 }} />
                        <Typography
                            variant="h6"
                            noWrap
                            component="div"
                            sx={{
                                flexGrow: 1,
                                color: 'inherit',
                                fontWeight: 'bold',
                                fontSize: '20px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            NoteGeek
                            <Typography
                                component="span"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    ml: 0.5,
                                    mt: 0.5
                                }}
                            >
                                {'</>'}
                            </Typography>
                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Content Area - Below AppBar */}
            <Box sx={{ display: 'flex', flexGrow: 1, pt: '64px' }}>
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better mobile performance
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH,
                            bgcolor: 'background.paper',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            mt: '64px', // Height of AppBar
                        },
                    }}
                >
                    <Sidebar closeNavbar={handleDrawerToggle} />
                </Drawer>

                {/* Desktop Drawer */}
                <Drawer
                    variant="persistent"
                    open={desktopOpen}
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            bgcolor: 'background.paper',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 'none',
                            mt: '64px', // Height of AppBar
                        },
                    }}
                >
                    <Sidebar />
                </Drawer>

                {/* Main Content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        minHeight: '100vh',
                        bgcolor: 'background.default',
                        pt: { xs: 2, sm: 3 },
                        pb: { xs: 2, sm: 3 },
                        ml: { sm: desktopOpen ? 0 : `-${DRAWER_WIDTH}px` },
                        transition: theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
                        {children}
                    </Container>
                </Box>
            </Box>
        </Box>
    );
}

export default Layout;