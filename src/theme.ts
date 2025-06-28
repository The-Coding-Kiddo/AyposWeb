import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#028a4a', // B'GREEN primary green
      light: '#28c76f', // Success green
      dark: '#026c39',
    },
    secondary: {
      main: '#FF1744', // Material-UI Red[500] as secondary
      light: '#ff616f',
      dark: '#b2102f',
    },
    background: {
      default: '#f8f8f8', // Body background
      paper: '#fff',
    },
    text: {
      primary: '#6e6b7b', // Body text
      secondary: '#5e5873', // Headings
      disabled: '#b9b9c3', // Muted text
    },
    success: {
      main: '#28c76f',
    },
    warning: {
      main: '#ffb400',
    },
    error: {
      main: '#FF1744',
    },
    info: {
      main: '#00cfe8',
    },
    divider: '#ebe9f1', // Border color
  },
  typography: {
    fontFamily: 'Montserrat, Helvetica, Arial, serif',
    fontSize: 14, // 1rem
    h1: {
      fontSize: '2rem', // 28px
      fontWeight: 700,
      color: '#5e5873',
    },
    h2: {
      fontSize: '1.714rem', // 24px
      fontWeight: 600,
      color: '#5e5873',
    },
    h3: {
      fontSize: '1.5rem', // 21px
      fontWeight: 600,
      color: '#5e5873',
    },
    h4: {
      fontSize: '1.286rem', // 18px
      fontWeight: 500,
      color: '#5e5873',
    },
    h5: {
      fontSize: '1.07rem', // 15px
      fontWeight: 500,
      color: '#5e5873',
    },
    body1: {
      fontSize: '1rem',
      color: '#6e6b7b',
    },
    body2: {
      fontSize: '0.9rem',
      color: '#6e6b7b',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.357rem',
          textTransform: 'none',
          padding: '8px 24px',
          fontWeight: 600,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(2, 138, 74, 0.15)',
          },
        },
        contained: {
          background: '#028a4a',
          color: '#fff',
          '&:hover': {
            background: '#026c39',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.357rem',
          boxShadow: '0 2px 12px rgba(2, 138, 74, 0.08)',
          border: '1px solid #ebe9f1',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.357rem',
          boxShadow: '0 2px 12px rgba(2, 138, 74, 0.08)',
          border: '1px solid #ebe9f1',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#ebe9f1',
            },
            '&:hover fieldset': {
              borderColor: '#028a4a',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#028a4a',
            },
          },
        },
      },
    },
  },
});
