import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B1A33', // Deep navy blue from BLC
      light: '#1e3a6b',
      dark: '#060d19',
    },
    secondary: {
      main: '#FF5722', // Orange accent from icons
      light: '#ff784e',
      dark: '#c41c00',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#0B1A33',
      secondary: '#546e7a',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#0B1A33',
    },
    h5: {
      fontWeight: 500,
      color: '#0B1A33',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          padding: '8px 24px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(11, 26, 51, 0.15)',
          },
        },
        contained: {
          background: '#0B1A33',
          color: '#ffffff',
          '&:hover': {
            background: '#1e3a6b',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(11, 26, 51, 0.08)',
          border: '1px solid rgba(11, 26, 51, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(11, 26, 51, 0.08)',
          border: '1px solid rgba(11, 26, 51, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(11, 26, 51, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(11, 26, 51, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0B1A33',
            },
          },
        },
      },
    },
  },
});
