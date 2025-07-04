import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  useTheme,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TerminalIcon from '@mui/icons-material/Terminal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';

import SummaryStats from '../components/Migration/SummaryStats';
import ResourceDistributionChart from '../components/Migration/ResourceDistributionChart';
import MigrationAdviceCard from '../components/Migration/MigrationAdviceCard';
import VerifiedMigration from '../components/Migration/VerifiedMigration';
import { useMigrationData, useGainAfterData } from '../components/Migration/hooks';
import { config } from '../config/env';

// Constants
const API_BASE_URL = config.apiUrl;
const REFRESH_INTERVAL = 30000; // 30 seconds

interface VMPlacementData {
  data_center: string;
  id: number;
  physical_machines: Array<{
    status: 'blocked' | 'open';
    name: string;
    power_consumption: number;
    vms: {
      active: Array<{
        status: 'blocked' | 'open';
        name: string;
        power: number;
        confg: {
          cpu: number;
          ram: number;
          disk: number;
        };
      }>;
      inactive: Array<{
        status: 'blocked' | 'open';
        name: string;
        power: number;
        confg: {
          cpu: number;
          ram: number;
          disk: number;
        };
      }>;
    };
  }>;
}

interface VMCardProps {
  vm: {
    name: string;
    power: number;
    status: 'blocked' | 'open';
    confg: {
      cpu: number;
      ram: number;
      disk: number;
    };
  };
  vmId: string;
  isActive: boolean;
  expandedVMs: Record<string, boolean>;
  toggleVMDetails: (vmId: string) => void;
  theme: any;
}

const VMCard = ({ vm, vmId, isActive, expandedVMs, toggleVMDetails, theme }: VMCardProps) => (
  <Box
    sx={{
      p: 1.5,
      bgcolor: theme.palette.grey[50],
      borderRadius: 1,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: theme.palette.grey[200],
      opacity: isActive ? 1 : 0.7,
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      mb: 1
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
      }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: isActive ? theme.palette.success.main : theme.palette.error.main,
          }}
        />
        <Typography variant="subtitle2" sx={{ 
          fontWeight: 'medium',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {vm.name}
          {vm.status === 'blocked' && (
            <LockIcon sx={{ 
              fontSize: '0.875rem',
              color: theme.palette.warning.main,
              opacity: 0.8
            }} />
          )}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {vm.power.toFixed(2)}W
        </Typography>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            toggleVMDetails(vmId);
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>

    <Collapse in={expandedVMs[vmId]}>
      <Box sx={{ 
        mt: 1,
        p: 1.5,
        bgcolor: 'white',
        borderRadius: 1, 
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.palette.grey[200],
      }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Status
            </Typography>
            <Typography variant="body2" sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}>
              {vm.status === 'blocked' ? (
                <>
                  <LockIcon sx={{ 
                    fontSize: '1rem',
                    color: theme.palette.warning.main
                  }} />
                  Blocked
                </>
              ) : (
                'Open'
              )}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              CPU Cores
            </Typography>
            <Typography variant="body2">
              {vm.confg.cpu}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              RAM
            </Typography>
            <Typography variant="body2">
              {vm.confg.ram} GB
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Disk Size
            </Typography>
            <Typography variant="body2">
              {vm.confg.disk} GB
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Power
            </Typography>
            <Typography variant="body2">
              {vm.power.toFixed(2)}W
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Collapse>
  </Box>
);

const getMessageColor = (message: string, theme: any): string => {
  if (message.includes('Error') || message.includes('BadRequestException')) {
    return theme.palette.error.light;
  } else if (message.includes('DEBUG')) {
    return theme.palette.info.light;
  } else if (message.includes('Attempting')) {
    return theme.palette.warning.light;
  } else if (message.includes('completed') || message.includes('Migration completed')) {
    return theme.palette.success.light;
  }
  return 'white';
};

const MigrationProgress = ({ open, progress, onClose }: { 
  open: boolean; 
  progress: string[]; 
  onClose: () => void;
}) => {
  const theme = useTheme();

  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon sx={{ color: theme.palette.primary.main }} />
          <Typography>Migration Progress</Typography>
        </Box>
        {progress.length > 0 && (
          <LinearProgress 
            sx={{ 
              width: 100,
              borderRadius: 1,
              backgroundColor: theme.palette.grey[200]
            }} 
          />
        )}
      </DialogTitle>
      <DialogContent sx={{ 
        mt: 1,
        bgcolor: theme.palette.grey[900],
        p: 0
      }}>
        <Box sx={{ 
          p: 3,
          height: '100%',
          maxHeight: '60vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.grey[800],
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.grey[600],
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.grey[500],
          },
        }}>
          {progress.length > 0 ? (
            progress.map((message, index) => (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  color: getMessageColor(message, theme),
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  mb: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  borderLeft: `3px solid ${getMessageColor(message, theme)}`,
                  pl: 2,
                  py: 0.5,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '0 4px 4px 0',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                {message}
              </Typography>
            ))
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              color: 'white',
              opacity: 0.7
            }}>
              <CircularProgress size={20} />
              <Typography>Starting migration process...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        px: 3,
        py: 2,
        bgcolor: theme.palette.grey[900]
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ 
            minWidth: 100,
            textTransform: 'none'
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Migration = () => {
  const theme = useTheme();
  
  // Essential states
  const [vmPlacementData, setVmPlacementData] = useState<VMPlacementData | null>(null);
  const [isLoadingVmPlacement, setIsLoadingVmPlacement] = useState(false);
  const [expandedVMs, setExpandedVMs] = useState<Record<string, boolean>>({});
  const [showVerifiedSection, setShowVerifiedSection] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [migrationMode] = useState<'auto' | 'semiauto'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<string[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  
  // Hooks for migration functionality
  const { gainBeforeData, migrationAdviceData, isLoadingGainData, fetchMigrationData } = useMigrationData();
  const { gainAfterData, isLoading: isLoadingGainAfter, fetchGainAfterData } = useGainAfterData();

  // Essential functions
  const toggleVMDetails = (vmId: string) => {
    setExpandedVMs(prev => ({
      ...prev,
      [vmId]: !prev[vmId]
    }));
  };

  const fetchVmPlacementData = async () => {
    try {
      setIsLoadingVmPlacement(true);
      const response = await fetch(`${API_BASE_URL}/prom/get_chart_data/vm_placement`);
      if (!response.ok) {
        throw new Error(`Failed to fetch VM placement data: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw API response:', data); // Debug log
      setVmPlacementData(data); // Use the data directly since it already has the correct structure
    } catch (error) {
      console.error('Error fetching VM placement data:', error);
    } finally {
      setIsLoadingVmPlacement(false);
    }
  };

  const handleApproveMigration = async () => {
    try {
      setIsProcessing(true);
      setMigrationProgress([]);
      setHasProgress(true);
      
      const approvalResponse = await fetch(`${API_BASE_URL}/prom/migration/decisions4?run_migration=true`, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!approvalResponse.ok) {
        throw new Error('Failed to approve migration');
      }

      const reader = approvalResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          const lines = text.split('\n').filter(line => line.trim());
          
          setMigrationProgress(prev => [...prev, ...lines]);
        }
      }

      // If approval is successful, show verified section and fetch gain after data
      setShowVerifiedSection(true);
      await fetchGainAfterData();
      
    } catch (error) {
      console.error('Error during migration approval:', error);
      setMigrationProgress(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineMigration = async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`${API_BASE_URL}/prom/migration/decisions4?run_migration=false`, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to decline migration');
      }

      // Hide verified section if it was shown
      setShowVerifiedSection(false);
      
    } catch (error) {
      console.error('Error declining migration:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Data fetching effect
  useEffect(() => {
    console.log('Initial data fetch');
    fetchVmPlacementData();
    const intervalId = setInterval(() => {
      console.log('Interval data fetch');
      fetchVmPlacementData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  // Add effect to monitor vmPlacementData changes
  useEffect(() => {
    if (vmPlacementData) {
      const blockedPMs = vmPlacementData.physical_machines.filter(pm => pm.status === 'blocked').length;
      const blockedVMs = vmPlacementData.physical_machines.reduce((acc, pm) => {
        const activeBlocked = pm.vms.active.filter(vm => vm.status === 'blocked').length;
        const inactiveBlocked = pm.vms.inactive.filter(vm => vm.status === 'blocked').length;
        return acc + activeBlocked + inactiveBlocked;
      }, 0);

      console.log('VM Placement Data updated:', {
        timestamp: new Date().toISOString(),
        pmCount: vmPlacementData.physical_machines.length,
        blockedPMs,
        totalVMs: vmPlacementData.physical_machines.reduce((acc, pm) => 
          acc + pm.vms.active.length + pm.vms.inactive.length, 0
        ),
        blockedVMs
      });
    }
  }, [vmPlacementData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '100vw', minHeight: '100vh' }}>
      <Box sx={{ p: { xs: 0.5, sm: 1 }, flexGrow: 1 }}>
        <Grid container spacing={{ xs: 0.5, sm: 1 }}>
          <SummaryStats />
          
          <Grid item xs={12} container spacing={{ xs: 0.5, sm: 1 }}>
            <ResourceDistributionChart 
              vmPlacementData={vmPlacementData}
              isLoading={isLoadingVmPlacement}
              onRefresh={fetchVmPlacementData}
            />
            
            <MigrationAdviceCard
              isCardExpanded={isCardExpanded}
              setIsCardExpanded={setIsCardExpanded}
              gainBeforeData={gainBeforeData}
              migrationAdviceData={migrationAdviceData}
              isLoadingGainData={isLoadingGainData}
              migrationMode={migrationMode}
              onRefresh={(e) => {
                e.stopPropagation();
                fetchMigrationData();
              }}
            />
          </Grid>

          {/* Migration Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2,
              mt: 2, 
              mb: 1,
              alignItems: 'center'
            }}>
              {hasProgress && (
                <Button
                  variant="outlined"
                  onClick={() => setShowProgress(true)}
                  startIcon={<VisibilityIcon />}
                  sx={{ 
                    py: 1.5,
                    borderColor: theme.palette.grey[300],
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      borderColor: theme.palette.grey[400],
                      bgcolor: 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  Show Progress
                </Button>
              )}
              <Button
                variant="contained"
                color="error"
                onClick={handleDeclineMigration}
                disabled={isProcessing}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 200
                }}
              >
                {isProcessing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Decline Migration'
                )}
              </Button>
              <Button
                variant="contained"
                startIcon={!isProcessing && <PowerSettingsNewIcon />}
                onClick={handleApproveMigration}
                disabled={isProcessing}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  bgcolor: theme.palette.success.main,
                  '&:hover': { bgcolor: theme.palette.success.dark },
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 200
                }}
              >
                {isProcessing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Approve Migration'
                )}
              </Button>
            </Box>
          </Grid>

          {/* Verified Migration Section */}
          {showVerifiedSection && (
            <Grid item xs={12}>
              <VerifiedMigration
                gainAfterData={gainAfterData}
                isLoading={isLoadingGainAfter}
              />
            </Grid>
          )}

          {/* PM & VM Monitoring Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">PMs & VMs Monitoring</Typography>
              </Box>
              
              {isLoadingVmPlacement ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : vmPlacementData?.physical_machines ? (
                <Grid container spacing={2}>
                  {vmPlacementData.physical_machines.map((pm) => (
                    <Grid item xs={12} sm={6} md={4} key={pm.name}>
                      <Card 
                        sx={{ 
                          borderRadius: 2,
                          boxShadow: 2,
                          height: '100%',
                          minHeight: 250,
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: pm.status === 'blocked' ? theme.palette.warning.light : 'transparent',
                          '&::before': pm.status === 'blocked' ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            bgcolor: theme.palette.warning.main
                          } : undefined
                        }}
                      >
                        <CardContent sx={{ 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column',
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 2,
                            pb: 1,
                            borderBottom: 1,
                            borderColor: 'divider'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: theme.palette.primary.main,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                {pm.name}
                                {pm.status === 'blocked' && (
                                  <LockIcon sx={{ 
                                    fontSize: '1rem',
                                    color: theme.palette.warning.main,
                                    opacity: 0.8
                                  }} />
                                )}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                            >
                              {pm.power_consumption.toFixed(2)}W
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                          }}>
                            {/* Active VMs */}
                            {pm.vms.active.map((vm, index) => (
                              <VMCard
                                key={`${pm.name}-${vm.name}-active-${index}`}
                                vm={vm}
                                vmId={`${pm.name}-${vm.name}-active-${index}`}
                                isActive={true}
                                expandedVMs={expandedVMs}
                                toggleVMDetails={toggleVMDetails}
                                theme={theme}
                              />
                            ))}
                            
                            {/* Inactive VMs */}
                            {pm.vms.inactive.map((vm, index) => (
                              <VMCard
                                key={`${pm.name}-${vm.name}-inactive-${index}`}
                                vm={vm}
                                vmId={`${pm.name}-${vm.name}-inactive-${index}`}
                                isActive={false}
                                expandedVMs={expandedVMs}
                                toggleVMDetails={toggleVMDetails}
                                theme={theme}
                              />
                            ))}
                            
                            {pm.vms.active.length === 0 && pm.vms.inactive.length === 0 && (
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                height: '100%',
                                color: theme.palette.text.secondary,
                              }}>
                                <Typography variant="body2">No VMs running</Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  p: 3,
                  color: theme.palette.text.secondary
                }}>
                  <Typography>No monitoring data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <MigrationProgress 
        open={showProgress} 
        progress={migrationProgress}
        onClose={() => setShowProgress(false)}
      />
    </Box>
  );
};

export default Migration;
