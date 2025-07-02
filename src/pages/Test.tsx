import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  styled,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Chip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import SpeedIcon from '@mui/icons-material/Speed';
import ComputerIcon from '@mui/icons-material/Computer';
import { stressService } from '../services/stressService';

const PageTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
  '& svg': {
    color: theme.palette.primary.main,
  },
}));

const StressTestingCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(3),
}));

const VMSelectionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(3),
}));

const StressLevelChip = styled(Chip)<{ level: 'low' | 'medium' | 'high' }>(({ theme, level }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 500,
  backgroundColor: 
    level === 'low' ? theme.palette.success.light :
    level === 'medium' ? theme.palette.warning.light :
    theme.palette.error.light,
  color: 
    level === 'low' ? theme.palette.success.dark :
    level === 'medium' ? theme.palette.warning.dark :
    theme.palette.error.dark,
}));

interface ComputeNode {
  host_ip: string;
  hosted_vms: Record<string, string>;
}

interface MonitoringResponse {
  optimization_space: Record<string, ComputeNode>;
}

interface VM {
  id: string;
  name: string;
  ip: string;
}

const Test = () => {
  const [stressLevel, setStressLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [stressedVMs, setStressedVMs] = useState<string[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [isLoadingStress, setIsLoadingStress] = useState(false);
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [selectedVMs, setSelectedVMs] = useState<string[]>([]);
  const [availableVMs, setAvailableVMs] = useState<VM[]>([]);
  const [isLoadingVMs, setIsLoadingVMs] = useState(false);

  // Load optimization state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('optimizationState');
    if (savedState) {
      const { selectedVMs: optimizedVMs } = JSON.parse(savedState);
      setSelectedVMs(optimizedVMs || []);
    }
  }, []);

  // Fetch available VMs
  useEffect(() => {
    const fetchVMs = async () => {
      setIsLoadingVMs(true);
      try {
        const response = await fetch('http://141.196.166.241:8003/prom/monitoring');
        const data: MonitoringResponse = await response.json();
        
        // Extract VMs from the optimization space
        const vms: VM[] = [];
        if (data.optimization_space) {
          Object.entries(data.optimization_space).forEach(([computeName, computeData]) => {
            Object.entries(computeData.hosted_vms).forEach(([vmName, vmIp]) => {
              vms.push({
                id: `${computeName}-${vmName}`,
                name: vmName,
                ip: vmIp
              });
            });
          });
        }
        setAvailableVMs(vms);
      } catch (error) {
        console.error('Error fetching VMs:', error);
        setAlert({
          open: true,
          message: 'Failed to fetch available VMs',
          severity: 'error'
        });
      } finally {
        setIsLoadingVMs(false);
      }
    };

    fetchVMs();
  }, []);

  // Add status polling for stress test
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStressStatus = async () => {
      try {
        if (selectedVMs.length > 0) {
          const status = await stressService.getStressStatus(selectedVMs);
          setStressedVMs(status);
          setIsStressTesting(status.length > 0);
        } else {
          setStressedVMs([]);
          setIsStressTesting(false);
        }
      } catch (error) {
        console.error('Error polling stress status:', error);
        setStressedVMs([]);
        setIsStressTesting(false);
      }
    };

    if (isStressTesting) {
      interval = setInterval(pollStressStatus, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isStressTesting, selectedVMs]);

  const handleToggleVM = (vmIp: string) => {
    setSelectedVMs(prev => 
      prev.includes(vmIp)
        ? prev.filter(ip => ip !== vmIp)
        : [...prev, vmIp]
    );
  };

  const handleStartStressTest = async () => {
    try {
      setIsLoadingStress(true);
      
      if (selectedVMs.length === 0) {
        setAlert({
          open: true,
          message: 'Please select at least one VM to stress test',
          severity: 'error',
        });
        return;
      }

      await stressService.startStressTest({
        vms: selectedVMs,
        level: stressLevel,
        force: true,
      });
      setIsStressTesting(true);
      setAlert({
        open: true,
        message: 'Stress test started successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error in handleStartStressTest:', error);
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to start stress test',
        severity: 'error',
      });
    } finally {
      setIsLoadingStress(false);
    }
  };

  const handleStopStressTest = async () => {
    try {
      setIsLoadingStress(true);
      
      await stressService.stopStressTest(selectedVMs);
      setIsStressTesting(false);
      setStressedVMs([]);
      setAlert({
        open: true,
        message: 'Stress test stopped successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error in handleStopStressTest:', error);
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to stop stress test',
        severity: 'error',
      });
    } finally {
      setIsLoadingStress(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle variant="h4">
        <ScienceIcon fontSize="large" />
        Test Page
      </PageTitle>
      
      <VMSelectionCard elevation={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ComputerIcon color="primary" sx={{ mr: 1, fontSize: '2rem' }} />
          <Typography variant="h6">Virtual Machines</Typography>
        </Box>

        {isLoadingVMs ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select VMs from your optimization space to run stress tests.
            </Typography>
            <List>
              {availableVMs.map((vm) => (
                <ListItem key={vm.id} disablePadding>
                  <ListItemButton 
                    dense 
                    onClick={() => handleToggleVM(vm.ip)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedVMs.includes(vm.ip)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={vm.name}
                      secondary={vm.ip}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </VMSelectionCard>

      <StressTestingCard elevation={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SpeedIcon color="primary" sx={{ mr: 1, fontSize: '2rem' }} />
          <Typography variant="h6">Stress Testing</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Stress Level</InputLabel>
              <Select
                value={stressLevel}
                label="Stress Level"
                onChange={(e) => setStressLevel(e.target.value as 'low' | 'medium' | 'high')}
                disabled={isStressTesting || isLoadingStress}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartStressTest}
                disabled={isStressTesting || isLoadingStress || selectedVMs.length === 0}
                fullWidth
              >
                {isLoadingStress ? <CircularProgress size={24} /> : 'Start Stress Test'}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleStopStressTest}
                disabled={!isStressTesting || isLoadingStress}
                fullWidth
              >
                {isLoadingStress ? <CircularProgress size={24} /> : 'Stop Stress Test'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {stressedVMs.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Currently Stressed VMs:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stressedVMs.map((vm) => (
                <StressLevelChip
                  key={vm}
                  label={vm}
                  level={stressLevel}
                />
              ))}
            </Box>
          </Box>
        )}
      </StressTestingCard>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Test;