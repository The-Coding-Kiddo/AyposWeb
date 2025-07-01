import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Paper, Typography, Fade, useTheme, Grid, AppBar, Toolbar, CircularProgress, IconButton, Tooltip, Chip, Button, Snackbar, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Plot from 'react-plotly.js';
import { Layout, PlotData, Config } from 'plotly.js';

// Extend the Window interface to include Google Charts
declare global {
  interface Window {
    google?: {
      charts?: any;
    };
  }
}

// Define the structure of our data
interface ChartData {
  power: string;
  flag: string;
  env_temp_cur: string;
  now_timestamp: string;
  future_timestamp: string;
  env_temp_min: string;
  power_future_min: string;
}

const Temperature = () => {
  const theme = useTheme();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [powerZoom, setPowerZoom] = useState<{xRange?: [number, number]; yRange?: [number, number]}>({});
  const [tempZoom, setTempZoom] = useState<{xRange?: [number, number]; yRange?: [number, number]}>({});
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Use refs to keep track of the interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalMs = 5000; // 5 seconds refresh rate

  // Create a memoized fetchData function with useCallback
  const fetchData = useCallback(async (showLoadingIndicator = false) => {
    try {
      if (showLoadingIndicator) {
        setRefreshing(true);
      }
      
      const response = await fetch('http://10.150.1.167:8003/prom/get_chart_data/temperature/20');
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        // Sort by timestamp first to ensure we get the latest data
        const sortedData = [...result.data].sort((a, b) => 
          new Date(b.now_timestamp).getTime() - new Date(a.now_timestamp).getTime()
        );
        
        // Log the most recent flag
        console.log('Most recent flag:', sortedData[0].flag);
        
        // Filter valid data points
        const validData = sortedData.filter((item: any) => 
          item.now_timestamp && 
          item.future_timestamp && 
          item.power && 
          item.power_future_min &&
          item.env_temp_cur && 
          item.env_temp_min
        );
        
        // Limit to last 20 records but maintain chronological order
        const last20Data = validData.slice(-20).sort((a, b) => 
          new Date(a.now_timestamp).getTime() - new Date(b.now_timestamp).getTime()
        );
        
        console.log(`Data updated at ${new Date().toLocaleTimeString()}:`, {
          totalRecords: result.data.length,
          validRecords: validData.length,
          displayedRecords: last20Data.length,
          latestFlag: last20Data[last20Data.length - 1]?.flag
        });
        
        setData(last20Data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchData(true);
  };

  // Set up the interval for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchData(true);
    
    // Set up interval for auto-refresh
    intervalRef.current = setInterval(() => {
      console.log(`Auto-refreshing data at ${new Date().toLocaleTimeString()}`);
      fetchData(false);
    }, updateIntervalMs);
    
    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  // Process data for Plotly charts
  const preparePlotlyData = () => {
    if (!data || data.length === 0) return { powerData: [], tempData: [] };

    const currentTimestamps = data.map(item => new Date(item.now_timestamp));
    const futureTimestamps = data.map(item => new Date(item.future_timestamp));
    const currentPower = data.map(item => parseFloat(item.power));
    const predictedPower = data.map(item => parseFloat(item.power_future_min));
    const currentTemp = data.map(item => parseFloat(item.env_temp_cur));
    const predictedTemp = data.map(item => parseFloat(item.env_temp_min));

    // Calculate min and max values for range sliders
    const powerMin = Math.min(...currentPower, ...predictedPower);
    const powerMax = Math.max(...currentPower, ...predictedPower);
    const tempMin = Math.min(...currentTemp, ...predictedTemp);
    const tempMax = Math.max(...currentTemp, ...predictedTemp);

    const powerData: Partial<PlotData>[] = [
      {
        x: currentTimestamps,
        y: currentPower,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Current Power',
        line: { color: theme.palette.primary.main, width: 2 },
        marker: { size: 6 }
      },
      {
        x: futureTimestamps,
        y: predictedPower,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Predicted Power',
        line: { color: theme.palette.success.main, width: 2, dash: 'dash' },
        marker: { size: 6 }
      },
      // Range slider trace
      {
        x: [...currentTimestamps, ...futureTimestamps],
        y: Array(currentTimestamps.length + futureTimestamps.length).fill(0.5),
        type: 'scatter',
        mode: 'lines',
        name: 'Y Range',
        yaxis: 'y2',
        line: { color: 'transparent' },
        showlegend: false,
        hoverinfo: 'skip' as const
      }
    ];

    const tempData: Partial<PlotData>[] = [
      {
        x: currentTimestamps,
        y: currentTemp,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Current Temperature',
        line: { color: theme.palette.primary.main, width: 2 },
        marker: { size: 6 }
      },
      {
        x: futureTimestamps,
        y: predictedTemp,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Predicted Temperature',
        line: { color: theme.palette.success.main, width: 2, dash: 'dash' },
        marker: { size: 6 }
      },
      // Range slider trace
      {
        x: [...currentTimestamps, ...futureTimestamps],
        y: Array(currentTimestamps.length + futureTimestamps.length).fill(0.5),
        type: 'scatter',
        mode: 'lines',
        name: 'Y Range',
        yaxis: 'y2',
        line: { color: 'transparent' },
        showlegend: false,
        hoverinfo: 'skip' as const
      }
    ];

    return { 
      powerData, 
      tempData,
      ranges: {
        power: { min: powerMin, max: powerMax },
        temp: { min: tempMin, max: tempMax }
      }
    };
  };

  const { powerData, tempData, ranges } = preparePlotlyData();

  // Common layout settings for both charts
  const commonLayoutSettings: Partial<Layout> = {
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2,
      x: 0.5,
      xanchor: 'center',
      yanchor: 'top',
      font: {
        size: 12,
        family: theme.typography.fontFamily,
        color: theme.palette.text.secondary
      },
      bgcolor: 'rgba(255, 255, 255, 0)',
      bordercolor: 'rgba(255, 255, 255, 0)'
    },
    margin: { t: 60, b: 100, l: 60, r: 60 }, // Increased right margin for Y-axis range slider
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'closest',
    xaxis: {
      type: 'date',
      gridcolor: theme.palette.divider,
      tickfont: { size: 12, color: theme.palette.text.secondary },
      showgrid: true,
      rangeslider: { visible: true }
    },
    yaxis2: {
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      range: [0, 1],
      rangeslider: {
        visible: true,
        thickness: 0.1,
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: theme.palette.divider
      }
    }
  };

  // Add handlers for zoom events
  const handlePowerZoom = (event: any) => {
    if (event['xaxis.range[0]']) {
      setPowerZoom({
        xRange: [new Date(event['xaxis.range[0]']).getTime(), new Date(event['xaxis.range[1]']).getTime()],
        yRange: [event['yaxis.range[0]'], event['yaxis.range[1]']]
      });
    }
  };

  const handleTempZoom = (event: any) => {
    if (event['xaxis.range[0]']) {
      setTempZoom({
        xRange: [new Date(event['xaxis.range[0]']).getTime(), new Date(event['xaxis.range[1]']).getTime()],
        yRange: [event['yaxis.range[0]'], event['yaxis.range[1]']]
      });
    }
  };

  // Modify the power layout to use preserved zoom
  const powerLayout: Partial<Layout> = {
    ...commonLayoutSettings,
    yaxis: {
      title: 'Power (W)',
      gridcolor: theme.palette.divider,
      tickfont: { size: 12, color: theme.palette.text.secondary },
      titlefont: { size: 14, color: theme.palette.text.primary },
      showgrid: true,
      rangemode: 'tozero',
      fixedrange: false,
      range: powerZoom.yRange || (ranges ? [ranges.power.min * 0.9, ranges.power.max * 1.1] : undefined)
    },
    xaxis: {
      ...commonLayoutSettings.xaxis,
      range: powerZoom.xRange ? [new Date(powerZoom.xRange[0]), new Date(powerZoom.xRange[1])] : undefined
    }
  };

  // Modify the temperature layout to use preserved zoom
  const tempLayout: Partial<Layout> = {
    ...commonLayoutSettings,
    yaxis: {
      title: 'Temperature (°C)',
      gridcolor: theme.palette.divider,
      tickfont: { size: 12, color: theme.palette.text.secondary },
      titlefont: { size: 14, color: theme.palette.text.primary },
      showgrid: true,
      rangemode: 'tozero',
      fixedrange: false,
      range: tempZoom.yRange || (ranges ? [ranges.temp.min * 0.9, ranges.temp.max * 1.1] : undefined)
    },
    xaxis: {
      ...commonLayoutSettings.xaxis,
      range: tempZoom.xRange ? [new Date(tempZoom.xRange[0]), new Date(tempZoom.xRange[1])] : undefined
    }
  };

  // Common Plotly config with additional modebar buttons
  const plotConfig: Partial<Config> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'] as ('lasso2d' | 'select2d')[],
    toImageButtonOptions: {
      format: 'png' as const,
      filename: 'temperature_monitoring',
      height: 1000,
      width: 1500,
      scale: 2
    }
  };

  // Handle temperature decision
  const handleTemperatureDecision = async (approval: boolean) => {
    try {
      setDecisionLoading(true);
      const response = await fetch('http://10.150.1.167:8003/prom/temperature/decisions?approval=' + approval, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to send temperature decision: ${response.statusText}`);
      }

      const result = await response.json();
      setAlert({
        open: true,
        message: result.message || `Temperature change ${approval ? 'approved' : 'declined'} successfully`,
        severity: 'success'
      });

      // Refresh data after decision
      await fetchData(true);
    } catch (error) {
      console.error('Error sending temperature decision:', error);
      setAlert({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to send temperature decision',
        severity: 'error'
      });
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: theme.palette.background.default }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: 3
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              color: 'text.primary',
              fontWeight: 500,
              flex: 1,
              textAlign: "center",
              letterSpacing: '-0.5px'
            }}
          >
            Environmental Temperature & Power Monitoring (Last 20 Records)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {lastUpdated && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
              >
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={handleRefresh} 
                color="primary" 
                disabled={loading || refreshing}
                sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        {/* Temperature Decision Panel */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              Temperature Change Decision
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleTemperatureDecision(true)}
                disabled={decisionLoading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  minWidth: 120,
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleTemperatureDecision(false)}
                disabled={decisionLoading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  minWidth: 120,
                }}
              >
                Decline
              </Button>
            </Box>
          </Box>
        </Paper>

        <Fade in timeout={800}>
          <Grid container spacing={3}>
            {/* Power Chart */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 500 
                    }}
                  >
                    Power Consumption
                  </Typography>
                  {data.length > 0 && (
                    <Chip
                      label={data[data.length - 1]?.flag || 'N/A'}
                      color={data[data.length - 1]?.flag === '25' ? 'success' : 'warning'}
                      size="medium"
                      sx={{ 
                        height: 32,
                        '& .MuiChip-label': {
                          px: 2,
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }
                      }}
                    />
                  )}
                </Box>
                
                {refreshing && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10, 
                      zIndex: 10,
                      bgcolor: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      p: 0.5
                    }}
                  >
                    <CircularProgress size={24} thickness={5} />
                  </Box>
                )}
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="h6" sx={{ ml: 2 }} color="text.secondary">
                      Loading power data...
                    </Typography>
                  </Box>
                ) : data.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Typography variant="h6" color="text.secondary">No power data available</Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 400 }}>
                    <Plot
                      data={powerData}
                      layout={powerLayout}
                      config={plotConfig}
                      style={{ width: '100%', height: '100%' }}
                      onRelayout={handlePowerZoom}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Temperature Chart */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 500 
                    }}
                  >
                    Environmental Temperature
                  </Typography>
                  {data.length > 0 && (
                    <Chip
                      label={data[data.length - 1]?.flag || 'N/A'}
                      color={data[data.length - 1]?.flag === '25' ? 'success' : 'warning'}
                      size="medium"
                      sx={{ 
                        height: 32,
                        '& .MuiChip-label': {
                          px: 2,
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }
                      }}
                    />
                  )}
                </Box>
                
                {refreshing && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10, 
                      zIndex: 10,
                      bgcolor: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      p: 0.5
                    }}
                  >
                    <CircularProgress size={24} thickness={5} />
                  </Box>
                )}
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="h6" sx={{ ml: 2 }} color="text.secondary">
                      Loading temperature data...
                    </Typography>
                  </Box>
                ) : data.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Typography variant="h6" color="text.secondary">No temperature data available</Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 400 }}>
                    <Plot
                      data={tempData}
                      layout={tempLayout}
                      config={plotConfig}
                      style={{ width: '100%', height: '100%' }}
                      onRelayout={handleTempZoom}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Fade>
      </Box>

      {/* Snackbar for alerts */}
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
    </Box>
  );
};

export default Temperature;
