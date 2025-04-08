import React from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { GainBeforeData, MigrationAdviceData } from './types';

interface MigrationAdviceCardProps {
  isCardExpanded: boolean;
  setIsCardExpanded: (expanded: boolean) => void;
  gainBeforeData: GainBeforeData | null;
  migrationAdviceData: MigrationAdviceData | null;
  isLoadingGainData: boolean;
  onRefresh: (e: React.MouseEvent) => void;
  migrationMode: 'auto' | 'semiauto';
}

const MigrationAdviceCard: React.FC<MigrationAdviceCardProps> = ({
  isCardExpanded,
  setIsCardExpanded,
  gainBeforeData,
  migrationAdviceData,
  isLoadingGainData,
  onRefresh,
  migrationMode,
}) => {
  const theme = useTheme();

  return (
    <Grid item xs={12} md={4}>
      <Paper 
        onClick={() => setIsCardExpanded(!isCardExpanded)}
        sx={{ 
          height: isCardExpanded ? 'auto' : '320px', 
          bgcolor: 'background.paper', 
          boxShadow: 3, 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 6,
          },
          position: isCardExpanded ? 'absolute' : 'relative',
          right: isCardExpanded ? 0 : 'auto',
          zIndex: isCardExpanded ? 1000 : 1,
          width: isCardExpanded ? '100%' : 'auto',
          maxHeight: isCardExpanded ? '80vh' : '320px',
          overflowY: isCardExpanded ? 'auto' : 'hidden'
        }}
      >
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 1,
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 2,
            py: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">Migration Advice</Typography>
              <Chip
                icon={<AutoFixHighIcon fontSize="small" />}
                label={`${migrationMode === 'auto' ? 'Auto' : 'Semi-Auto'} Mode`}
                size="small"
                sx={{
                  bgcolor: migrationMode === 'auto' ? theme.palette.success.light : theme.palette.warning.light,
                  color: migrationMode === 'auto' ? theme.palette.success.dark : theme.palette.warning.dark,
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  height: '24px',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isLoadingGainData && <CircularProgress size={20} />}
              <KeyboardArrowDownIcon 
                fontSize="small" 
                sx={{ 
                  transform: isCardExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease-in-out'
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {/* Power Gain Information */}
            {gainBeforeData && (
              <Box sx={{
                p: 1.5,
                bgcolor: theme.palette.primary.light,
                borderRadius: 1,
                color: 'white',
                position: 'sticky',
                top: 48,
                zIndex: 1
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Current Power
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {gainBeforeData.cur_power.toFixed(2)} W
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Proposed Power
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {gainBeforeData.prop_power.toFixed(2)} W
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Expected Gain
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: gainBeforeData.prop_gain > 0 ? '#4caf50' : '#f44336'
                      }}
                    >
                      {(gainBeforeData.prop_gain * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Migration Advice Table */}
            {migrationAdviceData && (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ 
                      '& th': { 
                        fontWeight: 'bold', 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        padding: '4px 8px'
                      } 
                    }}>
                      <TableCell>Virtual Machine</TableCell>
                      <TableCell>Current PM</TableCell>
                      <TableCell sx={{ width: 30, p: 0 }}></TableCell>
                      <TableCell>Proposed PM</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(migrationAdviceData).map(([vm, data]) => (
                      <TableRow key={vm}>
                        <TableCell sx={{ padding: '4px 8px' }}>
                          <Chip 
                            label={vm}
                            size="small"
                            sx={{ bgcolor: 'info.light', color: 'white', height: '24px' }}
                          />
                        </TableCell>
                        <TableCell sx={{ padding: '4px 8px' }}>
                          <Chip 
                            label={data.current_pm}
                            size="small"
                            sx={{ bgcolor: 'warning.light', height: '24px' }}
                          />
                        </TableCell>
                        <TableCell sx={{ 
                          p: 0, 
                          textAlign: 'center',
                          fontSize: '20px',
                          color: theme.palette.success.main,
                          fontWeight: 'bold'
                        }}>
                          →
                        </TableCell>
                        <TableCell sx={{ padding: '4px 8px' }}>
                          <Chip 
                            label={data.proposed_pm}
                            size="small"
                            sx={{ bgcolor: 'success.light', color: 'white', height: '24px' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {!gainBeforeData && !migrationAdviceData && !isLoadingGainData && (
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                No migration advice available at this time
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ 
          borderTop: 1,
          borderColor: theme.palette.grey[200],
          p: 1,
          bgcolor: theme.palette.grey[50],
          mt: 'auto',
          position: 'sticky',
          bottom: 0,
          zIndex: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton 
              onClick={onRefresh} 
              size="small"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
};

export default MigrationAdviceCard; 