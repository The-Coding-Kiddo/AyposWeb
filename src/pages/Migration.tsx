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
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ComputerIcon from '@mui/icons-material/Computer';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import MemoryIcon from '@mui/icons-material/Memory';
import BoltIcon from '@mui/icons-material/Bolt';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
);

const Migration = () => {
  const theme = useTheme();
  const [selectedCompute, setSelectedCompute] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [vmData, setVmData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVMs, setActiveVMs] = useState(0);
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });
  const [migrationAdvice, setMigrationAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(true);
  const [totalPower, setTotalPower] = useState<number>(0);
  const [computeCount, setComputeCount] = useState<number>(0);
  const [vmCount, setVmCount] = useState<number>(0);

  useEffect(() => {
    const fetchVmData = async () => {
      try {
        const response = await fetch('http://141.196.83.136:8003/prom/monitoring');
        const result = await response.json();
        setVmData(result.data);
      } catch (error) {
        console.error('Error fetching VM data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVmData();
  }, []);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const response = await fetch('http://141.196.83.136:8003/prom/monitoring');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setMonitoringData(result.data);
        prepareChartData(result.data);
        calculateTotalPower(result.data);
        countComputeNodesAndVMs(result.data);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoringData();
  }, []);

  const prepareChartData = (data: any[]) => {
    // Filter out compute nodes with no VMs
    const filteredData = data.filter(pm => pm.virtual_machines && pm.virtual_machines.length > 0);
    
    const labels = filteredData.map(pm => pm.host);
    const activeVMs = filteredData.map(pm => pm.virtual_machines.length);
    const inactiveVMs = filteredData.map(pm => 0); // Assuming all VMs are active for simplicity

    setChartData({
      labels: labels,
      datasets: [
        {
          label: 'Active VMs',
          data: activeVMs,
          backgroundColor: theme.palette.success.main,
        },
        {
          label: 'Inactive VMs',
          data: inactiveVMs,
          backgroundColor: theme.palette.warning.main,
        },
      ],
    });
  };

  const calculateTotalPower = (data: any[]) => {
    let total = 0;

    data.forEach(pm => {
      pm.virtual_machines.forEach(vm => {
        const power = vm.powerConsumption;
        if (power) {
          total += power;
        }
      });
    });

    setTotalPower(total);
  };

  const countComputeNodesAndVMs = (data: any[]) => {
    // Filter out compute nodes with no VMs
    const filteredData = data.filter(pm => pm.virtual_machines && pm.virtual_machines.length > 0);
    const computeNodes = filteredData.length; // Count of compute nodes with VMs
    const totalVMs = filteredData.reduce((acc, pm) => acc + pm.virtual_machines.length, 0); // Total VMs

    setComputeCount(computeNodes);
    setVmCount(totalVMs);
  };

  // Core VM data structure
  const vmDataStructure = [
    { id: 1, vm: 'Kapali', pm: 'compute1', gucTuketimi: 0.0 },
    { id: 2, vm: 'Acik', pm: 'compute2', gucTuketimi: 130.0 },
    { id: 3, vm: 'Kapali', pm: 'compute3', gucTuketimi: 0.0 },
    { id: 4, vm: 'Acik', pm: 'compute4', gucTuketimi: 114.0 },
    { id: 5, vm: 'aypos_tester1', pm: 'compute4', gucTuketimi: 75.0 },
    { id: 6, vm: 'aypos_tester2', pm: 'compute4', gucTuketimi: 0.0 },
    { id: 7, vm: 'aypos_tester3', pm: 'compute4', gucTuketimi: 0.0 },
    { id: 8, vm: 'aypos_tester0', pm: 'compute4', gucTuketimi: 0.0 },
    { id: 9, vm: 'aypos_tester7', pm: 'compute4', gucTuketimi: 0.0 },
  ];

  // Function to group VMs by compute node
  const groupByCompute = (vms: typeof vmDataStructure) => {
    return vms.reduce((acc, vm) => {
      if (!acc[vm.pm]) {
        acc[vm.pm] = {
          active: 0,
          inactive: 0,
          vms: [],
        };
      }
      acc[vm.pm].vms.push(vm);
      if (vm.gucTuketimi > 0) {
        acc[vm.pm].active += 1;
      } else {
        acc[vm.pm].inactive += 1;
      }
      return acc;
    }, {} as Record<string, { active: number; inactive: number; vms: typeof vmDataStructure }>);
  };

  // Prepare data for visualization
  const computeGroups = groupByCompute(vmDataStructure);
  const computeNodes = Object.keys(computeGroups);

  // Filter VMs
  const filteredVMs = vmDataStructure.filter(vm => {
    const matchesSearch = vm.vm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vm.pm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true :
                         statusFilter === 'active' ? vm.gucTuketimi > 0 :
                         vm.gucTuketimi === 0;
    return matchesSearch && matchesStatus;
  });

  const fetchMigrationAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const response = await fetch('http://141.196.83.136:8003/prom/migration/message');
      const result = await response.json();

      if (result.messages.length > 0) {
        const message = result.messages[0].message;
        // Format the message for display
        const formattedMessage = message
          .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newline
          .replace(/Current power utilization :/, 'Current Power Utilization:')
          .replace(/Proposed power utilization:/, 'Proposed Power Utilization:')
          .replace(/Expected power gain: %/, 'Expected Power Gain:');
        
        setMigrationAdvice(formattedMessage);
      }
    } catch (error) {
      console.error('Error fetching migration advice:', error);
    } finally {
      setLoadingAdvice(false);
    }
  };

  useEffect(() => {
    fetchMigrationAdvice(); // Initial fetch for migration advice
    const intervalId = setInterval(() => {
      fetchMigrationAdvice();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '100vw', minHeight: '100vh' }}>
      <Box sx={{ p: { xs: 0.5, sm: 1 }, flexGrow: 1 }}>
        <Grid container spacing={{ xs: 0.5, sm: 1 }}>
          {/* Summary Stats */}
          <Grid item xs={12} container spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 1 }}>
            <Grid item xs={4} sm={4}>
              <Paper sx={{ bgcolor: 'background.paper', boxShadow: 3, height: '70px' }}>
                <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Compute Nodes</Typography>
                  <Typography variant="h6" sx={{ lineHeight: 1 }}>{computeCount}</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={4} sm={4}>
              <Paper sx={{ bgcolor: 'background.paper', boxShadow: 3, height: '70px' }}>
                <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Virtual Machines</Typography>
                  <Typography variant="h6" sx={{ lineHeight: 1 }}>{vmCount}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Main Charts Section */}
          <Grid item xs={12} container spacing={{ xs: 0.5, sm: 1 }}>
            {/* VM Distribution Chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: { xs: 1, sm: 1.5 }, height: '320px', bgcolor: 'background.paper', boxShadow: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Resource Distribution by Node</Typography>
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <Box sx={{ height: 'calc(100% - 60px)' }}>
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.dataset.label || '';
                              return `${label}: ${context.parsed.y} VMs`;
                            },
                          },
                        },
                      },
                      scales: {
                        x: { stacked: true },
                        y: { 
                          stacked: true,
                          beginAtZero: true,
                          title: { display: true, text: 'Number of VMs' }
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Power Optimization Section */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ height: '320px', bgcolor: 'background.paper', boxShadow: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom>Migration Advice</Typography>
                  
                  {loadingAdvice ? (
                    <Typography variant="body1">Loading migration advice...</Typography>
                  ) : (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {migrationAdvice}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton onClick={fetchMigrationAdvice}>
                    <RefreshIcon />
                  </IconButton>
                  <Button variant="contained" color="primary" onClick={fetchMigrationAdvice}>
                    Refresh Data
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Approve Migration Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 1 }}>
              <Button
                variant="contained"
                startIcon={<PowerSettingsNewIcon />}
                onClick={() => {
                  const verifiedSection = document.getElementById('verifiedMigration');
                  if (verifiedSection) {
                    verifiedSection.style.display = 'block';
                  }
                }}
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
          <Grid item xs={12}>
            <Paper 
              id="verifiedMigration"
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: 'background.paper', 
                boxShadow: 3,
                display: 'none'
              }}
            >
              <Typography variant="h6" gutterBottom>Verified Migration Results</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1" color="success.main">Success</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="subtitle2" color="text.secondary">Power Reduction</Typography>
                  <Typography variant="body1">395.59 W (77.6%)</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="subtitle2" color="text.secondary">Completion Time</Typography>
                  <Typography variant="body1">00:00:05</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* PM & VM Monitoring Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>Pms&VMs Monitoring</Typography>
              {loading ? (
                <Typography variant="body1">Loading monitoring data...</Typography>
              ) : (
                monitoringData.length > 0 ? (
                  <Grid container spacing={2}>
                    {monitoringData.map((pmData) => (
                      <Grid item xs={12} sm={6} md={4} key={pmData.host}>
                        <Card sx={{ mb: 2, borderRadius: 2, backgroundColor: '#ffffff', boxShadow: 2, height: '250px' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'center' }}>{pmData.host}</Typography>
                            <Box sx={{ 
                              maxHeight: '150px', // Set a fixed height for the VM section
                              overflowY: 'auto', // Enable vertical scrolling
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              mt: 1 
                            }}>
                              {pmData.virtual_machines.length > 0 ? (
                                pmData.virtual_machines.map((vm: string, index: number) => (
                                  <Box key={index} sx={{ 
                                    width: '90%', 
                                    height: '40px', 
                                    bgcolor: '#e0e0e0', // Neutral background color
                                    color: 'black', 
                                    borderRadius: 1, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    m: 0.5,
                                    boxShadow: 1,
                                  }}>
                                    {vm}
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">No VMs running</Typography>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1">No monitoring data available.</Typography>
                )
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <IconButton onClick={() => window.location.reload()}>
                  <RefreshIcon />
                </IconButton>
                <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
                  Refresh Data
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Migration;
