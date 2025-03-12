import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Fade, useTheme, Grid, useMediaQuery, AppBar, Toolbar } from '@mui/material';
import Plot from 'react-plotly.js';

const Maintenance = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentPower, setCurrentPower] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://141.196.83.136:8003/prom/get_chart_data/maintenance/');
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
          const latestData = result.data[result.data.length - 1];
          setCurrentPower(parseFloat(latestData.power));

          const last20Data = result.data.slice(-20);
          const traces = [
            {
              x: last20Data.map(item => item.now_timestamp),
              y: last20Data.map(item => parseFloat(item.power)),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Current Power',
              line: { color: '#1f77b4', width: 2 },
              marker: { size: 6, symbol: 'circle' },
            },
            {
              x: last20Data.map(item => item.future_timestamp),
              y: last20Data.map(item => parseFloat(item.power_future_15min)),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Predicted Power (15min)',
              line: { color: '#ff7f0e', width: 2, dash: 'dash' },
              marker: { size: 6, symbol: 'circle' },
            },
            {
              x: last20Data.map(item => item.future_timestamp),
              y: last20Data.map(item => parseFloat(item.positive_3p)),
              type: 'scatter',
              mode: 'lines',
              name: '+3% Positive',
              line: { color: '#2ca02c', width: 1.5 },
              showlegend: true,
            },
            {
              x: last20Data.map(item => item.future_timestamp),
              y: last20Data.map(item => parseFloat(item.negative_3p)),
              type: 'scatter',
              mode: 'lines',
              name: '-3% Negative',
              line: { color: '#d62728', width: 1.5 },
              showlegend: true,
            },
            {
              x: last20Data.map(item => item.future_timestamp),
              y: last20Data.map(item => parseFloat(item.positive_7p)),
              type: 'scatter',
              mode: 'lines',
              name: '+7% Positive',
              line: { color: '#9467bd', width: 1.5 },
              showlegend: true,
            },
            {
              x: last20Data.map(item => item.future_timestamp),
              y: last20Data.map(item => parseFloat(item.negative_7p)),
              type: 'scatter',
              mode: 'lines',
              name: '-7% Negative',
              line: { color: '#8c564b', width: 1.5 },
              showlegend: true,
            }
          ];
          setChartData(traces);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const layout = {

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
      },
      showgrid: true,
      gridwidth: 1
    },
    yaxis: { 
      title: {
        text: 'Power Values (W)',
        font: {
          size: 14,
          color: theme.palette.text.secondary,
          family: theme.typography.fontFamily
        }
      },
      rangemode: 'tozero',
      gridcolor: theme.palette.divider,
      tickfont: {
        size: 12,
        family: theme.typography.fontFamily,
        color: theme.palette.text.secondary
      },
      showgrid: true,
      gridwidth: 1
    },
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
    modebar: {
      bgcolor: 'rgba(255, 255, 255, 0)',
      color: theme.palette.text.secondary,
      activecolor: theme.palette.primary.main
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
              textAlign: 'center',
              letterSpacing: '-0.5px'
            }}
          >
            Preventive Maintenance
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        <Fade in timeout={800}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 3 },
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
              <Plot
                data={chartData}
                layout={layout}
                config={{ 
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                  toImageButtonOptions: {
                    format: 'png',
                    filename: 'power_consumption_chart',
                    height: 1000,
                    width: 1500,
                    scale: 2
                  }
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          </Paper>
        </Fade>
      </Box>
    </Box>
  );
};

export default Maintenance;
