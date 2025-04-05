import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  useTheme,
  styled,
  SelectChangeEvent,
  Slider,
  TextField,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import BuildIcon from '@mui/icons-material/Build';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TimelineIcon from '@mui/icons-material/Timeline';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import SpeedIcon from '@mui/icons-material/Speed';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BalanceIcon from '@mui/icons-material/Balance';
import BoltIcon from '@mui/icons-material/Bolt';
import GridViewIcon from '@mui/icons-material/GridView';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import HandymanIcon from '@mui/icons-material/Handyman';
import EditIcon from '@mui/icons-material/Edit';
import { monitoringService, MonitoringStatus } from '../services/monitoringService';
import DebugConsole from '../components/DebugConsole';
import MonitoringSystem from './MonitoringSystem';

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: theme.spacing(1.5),
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
  color: theme.palette.text.primary,
  fontWeight: 600,
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
}));

const WeightSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
  },
  '& .MuiSlider-track': {
    height: 4,
  },
  '& .MuiSlider-rail': {
    height: 4,
    opacity: 0.5,
    backgroundColor: theme.palette.mode === 'dark' ? '#bfbfbf' : '#d8d8d8',
  },
  '& .MuiSlider-mark': {
    backgroundColor: theme.palette.primary.main,
    height: 12,
    width: 2,
    '&.MuiSlider-markActive': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  '& .MuiSlider-markLabel': {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));

const WeightInput = styled(TextField)(() => ({
  width: 70,
  '& input': {
    padding: '8px',
    textAlign: 'center',
  },
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 500,
  '&.running': {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
  },
  '&.stopped': {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
}));

interface Weights {
  energy: number;
  balance: number;
  overload: number;
  allocation: number;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const StatusCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  minWidth: 280,
  position: 'relative',
  overflow: 'hidden',
}));

const StatusIndicator = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 3,
  backgroundColor: 'transparent',
  '&.loading': {
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.primary.light}, 
      ${theme.palette.primary.main})`,
    backgroundSize: '200% 100%',
    animation: '$shimmer 2s infinite',
  },
  '&.success': {
    backgroundColor: theme.palette.success.main,
  },
  '&.error': {
    backgroundColor: theme.palette.error.main,
  },
  '&.partial': {
    backgroundColor: theme.palette.warning.main,
  },
}));

// Add keyframes for the loading animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: 0 0; }
  }
`;

// Insert the keyframes
const styleElement = document.createElement('style');
styleElement.type = 'text/css';
styleElement.innerHTML = shimmerKeyframes;
document.head.appendChild(styleElement);

const Home = () => {
  const theme = useTheme();
  
  // Initialize all states from localStorage if available
  const savedState = localStorage.getItem('optimizationState');
  const parsedState = savedState ? JSON.parse(savedState) : null;

  const [hasSelectedOptimization, setHasSelectedOptimization] = useState(!!parsedState);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  
  // Initialize state from localStorage if available
  const [blockList, setBlockList] = useState<string[]>(parsedState?.unselectedVMs || []);
  // @ts-ignore - Will be used in future implementation
  const [selectedVMs, setSelectedVMs] = useState<string[]>(parsedState?.selectedVMs || []);
  const [optimizationState, setOptimizationState] = useState<{
    selectedVMs: string[];
    unselectedVMs: string[];
  }>(parsedState || {
    selectedVMs: [],
    unselectedVMs: []
  });

  // Environmental Temperature Section
  const [envTimeUnit, setEnvTimeUnit] = useState<string>('1');
  const [envSteps, setEnvSteps] = useState<string>('3');
  const [envModelType, setEnvModelType] = useState<string>('lstm');

  // Preventive Maintenance Section
  const [prevTimeUnit, setPrevTimeUnit] = useState<string>('1');
  const [prevSteps, setPrevSteps] = useState<string>('3');
  const [prevModelType, setPrevModelType] = useState<string>('lstm');

  // Migration Section
  const [migrationTime, setMigrationTime] = useState<string>('5');
  const [migrationModel, setMigrationModel] = useState<string>('mul_reg');
  const [migrationMethod, setMigrationMethod] = useState<string>('mathematical');
  const [migrationMode, setMigrationMode] = useState<'auto' | 'semiauto'>('auto');

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Weight Configuration Section
  const [weights, setWeights] = useState<Weights>({
    energy: 25,
    balance: 25,
    overload: 25,
    allocation: 25
  });
  const [isValid, setIsValid] = useState(true);
  const [weightError, setWeightError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  
  // Add state for the last configuration sent (for debug console)
  const [lastConfigSent, setLastConfigSent] = useState<any | null>(null);

  // Updated options to match endpoint expectations but keeping original time options
  const timeOptions = ['1', '5'];
  const stepOptions = ['3', ...Array.from({ length: 47 }, (_, i) => (i + 4).toString())];
  const modelTypes = ['lstm'];
  const migrationModelTypes = {
    direct: ['ssl'],
    indirect: ['xgboost', 'mul_reg']
  };
  const migrationMethodTypes = ['mathematical', 'AI'];

  // Inside the Home component, add new state
  const [estimationMethod, setEstimationMethod] = useState<'direct' | 'indirect'>('indirect');

  // Memoized validation function
  const validateWeightSum = useCallback(() => {
    const sum = Object.values(weights).reduce((a, b) => a + Number(b), 0);
    return Math.abs(sum - 100) < 0.001; // Using small epsilon for floating point comparison
  }, [weights]);

  // Real-time validation effect
  useEffect(() => {
    const isValidSum = validateWeightSum();
    setIsValid(isValidSum);
    setWeightError(!isValidSum);
  }, [weights, validateWeightSum]);

  const handleManualWeightChange = (type: keyof Weights) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value === '' ? 0 : parseInt(event.target.value);
    if (isNaN(newValue)) return;

    setWeights(prev => ({
      ...prev,
      [type]: Math.min(100, Math.max(0, Math.round(newValue)))
    }));
  };

  const handleSliderChange = (type: keyof Weights) => (_: Event, newValue: number | number[]) => {
    const value = Math.round(newValue as number);
    
    const newWeights = { ...weights };
    newWeights[type] = value;

    const remainingTypes = Object.keys(weights).filter(k => k !== type) as Array<keyof Weights>;
    const totalOthers = remainingTypes.reduce((sum, key) => sum + weights[key], 0);

    if (totalOthers > 0) {
      const scale = (100 - value) / totalOthers;
      remainingTypes.forEach(key => {
        newWeights[key] = Math.round(weights[key] * scale);
      });
    } else {
      // If all others are 0, distribute remaining evenly
      const remaining = Math.round((100 - value) / remainingTypes.length);
      remainingTypes.forEach(key => {
        newWeights[key] = remaining;
      });
    }

    setWeights(newWeights);
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const showAlert = (message: string, severity: AlertState['severity']) => {
    setAlert({
      open: true,
      message,
      severity,
    });
  };

  const handleMigrationModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: 'auto' | 'semiauto' | null,
  ) => {
    if (newMode !== null) {
      setMigrationMode(newMode);
    }
  };

  // Helper function to check if any service is running
  const isAnyServiceRunning = (status: MonitoringStatus | null): boolean => {
    if (!status) return false;
    
    return (
      status.statuses.migration.is_running ||
      status.statuses.environmental.is_running ||
      status.statuses.preventive.is_running
    );
  };

  const handleSelectChange = (event: SelectChangeEvent<unknown>) => {
    const setter = (value: string) => {
      if (event.target.name === 'envTimeUnit') setEnvTimeUnit(value);
      else if (event.target.name === 'envSteps') setEnvSteps(value);
      else if (event.target.name === 'envModelType') setEnvModelType(value);
      else if (event.target.name === 'prevTimeUnit') setPrevTimeUnit(value);
      else if (event.target.name === 'prevSteps') setPrevSteps(value);
      else if (event.target.name === 'prevModelType') setPrevModelType(value);
      else if (event.target.name === 'migrationTime') setMigrationTime(value);
      else if (event.target.name === 'migrationModel') setMigrationModel(value as string);
      else if (event.target.name === 'migrationMethod') setMigrationMethod(value as string);
      else if (event.target.name === 'estimationMethod') setEstimationMethod(value as 'direct' | 'indirect');
    };
    setter(event.target.value as string);
  };

  // Start polling when monitoring is active - we'll replace this with a constant polling approach
  useEffect(() => {
    // This effect is now only responsible for cleanup when component unmounts
    return () => {
      monitoringService.stopStatusPolling();
    };
  }, []);

  // Always check monitoring status, regardless of the isMonitoring state
  useEffect(() => {
    const fetchAndUpdateStatus = async () => {
      try {
        // Only show loading on initial fetch, not during regular status updates
        if (!monitoringStatus) {
          setIsStatusLoading(true);
        }
        
        // Directly get the status instead of checking if active
        const status = await monitoringService.getMonitoringStatus();
        
        // Determine if any service is running using our helper function
        const anyServiceRunning = isAnyServiceRunning(status);
        
        // Update the status display
        setMonitoringStatus(status);
        
        // Update isMonitoring state only if it's different from current state
        if (anyServiceRunning !== isMonitoring) {
          console.log(`Monitoring state changed: ${isMonitoring} -> ${anyServiceRunning}`);
          setIsMonitoring(anyServiceRunning);
        }
      } catch (error) {
        console.error('Error fetching monitoring status:', error);
      } finally {
        setIsStatusLoading(false);
      }
    };

    // Execute immediately when component mounts
    fetchAndUpdateStatus();
    
    // Set up polling every 3 seconds (decreased from 5 to be more responsive)
    // This will help detect when monitoring is started from the backend
    const pollingInterval = setInterval(fetchAndUpdateStatus, 3000);
    
    // Clean up on unmount
    return () => {
      clearInterval(pollingInterval);
    };
  }, []); // Empty dependency array means this only runs on mount

  // Add function to force immediate status update
  const forceStatusUpdate = async () => {
    try {
      setIsStatusLoading(true);
      const status = await monitoringService.getMonitoringStatus();
      setMonitoringStatus(status);
      
      const anyServiceRunning = isAnyServiceRunning(status);
      if (anyServiceRunning !== isMonitoring) {
        setIsMonitoring(anyServiceRunning);
      }
      
      return status;
    } catch (error) {
      console.error('Error in force status update:', error);
      return null;
    } finally {
      setIsStatusLoading(false);
    }
  };

  const renderStatusChip = (isRunning: boolean | undefined) => {
    // If status is undefined, return a default "Unknown" chip
    if (isRunning === undefined) {
      return (
        <StatusChip
          label="Unknown"
          className="stopped"
          size="small"
        />
      );
    }
    
    return (
      <StatusChip
        label={isRunning ? "Running" : "Stopped"}
        className={isRunning ? 'running' : 'stopped'}
        size="small"
      />
    );
  };

  // Handler for when optimization selection is saved
  const handleOptimizationSaved = (unselectedVMs: string[], selectedVMs: string[]) => {
    const newState = { selectedVMs, unselectedVMs };
    setBlockList(unselectedVMs);
    setSelectedVMs(selectedVMs);
    setOptimizationState(newState);
    setHasSelectedOptimization(true);
    
    // Save to localStorage
    localStorage.setItem('optimizationState', JSON.stringify(newState));
  };

  // Handler to edit optimization selection
  const handleEditOptimization = () => {
    setShowOptimizationDialog(true);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', overflow: 'auto' }}>
      {!hasSelectedOptimization ? (
        // Show only the MonitoringSystem component initially
        <MonitoringSystem 
          onSave={handleOptimizationSaved}
          initialBlockList={optimizationState.unselectedVMs}
          initialSelectedVMs={optimizationState.selectedVMs}
        />
      ) : (
        // Show the full Home page content after optimization selection
        <>
          <Box sx={{ p: 3 }}>
            {/* Add Edit Optimization button with block list count */}
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditOptimization}
              sx={{ mb: 3 }}
            >
              View Optimization Selection
            </Button>

            <Grid container spacing={3}>
              {/* Environmental Temperature Section */}
              <Grid item xs={12} md={2.7}>
                <StyledCard elevation={3}>
                  <SectionTitle variant="h6">
                    <ThermostatIcon color="primary" fontSize="large" />
                    Environmental Temperature
                  </SectionTitle>
                  
                  <IconWrapper>
                    <TimelineIcon fontSize="small" />
                    <Typography variant="body2">Time Configuration</Typography>
                  </IconWrapper>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Script Time Unit</InputLabel>
                    <StyledSelect
                      value={envTimeUnit}
                      label="Script Time Unit"
                      onChange={handleSelectChange}
                      name="envTimeUnit"
                    >
                      {timeOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>

                  <IconWrapper>
                    <SpeedIcon fontSize="small" />
                    <Typography variant="body2">Steps Configuration</Typography>
                  </IconWrapper>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Number of Steps</InputLabel>
                    <StyledSelect
                      value={envSteps}
                      label="Number of Steps"
                      onChange={handleSelectChange}
                      name="envSteps"
                    >
                      {stepOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>

                  <IconWrapper>
                    <ModelTrainingIcon fontSize="small" />
                    <Typography variant="body2">Model Selection</Typography>
                  </IconWrapper>
                  <FormControl fullWidth>
                    <InputLabel>Model Type</InputLabel>
                    <StyledSelect
                      value={envModelType}
                      label="Model Type"
                      onChange={handleSelectChange}
                      name="envModelType"
                    >
                      {modelTypes.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>
                </StyledCard>
              </Grid>

              {/* Preventive Maintenance Section */}
              <Grid item xs={12} md={2.7}>
                <StyledCard elevation={3}>
                  <SectionTitle variant="h6">
                    <BuildIcon color="primary" fontSize="large" />
                    Preventive Maintenance
                  </SectionTitle>
                  
                  <IconWrapper>
                    <TimelineIcon fontSize="small" />
                    <Typography variant="body2">Time Configuration</Typography>
                  </IconWrapper>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Script Time Unit</InputLabel>
                    <StyledSelect
                      value={prevTimeUnit}
                      label="Script Time Unit"
                      onChange={handleSelectChange}
                      name="prevTimeUnit"
                    >
                      {timeOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>

                  <IconWrapper>
                    <SpeedIcon fontSize="small" />
                    <Typography variant="body2">Steps Configuration</Typography>
                  </IconWrapper>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Number of Steps</InputLabel>
                    <StyledSelect
                      value={prevSteps}
                      label="Number of Steps"
                      onChange={handleSelectChange}
                      name="prevSteps"
                    >
                      {stepOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>

                  <IconWrapper>
                    <ModelTrainingIcon fontSize="small" />
                    <Typography variant="body2">Model Selection</Typography>
                  </IconWrapper>
                  <FormControl fullWidth>
                    <InputLabel>Model Type</InputLabel>
                    <StyledSelect
                      value={prevModelType}
                      label="Model Type"
                      onChange={handleSelectChange}
                      name="prevModelType"
                    >
                      {modelTypes.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>
                </StyledCard>
              </Grid>

              {/* Migration Advice Section */}
              <Grid item xs={12} md={2.7}>
                <StyledCard elevation={3}>
                  <SectionTitle variant="h6">
                    <SwapHorizIcon color="primary" fontSize="large" />
                    Migration Advice
                  </SectionTitle>
                  
                  {/* Vm Energy Estimation */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <ToggleButtonGroup
                      value={migrationMode}
                      exclusive
                      onChange={handleMigrationModeChange}
                      aria-label="migration mode"
                      size="small"
                      sx={{ 
                        mb: 1,
                        '& .MuiToggleButton-root': {
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          px: 2,
                          borderRadius: theme.spacing(1),
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                            }
                          }
                        }
                      }}
                    >
                      <ToggleButton value="auto" aria-label="auto mode">
                        <AutoFixHighIcon sx={{ mr: 0.5 }} fontSize="small" />
                        Auto
                      </ToggleButton>
                      <ToggleButton value="semiauto" aria-label="semi-auto mode" disabled>
                        <HandymanIcon sx={{ mr: 0.5 }} fontSize="small" />
                        Semi-Auto
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  
                  <IconWrapper>
                    <TimelineIcon fontSize="small" />
                    <Typography variant="body2">Time Configuration</Typography>
                  </IconWrapper>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Script Time Unit </InputLabel>
                    <StyledSelect
                      value={migrationTime}
                      label="Script Time Unit "
                      onChange={handleSelectChange}
                      name="migrationTime"
                    >
                      {timeOptions.slice(0).map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>

                  <IconWrapper>
                    <SwapHorizIcon fontSize="small" />
                    <Typography variant="body2">Migration Advice Method</Typography>
                  </IconWrapper>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Method Type</InputLabel>
                    <StyledSelect
                      value={migrationMethod}
                      label="Method Type"
                      onChange={handleSelectChange}
                      name="migrationMethod"
                    >
                      {migrationMethodTypes.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>

                  <IconWrapper>
                    <ModelTrainingIcon fontSize="small" />
                    <Typography variant="body2">Vm Energy Estimation</Typography>
                  </IconWrapper>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Estimation Method</InputLabel>
                    <StyledSelect
                      value={estimationMethod}
                      label="Estimation Method"
                      onChange={handleSelectChange}
                      name="estimationMethod"
                    >
                      <MenuItem value="direct">Direct</MenuItem>
                      <MenuItem value="indirect">Indirect</MenuItem>
                    </StyledSelect>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Model </InputLabel>
                    <StyledSelect
                      value={migrationModel}
                      label="Model Type"
                      onChange={handleSelectChange}
                      name="migrationModel"
                    >
                      {migrationModelTypes[estimationMethod].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>
                </StyledCard>
              </Grid>

              {/* Weight Configuration Section */}
              <Grid item xs={12} md={3.9}>
                <StyledCard elevation={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <BalanceIcon color="primary" fontSize="large" />
                      Weight Of Sustainability Criteria 
                    </SectionTitle>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        isValid ? 
                          <CheckCircleIcon sx={{ color: 'success.main' }} /> : 
                          <ErrorIcon sx={{ color: '#d32f2f' }} />
                      }
                      sx={{
                        minWidth: 'auto',
                        px: 2,
                        borderRadius: 2,
                        borderColor: isValid ? 'success.main' : '#d32f2f',
                        color: isValid ? 'success.main' : '#d32f2f',
                        '&:hover': {
                          borderColor: isValid ? 'success.dark' : '#9a0007',
                          backgroundColor: isValid ? 'success.lighter' : 'error.lighter',
                        }
                      }}
                    >
                      {isValid ? 'Valid' : 'Invalid'}
                    </Button>
                  </Box>

                  {/* Fixed height container for error message */}
                  <Box sx={{ height: 24, mb: 1 }}>  {/* Fixed height container */}
                    {weightError && (
                      <Typography 
                        color="error" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          fontSize: '0.75rem'
                        }}
                      >
                        <ErrorIcon fontSize="small" />
                        Weights must sum to 100%
                      </Typography>
                    )}
                  </Box>

                  {/* Weight sliders container with fixed height */}
                  <Box sx={{ height: 'calc(100% - 90px)' }}>  {/* Adjust the 90px based on your header height */}
                    {Object.entries(weights).map(([key, value]) => (
                      <Box key={key} sx={{ mb: 1.5 }}>
                        <IconWrapper>
                          {key === 'energy' && <BoltIcon fontSize="small" />}
                          {key === 'balance' && <BalanceIcon fontSize="small" />}
                          {key === 'overload' && <SpeedIcon fontSize="small" />}
                          {key === 'allocation' && <GridViewIcon fontSize="small" />}
                          <Typography variant="body2">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Typography>
                        </IconWrapper>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WeightSlider
                            value={value}
                            onChange={handleSliderChange(key as keyof Weights)}
                            aria-label={`${key} weight`}
                            size="small"
                          />
                          <WeightInput
                            value={value}
                            onChange={handleManualWeightChange(key as keyof Weights)}
                            inputProps={{ 
                              min: 0, 
                              max: 100,
                              step: 1
                            }}
                            size="small"
                            error={weightError}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </StyledCard>
              </Grid>
            </Grid>

            {/* Start and Stop Monitoring Buttons with Status */}
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  mb: 1,
                  color: isAnyServiceRunning(monitoringStatus) ? 'success.main' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {isAnyServiceRunning(monitoringStatus) ? (
                  <>
                    <CheckCircleIcon color="success" /> Monitoring is Active
                  </>
                ) : (
                  <>
                    <ErrorIcon color="error" /> Monitoring is Inactive
                  </>
                )}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                {/* Start Monitoring Button */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      
                      // First check current status to ensure UI is in sync with server
                      await forceStatusUpdate();
                      
                      // Double-check we're not already running after force update
                      if (isAnyServiceRunning(monitoringStatus)) {
                        showAlert('Monitoring is already running', 'info');
                        setIsLoading(false);
                        return;
                      }
                      
                      // Validate weights before starting
                      if (!isValid) {
                        showAlert('Please ensure weights sum to 100% before starting monitoring', 'error');
                        setIsLoading(false);
                        return;
                      }
                      
                      // Note: We don't automatically stop monitoring before starting
                      // This prevents unnecessary API calls on first load

                      // Format config object to match the exact format expected by the endpoint
                      const config = {
                        migration: {
                          script_time_unit: migrationTime,
                          estimation_method: estimationMethod,
                          model_type: migrationModel,
                          migration_method: migrationMethod === 'mathematical' ? 'migration_advices_la' : 'migration_advices_llm',
                          operation_mode: migrationMode,
                          block_list: blockList
                        },
                        environmental: {
                          number_of_steps: envSteps,
                          script_time_unit: envTimeUnit,
                          model_type: envModelType
                        },
                        preventive: {
                          number_of_steps: prevSteps,
                          script_time_unit: prevTimeUnit,
                          model_type: prevModelType
                        }
                      };

                      // Store the configuration for the debug console
                      setLastConfigSent(config);
                      
                      // Add enhanced logging for better readability in the console
                      console.log('%c Monitoring Configuration:', 'color: #0066ff; font-weight: bold; font-size: 14px;');
                      console.log('%c Migration Settings:', 'color: #4CAF50; font-weight: bold;');
                      console.table(config.migration);
                      console.log('%c Environmental Settings:', 'color: #FF9800; font-weight: bold;');
                      console.table(config.environmental);
                      console.log('%c Preventive Settings:', 'color: #E91E63; font-weight: bold;');
                      console.table(config.preventive);

                      try {
                        await monitoringService.startMonitoring(config);
                        
                        // Force multiple status updates to ensure UI reflects server state
                        // First update immediately after start request
                        await forceStatusUpdate();
                        
                        // Then after a short delay to give services time to start
                        setTimeout(async () => {
                          await forceStatusUpdate();
                        }, 1000);
                        
                        showAlert('Monitoring started successfully', 'success');
                      } catch (startError) {
                        console.error("Error starting monitoring:", startError);
                        showAlert(
                          startError instanceof Error ? startError.message : 'Failed to start monitoring',
                          'error'
                        );
                        // Force status update to ensure UI is in sync even after error
                        await forceStatusUpdate();
                      }
                    } catch (error) {
                      console.error('Start monitoring operation error:', error);
                      showAlert(
                        error instanceof Error ? error.message : 'An unexpected error occurred',
                        'error'
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || isAnyServiceRunning(monitoringStatus)}
                  sx={{
                    minWidth: 200,
                    height: 56,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: theme.shadows[4],
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)',
                      backgroundColor: theme.palette.primary.dark,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      opacity: 0.8,
                    },
                    transition: 'all 0.3s ease-in-out',
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&.Mui-disabled': {
                      backgroundColor: isAnyServiceRunning(monitoringStatus) 
                        ? theme.palette.grey[400] 
                        : theme.palette.action.disabledBackground,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 0,
                      },
                      '&::before': {
                        opacity: 0.3,
                      },
                    },
                  }}
                >
                  <Box component="span" sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.5rem',
                      mr: 1
                    }
                  }}>
                    <PlayArrowIcon /> Start Monitoring
                  </Box>
                </Button>

                {/* Stop Monitoring Button */}
                <Button
                  variant="contained"
                  color="error"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      
                      // First check current status to ensure UI is in sync with server
                      await forceStatusUpdate();
                      
                      // Double-check that monitoring is actually running after force update
                      if (!isAnyServiceRunning(monitoringStatus)) {
                        showAlert('Monitoring is not running', 'info');
                        setIsLoading(false);
                        return;
                      }
                      
                      // Stopping monitoring
                      try {
                        await monitoringService.stopMonitoring();
                        
                        // Force multiple status updates to ensure UI reflects server state
                        // First update immediately after stop request
                        await forceStatusUpdate();
                        
                        // Then after a short delay to give services time to stop
                        setTimeout(async () => {
                          await forceStatusUpdate();
                        }, 1000);
                        
                        showAlert('Monitoring stopped successfully', 'success');
                      } catch (stopError) {
                        console.error("Error stopping monitoring:", stopError);
                        showAlert(
                          stopError instanceof Error ? stopError.message : 'Failed to stop monitoring',
                          'error'
                        );
                        // Force status update to ensure UI is in sync even after error
                        await forceStatusUpdate();
                      }
                    } catch (error) {
                      console.error('Stop monitoring operation error:', error);
                      showAlert(
                        error instanceof Error ? error.message : 'An unexpected error occurred',
                        'error'
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !isAnyServiceRunning(monitoringStatus)}
                  sx={{
                    minWidth: 200,
                    height: 56,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: theme.shadows[4],
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)',
                      backgroundColor: theme.palette.error.dark,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                      opacity: 0.8,
                    },
                    transition: 'all 0.3s ease-in-out',
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&.Mui-disabled': {
                      backgroundColor: !isAnyServiceRunning(monitoringStatus) 
                        ? theme.palette.grey[400] 
                        : theme.palette.action.disabledBackground,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 0,
                      },
                      '&::before': {
                        opacity: 0.3,
                      },
                    },
                  }}
                >
                  <Box component="span" sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.5rem',
                      mr: 1
                    }
                  }}>
                    <StopIcon /> Stop Monitoring
                  </Box>
                </Button>
              </Box>

              {/* Status Display - Always Visible */}
              <StatusCard>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Monitoring Status
                </Typography>
                
                {!monitoringStatus ? (
                  <>
                    <CircularProgress size={20} />
                    <StatusIndicator className="loading" />
                  </>
                ) : (
                  <>
                    {/* Overall status summary */}
                    <Box sx={{ 
                      mb: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center' 
                    }}>
                      <StatusChip
                        label={
                          monitoringStatus.statuses.migration.is_running &&
                          monitoringStatus.statuses.environmental.is_running &&
                          monitoringStatus.statuses.preventive.is_running
                            ? "All Services Running"
                            : !monitoringStatus.statuses.migration.is_running &&
                              !monitoringStatus.statuses.environmental.is_running &&
                              !monitoringStatus.statuses.preventive.is_running
                                ? "All Services Stopped"
                                : "Partial Service"
                        }
                        className={
                          monitoringStatus.statuses.migration.is_running &&
                          monitoringStatus.statuses.environmental.is_running &&
                          monitoringStatus.statuses.preventive.is_running
                            ? "running"
                            : !monitoringStatus.statuses.migration.is_running &&
                              !monitoringStatus.statuses.environmental.is_running &&
                              !monitoringStatus.statuses.preventive.is_running
                                ? "stopped"
                                : "running"
                        }
                        size="medium"
                        sx={{ px: 2, py: 1, fontSize: '0.9rem', fontWeight: 'bold' }}
                      />
                    </Box>

                    {/* Individual service statuses */}
                    <Grid container spacing={2} alignItems="center" justifyContent="center">
                      <Grid item>
                        <Tooltip title="Migration Service Status">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Migration:
                            </Typography>
                            {renderStatusChip(monitoringStatus.statuses?.migration?.is_running)}
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item>
                        <Tooltip title="Environmental Service Status">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Env:
                            </Typography>
                            {renderStatusChip(monitoringStatus.statuses?.environmental?.is_running)}
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item>
                        <Tooltip title="Preventive Service Status">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Prev:
                            </Typography>
                            {renderStatusChip(monitoringStatus.statuses?.preventive?.is_running)}
                          </Box>
                        </Tooltip>
                      </Grid>
                    </Grid>
                    
                    {/* Subtle indicator at the bottom of the card */}
                    <StatusIndicator 
                      className={
                        isStatusLoading ? "loading" : 
                          isAnyServiceRunning(monitoringStatus)
                            ? "success" 
                            : !isAnyServiceRunning(monitoringStatus)
                                ? "error"
                                : "partial"
                      }
                    />
                  </>
                )}
              </StatusCard>
            </Box>
          </Box>

          {/* Dialog for editing optimization */}
          <Dialog
            open={showOptimizationDialog}
            onClose={() => setShowOptimizationDialog(false)}
            maxWidth="xl"
            fullWidth
          >
            <DialogTitle>Edit Optimization Selection</DialogTitle>
            <DialogContent>
              <MonitoringSystem 
                onSave={(unselectedVMs, selectedVMs) => {
                  const newState = { selectedVMs, unselectedVMs };
                  setBlockList(unselectedVMs);
                  setSelectedVMs(selectedVMs);
                  setOptimizationState(newState);
                  setShowOptimizationDialog(false);
                  
                  // Save to localStorage
                  localStorage.setItem('optimizationState', JSON.stringify(newState));
                }}
                isDialog={true}
                initialBlockList={optimizationState.unselectedVMs}
                initialSelectedVMs={optimizationState.selectedVMs}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowOptimizationDialog(false)}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={alert.open}
            autoHideDuration={6000}
            onClose={handleCloseAlert}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseAlert}
              severity={alert.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {alert.message}
            </Alert>
          </Snackbar>
          
          {/* COMMENT THIS LINE OUT TO REMOVE DEBUG CONSOLE */}
          <DebugConsole configData={lastConfigSent} />
        </>
      )}
    </Box>
  );
};

export default Home;
