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
} from '@mui/material';

import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import SummaryStats from '../components/Migration/SummaryStats';
import ResourceDistributionChart from '../components/Migration/ResourceDistributionChart';
import MigrationAdviceCard from '../components/Migration/MigrationAdviceCard';
import VerifiedMigration from '../components/Migration/VerifiedMigration';
import { useMigrationData, useGainAfterData } from '../components/Migration/hooks';

// Constants
const API_BASE_URL = 'http://141.196.83.136:8003';
const REFRESH_INTERVAL = 30000; // 30 seconds

interface VMPlacementData {
  data_center: string;
  id: number;
  physical_machines: Array<{
    name: string;
    power_consumption: number;
    vms: {
      active: Array<{
        name: string;
        power: number;
        confg: {
          cpu: number;
          ram: number;
          disk: number;
        };
      }>;
      inactive: Array<{
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
  theme: any; // Using any for theme since it's a complex MUI type
}

const VMCard = ({ vm, vmId, isActive, expandedVMs, toggleVMDetails, theme }: VMCardProps) => (
  <Box
    sx={{
      p: 1.5,
      bgcolor: theme.palette.grey[50],
      borderRadius: 1,
      border: 1,
      borderColor: theme.palette.grey[200],
      opacity: isActive ? 1 : 0.7,
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
        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
          {vm.name}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {vm.power.toFixed(2)}W
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => toggleVMDetails(vmId)}
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
        border: 1,
        borderColor: theme.palette.grey[200],
      }}>
        <Grid container spacing={2}>
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

const Migration = () => {
  const theme = useTheme();
  
  // Essential states
  const [vmPlacementData, setVmPlacementData] = useState<VMPlacementData | null>(null);
  const [isLoadingVmPlacement, setIsLoadingVmPlacement] = useState(false);
  const [expandedVMs, setExpandedVMs] = useState<Record<string, boolean>>({});
  const [showVerifiedSection, setShowVerifiedSection] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [migrationMode] = useState<'auto' | 'semiauto'>('auto');
  
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
      setVmPlacementData(data);
    } catch (error) {
      console.error('Error fetching VM placement data:', error);
    } finally {
      setIsLoadingVmPlacement(false);
    }
  };

  const handleApproveMigration = async () => {
    setShowVerifiedSection(true);
    await fetchGainAfterData();
  };

  // Data fetching effect
  useEffect(() => {
    fetchVmPlacementData();
    const intervalId = setInterval(fetchVmPlacementData, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

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

          {/* Approve Migration Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1 }}>
              <Button
                variant="contained"
                startIcon={<PowerSettingsNewIcon />}
                onClick={handleApproveMigration}
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
                Approve Migration
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
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: theme.palette.primary.main,
                              }}
                            >
                              {pm.name}
                            </Typography>
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
    </Box>
  );
};

export default Migration;
