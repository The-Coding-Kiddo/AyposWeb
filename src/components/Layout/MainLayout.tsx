import React, { useState } from 'react';
import { Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        open={sidebarOpen} 
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          position: 'relative',
          overflow: 'auto',
          minHeight: '100vh',
        }}
      >
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: theme.zIndex.drawer + 2,
              bgcolor: theme.palette.primary.main,
              color: '#fff',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 7, md: 0 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
