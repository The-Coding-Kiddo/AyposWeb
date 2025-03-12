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

const WeightInput = styled(TextField)(({ theme }) => ({
  width: 70,
  '& input': {
    padding: '8px',
    textAlign: 'center',
  },
}));

interface Weights {
  energy: number;
  balance: number;
  overload: number;
  allocation: number;
}

const Home = () => {
  const theme = useTheme();
  
  // Environmental Temperature Section
  const [envTimeUnit, setEnvTimeUnit] = useState('1');
  const [envSteps, setEnvSteps] = useState('15');
  const [envModelType, setEnvModelType] = useState('lstm');

  // Preventive Maintenance Section
  const [prevTimeUnit, setPrevTimeUnit] = useState('1');
  const [prevSteps, setPrevSteps] = useState('15');
  const [prevModelType, setPrevModelType] = useState('lstm');

  // Migration Section
  const [migrationTime, setMigrationTime] = useState('1');
  const [migrationModel, setMigrationModel] = useState('xgboost');
  const [migrationMethod, setMigrationMethod] = useState('mathematical');

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

  const timeOptions = ['1', '5'];
  const stepOptions = Array.from({ length: 30 }, (_, i) => ((i + 1) * 5).toString());
  const modelTypes = ['lstm'];

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

  const handleSliderChange = (type: keyof Weights) => (
    event: Event,
    newValue: number | number[]
  ) => {
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

  const sliderMarks = [
    {
      value: 50,
      label: '50%'
    }
  ];

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 80px)', overflow: 'auto' }}>
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
                onChange={(e: SelectChangeEvent<string>) => setEnvTimeUnit(e.target.value)}
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
                onChange={(e: SelectChangeEvent<string>) => setEnvSteps(e.target.value)}
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
                onChange={(e: SelectChangeEvent<string>) => setEnvModelType(e.target.value)}
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
                onChange={(e: SelectChangeEvent<string>) => setPrevTimeUnit(e.target.value)}
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
                onChange={(e: SelectChangeEvent<string>) => setPrevSteps(e.target.value)}
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
                onChange={(e: SelectChangeEvent<string>) => setPrevModelType(e.target.value)}
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
            
            <IconWrapper>
              <TimelineIcon fontSize="small" />
              <Typography variant="body2">Time Configuration</Typography>
            </IconWrapper>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Script Time Unit </InputLabel>
              <StyledSelect
                value={migrationTime}
                label="Script Time Unit "
                onChange={(e: SelectChangeEvent<string>) => setMigrationTime(e.target.value)}
              >
                {timeOptions.slice(0).map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </StyledSelect>
            </FormControl>

            <IconWrapper>
              <SwapHorizIcon fontSize="small" />
              <Typography variant="body2">Migration Method</Typography>
            </IconWrapper>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Method Type</InputLabel>
              <StyledSelect
                value={migrationMethod}
                label="Method Type"
                onChange={(e: SelectChangeEvent<string>) => setMigrationMethod(e.target.value)}
              >
                {['mathematical', 'AI'].map((option) => (
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
                value={migrationModel}
                label="Model Type"
                onChange={(e: SelectChangeEvent<string>) => setMigrationModel(e.target.value)}
              >
                {['xgboost', 'multi reg'].map((option) => (
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
                Weight Configuration
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
                      sx={{ minWidth: 130 }}
                      step={1}
                      min={0}
                      max={100}
                      marks={sliderMarks}
                      valueLabelDisplay="auto"
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

      {/* Start Monitoring Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color={isMonitoring ? "error" : "primary"}
          onClick={() => setIsMonitoring(!isMonitoring)}
          sx={{
            minWidth: 280,
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
              backgroundColor: isMonitoring 
                ? theme.palette.error.dark
                : theme.palette.primary.dark,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: isMonitoring
                ? `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`
                : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              opacity: 0.8,
            },
            transition: 'all 0.3s ease-in-out',
            px: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 1
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
            {isMonitoring ? (
              <>
                <StopIcon /> Stop Monitoring
              </>
            ) : (
              <>
                <PlayArrowIcon /> Start Monitoring
              </>
            )}
          </Box>
        </Button>
      </Box>
    </Box>
  );
};

export default Home;
