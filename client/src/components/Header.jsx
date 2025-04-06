import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import MenuIcon from '@mui/icons-material/Menu';

function Header() {
  return (
    <AppBar position="static">
      <Toolbar sx={{ px: 2 }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NoteAltOutlinedIcon sx={{ fontSize: 24, mr: 0.5 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center'
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
  );
}

export default Header;