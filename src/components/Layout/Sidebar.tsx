import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  styled, 
  Typography, 
  ListItemIcon,
  Drawer,
  useTheme,
  IconButton
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import BuildIcon from '@mui/icons-material/Build';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SpeedIcon from '@mui/icons-material/Speed';
import bgreenLogo from '../../assets/bgreen-logo.png';

const DRAWER_WIDTH = 240;

const LogoContainer = styled(Box)(() => ({
  padding: '20px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const StyledListItemButton = styled(ListItemButton)(() => ({
  margin: '4px 8px',
  borderRadius: 4,
  '&.Mui-selected': {
    backgroundColor: 'rgba(255,255,255,0.1)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    '& .MuiListItemIcon-root': {
      color: '#ffffff',
    },
    '& .MuiListItemText-primary': {
      color: '#ffffff',
      fontWeight: 500,
    },
  },
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
}));

const menuItems = [
  { text: 'Home', path: '/', icon: <HomeIcon /> },
  { text: 'Environmental Temperature', path: '/temperature', icon: <ThermostatIcon /> },
  { text: 'Preventive Maintenance', path: '/maintenance', icon: <BuildIcon /> },
  { text: 'Migration Advice', path: '/migration', icon: <SwapHorizIcon /> },
  { text: 'Stress Testing', path: '/stress-testing', icon: <SpeedIcon /> },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

const Sidebar = ({ open, onToggle, isMobile }: SidebarProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const drawerContent = (
    <>
      <LogoContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img 
            src={bgreenLogo}
            alt="B'GREEN Logo" 
            style={{ 
              width: 40, 
              height: 40,
              objectFit: 'contain'
            }} 
          />
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              B'GREEN
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                display: 'block',
                marginTop: '-2px',
              }}
            >
              Monitor System
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton 
            onClick={onToggle}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: '#ffffff' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </LogoContainer>

      <List sx={{ flexGrow: 1, mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <StyledListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.7)',
                  },
                }}
              />
            </StyledListItemButton>
          </ListItem>
        ))}
      </List>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          background: 'linear-gradient(0deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          2024 B'GREEN
        </Typography>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: DRAWER_WIDTH },
        flexShrink: { md: 0 },
      }}
    >
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={isMobile ? onToggle : undefined}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            backgroundColor: theme.palette.primary.main,
            border: 'none',
            height: '100%',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
