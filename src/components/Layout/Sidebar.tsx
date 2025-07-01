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
import { Home, Thermometer, Settings, ArrowUpDown, Zap } from 'lucide-react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

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
  borderRadius: '0.5rem',
  margin: '4px 8px',
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 500,
  fontSize: '0.9rem',
  color: theme.palette.text.secondary,
  transition: 'all 0.2s ease',
  '&.Mui-selected': {
    background: '#028a4a',
    color: '#ffffff',
    '& .MuiListItemIcon-root': {
      color: '#ffffff',
    },
    '& .MuiListItemIcon-root svg': {
      stroke: '#ffffff',
      color: '#ffffff',
    },
    '& .MuiListItemText-primary': {
      color: '#ffffff',
    },
  },
  '&:hover': {
    backgroundColor: '#f8f8f8',
    color: '#028a4a',
    '& .MuiListItemIcon-root': {
      color: '#028a4a',
    },
    '& .MuiListItemIcon-root svg': {
      stroke: '#028a4a',
      color: '#028a4a',
    },
    '& .MuiListItemText-primary': {
      color: '#028a4a',
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
  { text: 'Home', path: '/', icon: <Home size={18} /> },
  { text: 'Environmental Temperature', path: '/temperature', icon: <Thermometer size={18} /> },
  { text: 'Preventive Maintenance', path: '/maintenance', icon: <Settings size={18} /> },
  { text: 'Migration Advice', path: '/migration', icon: <ArrowUpDown size={18} /> },
  { text: 'Stress Testing', path: '/stress-testing', icon: <Zap size={18} /> },
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
              <ListItemIcon
  sx={{
    color: 'inherit',
    minWidth: 0,
    marginRight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& svg': {
      stroke: 'currentColor',
      strokeWidth: 1.8,
      width: 20,
      height: 20,
    },
  }}
>
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
