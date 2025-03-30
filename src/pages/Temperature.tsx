import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Paper, Typography, Fade, useTheme, Grid, AppBar, Toolbar, CircularProgress, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Brush, ReferenceLine
} from 'recharts';

// Extend the Window interface to include Google Charts
declare global {
  interface Window {
    google?: {
      charts?: any;
    };
  }
}

interface ChartData {
  power: string;
  flag: string;
  env_temp_cur: string;
  now_timestamp: string;
  future_timestamp: string;
  env_temp_min: string;
  power_future_min: string;
}

// Define processed data format for Recharts
interface ProcessedChartPoint {
  timestamp: number;
  timeLabel: string;
  currentPower?: number;
  predictedPower?: number;
  currentTemp?: number;
  predictedTemp?: number;
}

const Temperature = () => {
  const theme = useTheme();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use refs to keep track of the interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalMs = 10000; // 10 seconds refresh rate

  // Create a memoized fetchData function with useCallback
  const fetchData = useCallback(async (showLoadingIndicator = false) => {
    try {
      if (showLoadingIndicator) {
        setRefreshing(true);
      }
      
      const response = await fetch('http://141.196.83.136:8003/prom/get_chart_data/temperature');
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        // Filter valid data points
        const validData = result.data.filter((item: any) => 
          item.now_timestamp && 
          item.future_timestamp && 
          item.power && 
          item.power_future_min &&
          item.env_temp_cur && 
          item.env_temp_min
        );
        
        // Sort by timestamp
        const sortedData = [...validData].sort((a, b) => 
          new Date(a.now_timestamp).getTime() - new Date(b.now_timestamp).getTime()
        );
        
        // Limit to last 20 records
        const last20Data = sortedData.slice(-20);
        
        console.log(`Data updated at ${new Date().toLocaleTimeString()}:`, last20Data);
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

  // Process data for recharts - combined function that handles both temperature and power
  const prepareChartData = (): ProcessedChartPoint[] => {
    if (!data || data.length === 0) {
      return [];
    }

    // Create a map to store combined data points by timestamp
    const dataMap = new Map<number, ProcessedChartPoint>();
    
    // Process current data points
    data.forEach(item => {
      const timestamp = new Date(item.now_timestamp).getTime();
      const formattedTime = new Date(timestamp).toLocaleTimeString();
      
      // Initialize or get existing data point
      const dataPoint = dataMap.get(timestamp) || {
        timestamp,
        timeLabel: formattedTime
      };
      
      // Add current values
      dataPoint.currentPower = parseFloat(item.power);
      dataPoint.currentTemp = parseFloat(item.env_temp_cur);
      
      // Save to map
      dataMap.set(timestamp, dataPoint);
    });
    
    // Process future/predicted data points
    data.forEach(item => {
      const timestamp = new Date(item.future_timestamp).getTime();
      const formattedTime = new Date(timestamp).toLocaleTimeString();
      
      // Initialize or get existing data point
      const dataPoint = dataMap.get(timestamp) || {
        timestamp,
        timeLabel: formattedTime
      };
      
      // Add predicted values
      dataPoint.predictedPower = parseFloat(item.power_future_min);
      dataPoint.predictedTemp = parseFloat(item.env_temp_min);
      
      // Save to map
      dataMap.set(timestamp, dataPoint);
    });
    
    // Convert map to array and sort by timestamp
    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  };
  
  // Format the chart data
  const chartData = prepareChartData();
  
  // Find current time to display a marker between current and predicted data
  const nowTimestamp = data.length > 0 
    ? Math.max(...data.map(item => new Date(item.now_timestamp).getTime())) 
    : null;

  // Custom tooltip formatter for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 1.5,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  display: 'inline-block',
                  mr: 1
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {entry.name}: {entry.value.toFixed(2)} {entry.unit}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
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
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: theme.palette.text.primary, 
                    fontWeight: 500 
                  }}
                >
                  Power Consumption
                </Typography>
                
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
                ) : chartData.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Typography variant="h6" color="text.secondary">No power data available</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 55 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="timeLabel" 
                        stroke={theme.palette.text.secondary} 
                        angle={-45}
                        textAnchor="end"
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                      />
                      <YAxis 
                        stroke={theme.palette.text.secondary}
                        label={{ 
                          value: 'Power (W)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: theme.palette.text.secondary }
                        }}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ paddingTop: '10px' }}
                      />
                      {nowTimestamp && (
                        <ReferenceLine 
                          x={chartData.find(item => item.timestamp === nowTimestamp)?.timeLabel} 
                          stroke="#ff7300" 
                          label={{ 
                            value: "Now", 
                            position: "top", 
                            fill: "#ff7300",
                            fontSize: 12
                          }} 
                        />
                      )}
                      <Line
                        type="monotone"
                        name="Current Power"
                        dataKey="currentPower"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        unit="W"
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        name="Predicted Power"
                        dataKey="predictedPower"
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        unit="W"
                        connectNulls
                      />
                      <Brush 
                        dataKey="timeLabel" 
                        height={30} 
                        stroke={theme.palette.primary.light}
                        y={365}
                        travellerWidth={10}
                        fill={theme.palette.background.paper}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: theme.palette.text.primary, 
                    fontWeight: 500 
                  }}
                >
                  Environmental Temperature
                </Typography>
                
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
                ) : chartData.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Typography variant="h6" color="text.secondary">No temperature data available</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 55 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="timeLabel" 
                        stroke={theme.palette.text.secondary} 
                        angle={-45}
                        textAnchor="end"
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                      />
                      <YAxis 
                        stroke={theme.palette.text.secondary}
                        label={{ 
                          value: 'Temperature (°C)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: theme.palette.text.secondary }
                        }}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ paddingTop: '10px' }}
                      />
                      {nowTimestamp && (
                        <ReferenceLine 
                          x={chartData.find(item => item.timestamp === nowTimestamp)?.timeLabel} 
                          stroke="#ff7300" 
                          label={{ 
                            value: "Now", 
                            position: "top", 
                            fill: "#ff7300",
                            fontSize: 12
                          }} 
                        />
                      )}
                      <Line
                        type="monotone"
                        name="Current Temperature"
                        dataKey="currentTemp"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        unit="°C"
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        name="Predicted Temperature"
                        dataKey="predictedTemp"
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        unit="°C"
                        connectNulls
                      />
                      <Brush 
                        dataKey="timeLabel" 
                        height={30} 
                        stroke={theme.palette.primary.light}
                        y={365}
                        travellerWidth={10}
                        fill={theme.palette.background.paper}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Fade>
      </Box>
    </Box>
  );
};

export default Temperature;
