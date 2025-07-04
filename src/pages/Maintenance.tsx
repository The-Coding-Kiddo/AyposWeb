import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Fade, useTheme, AppBar, Toolbar, Chip } from '@mui/material';
import Plot from 'react-plotly.js';
import { Layout, PlotData } from 'plotly.js';
import { config } from '../config/env';

interface DataItem {
  now_timestamp: string;
  future_timestamp: string;
  power: string;
  power_future_15min: string;
  positive_3p: string;
  negative_3p: string;
  positive_7p: string;
  negative_7p: string;
  flag: string;
}

const API_BASE_URL = config.apiUrl;

const Maintenance = () => {
  const theme = useTheme();
  
  const [chartData, setChartData] = useState<Partial<PlotData>[]>([]);
  const [currentFlag, setCurrentFlag] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/prom/get_chart_data/maintenance/20`);
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
          const last20Data = result.data.slice(-20);
          setCurrentFlag(last20Data[last20Data.length - 1].flag);
          
          const traces: Partial<PlotData>[] = [
            {
              x: last20Data.map((item: DataItem) => item.now_timestamp),
              y: last20Data.map((item: DataItem) => parseFloat(item.power)),
              type: 'scatter' as const,
              mode: 'lines+markers' as const,
              name: 'Current Power',
              line: { color: '#2196f3', width: 2 },
              marker: { size: 6, symbol: 'circle' }
            },
            {
              x: last20Data.map((item: DataItem) => item.future_timestamp),
              y: last20Data.map((item: DataItem) => parseFloat(item.power_future_15min)),
              type: 'scatter' as const,
              mode: 'lines+markers' as const,
              name: 'Predicted (15min)',
              line: { color: '#4caf50', width: 2, dash: 'dot' },
              marker: { size: 6, symbol: 'circle' }
            },
            {
              x: last20Data.map((item: DataItem) => item.future_timestamp),
              y: last20Data.map((item: DataItem) => parseFloat(item.positive_3p)),
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: '+3% Positive',
              line: { color: '#2ca02c', width: 1.5 },
              showlegend: true,
            },
            {
              x: last20Data.map((item: DataItem) => item.future_timestamp),
              y: last20Data.map((item: DataItem) => parseFloat(item.negative_3p)),
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: '-3% Negative',
              line: { color: '#d62728', width: 1.5 },
              showlegend: true,
            },
            {
              x: last20Data.map((item: DataItem) => item.future_timestamp),
              y: last20Data.map((item: DataItem) => parseFloat(item.positive_7p)),
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: '+7% Positive',
              line: { color: '#9467bd', width: 1.5 },
              showlegend: true,
            },
            {
              x: last20Data.map((item: DataItem) => item.future_timestamp),
              y: last20Data.map((item: DataItem) => parseFloat(item.negative_7p)),
              type: 'scatter' as const,
              mode: 'lines' as const,
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

  const layout: Partial<Layout> = {
    xaxis: {
      title: {
        text: 'Time',
        font: { size: 14, color: '#666', family: undefined }
      },
      type: 'date',
      gridcolor: '#eee',
      tickfont: { size: 12, family: undefined, color: '#666' },
      showgrid: true,
      gridwidth: 1,
      rangeslider: { visible: true }
    },
    yaxis: {
      title: {
        text: 'Power (W)',
        font: { size: 14, color: '#666', family: undefined }
      },
      gridcolor: '#eee',
      tickfont: { size: 12, family: undefined, color: '#666' },
      showgrid: true,
      gridwidth: 1,
      rangemode: 'tozero' as const,
      fixedrange: false,
      range: [0, Math.max(...chartData.flatMap(trace => trace.y as number[]).filter(Boolean)) * 1.1]
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
          {currentFlag && (
            <Chip
              label={currentFlag}
              color={currentFlag === 'Correct Estimation for PM energy' ? 'success' : 'warning'}
              size="medium"
              sx={{ 
                height: 32,
                '& .MuiChip-label': {
                  px: 2,
                  fontSize: '0.875rem',
                  fontWeight: 600
                },
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.2)',
                  },
                  '70%': {
                    boxShadow: '0 0 0 6px rgba(0, 0, 0, 0)',
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
                  },
                }
              }}
            />
          )}
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
