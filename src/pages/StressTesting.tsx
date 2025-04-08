import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  Breadcrumbs,
  Link,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import HomeIcon from '@mui/icons-material/Home';
import { stressService } from '../services/stressService';

// Define the structure of our VM nodes
interface VMNode {
  id: string;
  name: string;
  ip: string;
}

// Remove the props interface since we'll get VMs from localStorage
// interface StressTestingProps {
//   selectedVMs: VMNode[];
// }

// Update component to not require props
const StressTesting: React.FC = () => {
  // Initialize with empty array, will be populated from localStorage
  const [selectedVMs, setSelectedVMs] = useState<VMNode[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [stressLevel, setStressLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [stressTestVMs, setStressTestVMs] = useState<string[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [isLoadingStress, setIsLoadingStress] = useState(false);
  const [stressedVMs, setStressedVMs] = useState<string[]>([]);
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Load selected VMs from localStorage
  useEffect(() => {
    const loadVMsFromStorage = () => {
      const storedVMs = localStorage.getItem('stressTestVMs');
      console.log('Loading VMs from storage:', storedVMs);
      
      if (storedVMs) {
        try {
          const parsedVMs = JSON.parse(storedVMs);
          console.log('Parsed VMs:', parsedVMs);
          setSelectedVMs(parsedVMs);
        } catch (error) {
          console.error('Error parsing stored VMs:', error);
          setAlert({
            open: true,
            message: 'Error loading VMs from storage. Please select VMs in the Monitoring page first.',
            severity: 'error',
          });
        }
      } else {
        console.log('No VMs found in storage');
        setAlert({
          open: true,
          message: 'No VMs found. Please select VMs in the Monitoring page first.',
          severity: 'info',
        });
      }
    };

    // Load VMs initially
    loadVMsFromStorage();

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stressTestVMs') {
        loadVMsFromStorage();
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array since we only want this to run once on mount

  // Add status polling for stress test
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStressStatus = async () => {
      try {
        // Get the currently selected VMs from the tree view
        const selectedVMList = selectedVMs.filter(vm => stressTestVMs.includes(vm.id));
        const vmIPs = selectedVMList.map(vm => vm.ip);
        
        console.log('Polling stress status for VMs:', vmIPs);
        
        if (vmIPs.length > 0) {
          const status = await stressService.getStressStatus(vmIPs);
          console.log('Stress status response:', status);
          setStressedVMs(status);
          // Only update isStressTesting if we're not already in a stress testing state
          if (!isStressTesting) {
            setIsStressTesting(status.length > 0);
          }
        } else {
          setStressedVMs([]);
          setIsStressTesting(false);
        }
      } catch (error) {
        console.error('Error polling stress status:', error);
        setStressedVMs([]);
        // Don't automatically set isStressTesting to false on error
        // This allows the stop button to remain enabled even if there's a temporary polling error
      }
    };

    // Start polling immediately and then every 5 seconds
    pollStressStatus();
    interval = setInterval(pollStressStatus, 5000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedVMs, stressTestVMs, isStressTesting]); // Added isStressTesting to dependencies

  // Handle VM selection for stress testing
  const handleStressTestVMSelection = (vmId: string) => {
    setStressTestVMs(prev => {
      if (prev.includes(vmId)) {
        return prev.filter(id => id !== vmId);
      } else {
        return [...prev, vmId];
      }
    });
  };

  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle reset
  const handleReset = () => {
    setActiveStep(0);
    setStressTestVMs([]);
  };

  // Start stress test
  const handleStartStressTest = async () => {
    try {
      setIsLoadingStress(true);
      
      // Get the VMs selected for stress testing
      const selectedVMList = selectedVMs.filter(vm => stressTestVMs.includes(vm.id));
      const vmIPs = selectedVMList.map(vm => vm.ip);
      
      // Log the selected VMs for debugging
      console.log('Selected VMs for stress test:', vmIPs);
      
      if (vmIPs.length === 0) {
        setAlert({
          open: true,
          message: 'Please select at least one VM to stress test',
          severity: 'error',
        });
        return;
      }

      await stressService.startStressTest({
        vms: vmIPs,
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

  // Stop stress test
  const handleStopStressTest = async () => {
    try {
      setIsLoadingStress(true);
      
      // Get the VMs selected for stress testing
      const selectedVMList = selectedVMs.filter(vm => stressTestVMs.includes(vm.id));
      const vmIPs = selectedVMList.map(vm => vm.ip);
      
      console.log('Stopping stress test for VMs:', vmIPs);
      
      await stressService.stopStressTest(vmIPs);
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

  // Steps for the stepper
  const steps = [
    {
      label: 'Select VMs',
      description: 'Select the VMs you want to include in the stress test.',
      content: (
        <Box sx={{ mt: 2 }}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              maxHeight: '300px', 
              overflow: 'auto',
              bgcolor: 'background.default'
            }}
          >
            {selectedVMs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                No VMs found. Please select VMs in the Monitoring page first.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {selectedVMs.map((vm) => (
                  <Grid item xs={12} sm={6} md={4} key={vm.id}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={stressTestVMs.includes(vm.id)}
                          onChange={() => handleStressTestVMSelection(vm.id)}
                          disabled={isStressTesting || isLoadingStress}
                          size="small"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2">{vm.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {vm.ip}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Box>
      ),
    },
    {
      label: 'Configure Stress Level',
      description: 'Select the stress level for the test.',
      content: (
        <Box sx={{ mt: 2 }}>
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Low:</strong> Minimal stress, suitable for testing basic functionality.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Medium:</strong> Moderate stress, tests system under typical load conditions.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>High:</strong> Maximum stress, tests system under extreme conditions.
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      label: 'Run Stress Test',
      description: 'Start or stop the stress test.',
      content: (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartStressTest}
              disabled={isStressTesting || isLoadingStress || stressTestVMs.length === 0}
              fullWidth
            >
              {isLoadingStress ? <CircularProgress size={24} /> : 'Start Stress Test'}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleStopStressTest}
              disabled={(!isStressTesting && stressedVMs.length === 0) || isLoadingStress}
              fullWidth
            >
              {isLoadingStress ? <CircularProgress size={24} /> : 'Stop Stress Test'}
            </Button>
          </Box>

          {stressedVMs.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Currently Stressed VMs:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {stressedVMs.map((vm) => (
                  <Paper
                    key={vm}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 
                        stressLevel === 'low' ? 'success.light' :
                        stressLevel === 'medium' ? 'warning.light' :
                        'error.light',
                      color: 
                        stressLevel === 'low' ? 'success.dark' :
                        stressLevel === 'medium' ? 'warning.dark' :
                        'error.dark',
                    }}
                  >
                    <Typography variant="body2">{vm}</Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link href="/monitoring" color="inherit">
          Monitoring
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <SpeedIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Stress Testing
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <SpeedIcon color="primary" sx={{ mr: 1, fontSize: '2rem' }} />
        <Typography variant="h5">Stress Testing</Typography>
        <Button 
          sx={{ ml: 'auto' }}
          onClick={() => {
            const storedVMs = localStorage.getItem('stressTestVMs');
            console.log('Current localStorage contents:', storedVMs);
            setAlert({
              open: true,
              message: storedVMs ? `Found VMs in storage: ${storedVMs}` : 'No VMs in storage',
              severity: 'info'
            });
          }}
        >
          Debug Storage
        </Button>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography>{step.description}</Typography>
                {step.content}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleReset : handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={index === 0 && stressTestVMs.length === 0}
                    >
                      {index === steps.length - 1 ? 'Reset' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Alert Snackbar */}
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

export default StressTesting; 