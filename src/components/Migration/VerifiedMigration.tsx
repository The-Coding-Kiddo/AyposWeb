import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';

interface VerifiedMigrationProps {
  gainAfterData: {
    past_power: number;
    cur_power: number;
    prop_power: number;
    actual_ratio: number;
    val_ratio: number;
  } | null;
  isLoading: boolean;
}

const VerifiedMigration: React.FC<VerifiedMigrationProps> = ({
  gainAfterData,
  isLoading,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!gainAfterData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography color="text.secondary">No verification data available</Typography>
      </Box>
    );
  }

  const isValidated = gainAfterData.val_ratio >= 0.95;

  return (
    <Paper 
      sx={{ 
        p: 1.5, 
        mb: 2, 
        bgcolor: 'background.paper', 
        boxShadow: 3,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1.5 }}>Migration Verification Results</Typography>
      
      {/* Power Optimization Results */}
      <Box sx={{ 
        p: 2, 
        bgcolor: theme.palette.primary.light,
        color: 'white',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, opacity: 0.9, fontSize: '0.875rem' }}>
                Current Power
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {gainAfterData.cur_power.toFixed(2)} W
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                Accuracy of migration proposal
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold', 
                mb: 0.5,
                color: isValidated ? '#4caf50' : '#ff9800'
              }}>
                {(gainAfterData.val_ratio * 100).toFixed(2)}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                Actual Power Change
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold', 
                mb: 0.5,
                color: gainAfterData.actual_ratio > 0 ? '#4caf50' : '#ff9800'
              }}>
                {(gainAfterData.actual_ratio * 100).toFixed(2)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Summary Footer */}
      <Box sx={{ 
        mt: 1.5,
        p: 1.5,
        bgcolor: theme.palette.grey[50],
        borderRadius: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: 1,
        borderColor: theme.palette.grey[200]
      }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Previous Power Consumption
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
            {gainAfterData.past_power.toFixed(2)} W
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={isValidated ? "Optimization Verified" : "Verification Needed"}
            size="small"
            sx={{ 
              bgcolor: isValidated ? theme.palette.success.light : theme.palette.warning.light,
              color: isValidated ? theme.palette.success.dark : theme.palette.warning.dark,
              fontWeight: 'bold',
              height: '24px'
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default VerifiedMigration; 