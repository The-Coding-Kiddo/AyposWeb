import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Collapse,
  Divider,
  styled,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const DebugPanel = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  right: 20,
  width: 400,
  maxHeight: '60vh',
  borderRadius: theme.spacing(2, 2, 0, 0),
  padding: theme.spacing(2),
  zIndex: 1000,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[10],
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const ConfigDisplay = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: '50vh',
  '& pre': {
    margin: 0,
  },
}));

interface DebugConsoleProps {
  configData: any | null;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ configData }) => {
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);

  const toggleDebugPanel = () => {
    setShowDebugPanel(prev => !prev);
  };

  return (
    <>
      {/* Debug Panel Toggle Button */}
      <Button
        variant="outlined"
        startIcon={<BugReportIcon />}
        onClick={toggleDebugPanel}
        sx={{
          position: 'fixed',
          bottom: showDebugPanel ? 'auto' : 20,
          right: 20,
          zIndex: 1001,
          borderRadius: 2,
        }}
      >
        {showDebugPanel ? 'Hide' : 'Show'} Debug Info
      </Button>
      
      {/* Debug Panel */}
      <Collapse in={showDebugPanel}>
        <DebugPanel>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon color="primary" />
              Last Monitoring Configuration
            </Typography>
            <IconButton size="small" onClick={toggleDebugPanel}>
              <KeyboardArrowDownIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {configData ? (
            <ConfigDisplay>
              <pre>{JSON.stringify(configData, null, 2)}</pre>
            </ConfigDisplay>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
              No configuration has been sent yet. Start monitoring to see the data structure.
            </Typography>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Tip: You can also view this information in the browser console by pressing F12.
            </Typography>
          </Box>
        </DebugPanel>
      </Collapse>
    </>
  );
};

export default DebugConsole; 