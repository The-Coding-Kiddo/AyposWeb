import { 
  Box, 
  List, 
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

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: '20px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const LogoText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 600,
  letterSpacing: '0.5px',
}));

const LogoSubText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  display: 'block',
  marginTop: '-2px',
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: '0.6rem',
  backgroundColor: theme.palette.background.paper,
  margin: '2px 8px',
  transition: 'background 0.2s, box-shadow 0.2s',
  boxShadow: 'none',
  position: 'relative',
  overflow: 'visible',
  '&.Mui-selected': {
    background: 'linear-gradient(100deg, #028a4a 60%, #28c76f 100%)',
    color: theme.palette.common.white,
    boxShadow: '0 4px 24px 0 rgba(2,138,74,0.18)',
    '&::after': {
      content: '""',
      position: 'absolute',
      zIndex: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '0.6rem',
      boxShadow: '0 0 24px 8px #28c76f33', // subtle green glow
      pointerEvents: 'none',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.common.white,
      zIndex: 1,
    },
    '& .MuiListItemText-primary': {
      color: theme.palette.common.white,
      fontWeight: 600,
      zIndex: 1,
    },
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
    boxShadow: 'none',
    '& .MuiListItemIcon-root': {
      color: theme.palette.text.primary,
    },
    '& .MuiListItemText-primary': {
      color: theme.palette.text.primary,
    },
  },
}));

const MenuListContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: '0.6rem',
  margin: '16px 8px 0 8px',
  boxShadow: '0 2px 12px 0 rgba(44,62,80,0.04)',
  padding: '4px 0',
  display: 'flex',
  flexDirection: 'column',
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
            <LogoText variant="h6">B'GREEN</LogoText>
            <LogoSubText variant="caption">Monitor System</LogoSubText>
          </Box>
        </Box>
        {isMobile && (
          <IconButton 
            onClick={onToggle}
            sx={{ color: theme.palette.text.disabled, '&:hover': { color: theme.palette.text.secondary } }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </LogoContainer>

      <MenuListContainer>
        <List sx={{ flexGrow: 1, p: 0 }}>
          {menuItems.map((item) => (
            <StyledListItemButton
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon sx={{ color: theme.palette.text.secondary, minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.9rem',
                    color: theme.palette.text.secondary,
                  },
                }}
              />
            </StyledListItemButton>
          ))}
        </List>
      </MenuListContainer>

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
            backgroundColor: theme.palette.background.default,
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
