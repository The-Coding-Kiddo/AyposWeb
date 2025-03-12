import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Fade, useTheme, Grid, AppBar, Toolbar } from '@mui/material';
import Plot from 'react-plotly.js';

interface ChartData {
  power: string;
  env_temp_cur: string;
  now_timestamp: string;
  future_timestamp: string;
  env_temp_15min: string;
  power_future_15min: string;
}

const Temperature = () => {
  const theme = useTheme();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://141.196.83.136:8003/prom/get_chart_data/temperature/20');
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
          const last20Data = result.data.slice(-20);
          setData(last20Data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Set up interval
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const commonConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'temperature_charts',
      height: 1000,
      width: 1500,
      scale: 2
    }
  };

  const commonLayoutSettings = {
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
    margin: { t: 60, b: 100, l: 60, r: 20 },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'closest',
    xaxis: { 
      title: {
        text: 'Time',
        font: {
          size: 14,
          color: theme.palette.text.secondary,
          family: theme.typography.fontFamily
        }
      },
      type: 'date',
      gridcolor: theme.palette.divider,
      tickfont: {
        size: 12,
        family: theme.typography.fontFamily,
        color: theme.palette.text.secondary
      }
    }
  };

  const powerLayout = {
    ...commonLayoutSettings,
    title: {
      text: 'Power Consumption ',
      font: {
        size: 20,
        color: theme.palette.text.primary,
        family: theme.typography.fontFamily,
        weight: 400
      }
    },
    yaxis: { 
      title: {
        text: 'Power (W)',
        font: {
          size: 14,
          color: theme.palette.text.secondary,
          family: theme.typography.fontFamily
        }
      },
      gridcolor: theme.palette.divider,
      tickfont: {
        size: 12,
        family: theme.typography.fontFamily,
        color: theme.palette.text.secondary
      }
    }
  };

  const tempLayout = {
    ...commonLayoutSettings,
    title: {
      text: 'Environmental Temperature  ',
      font: {
        size: 20,
        color: theme.palette.text.primary,
        family: theme.typography.fontFamily,
        weight: 400
      }
    },
    yaxis: { 
      title: {
        text: 'Temperature (°C)',
        font: {
          size: 14,
          color: theme.palette.text.secondary,
          family: theme.typography.fontFamily
        }
      },
      gridcolor: theme.palette.divider,
      tickfont: {
        size: 12,
        family: theme.typography.fontFamily,
        color: theme.palette.text.secondary
      }
    }
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
            Environmental Temperature
          </Typography>
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
                  height: '100%'
                }}
              >
                {loading ? (
                  <Typography>Loading...</Typography>
                ) : (
                  <Plot
                    data={[
                      {
                        x: data.map(item => item.now_timestamp),
                        y: data.map(item => parseFloat(item.power)),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Current Power',
                        line: { color: '#1976d2', width: 2 },
                        marker: { size: 6 }
                      },
                      {
                        x: data.map(item => item.future_timestamp),
                        y: data.map(item => parseFloat(item.power_future_15min)),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Predicted Power',
                        line: { color: '#4caf50', width: 2, dash: 'dash' },
                        marker: { size: 6 }
                      }
                    ]}
                    layout={powerLayout}
                    config={commonConfig}
                    style={{ width: '100%', height: '400px' }}
                  />
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
                  height: '100%'
                }}
              >
                {loading ? (
                  <Typography>Loading...</Typography>
                ) : (
                  <Plot
                    data={[
                      {
                        x: data.map(item => item.now_timestamp),
                        y: data.map(item => parseFloat(item.env_temp_cur)),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Current Temperature',
                        line: { color: '#ff9800', width: 2 },
                        marker: { size: 6 }
                      },
                      {
                        x: data.map(item => item.future_timestamp),
                        y: data.map(item => parseFloat(item.env_temp_15min)),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Predicted Temperature',
                        line: { color: '#f44336', width: 2, dash: 'dash' },
                        marker: { size: 6 }
                      }
                    ]}
                    layout={tempLayout}
                    config={commonConfig}
                    style={{ width: '100%', height: '400px' }}
                  />
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
