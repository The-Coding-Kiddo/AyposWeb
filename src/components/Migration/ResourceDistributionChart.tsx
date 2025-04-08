import React from 'react';
import { Paper, Typography, IconButton, Box, Grid } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import RefreshIcon from '@mui/icons-material/Refresh';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VM {
  name: string;
  power: number;
}

interface VMPlacementData {
  data_center: string;
  id: number;
  physical_machines: Array<{
    name: string;
    power_consumption: number;
    vms: {
      active: VM[];
      inactive: VM[];
    };
  }>;
}

interface ResourceDistributionChartProps {
  vmPlacementData: VMPlacementData | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

const ResourceDistributionChart: React.FC<ResourceDistributionChartProps> = ({
  vmPlacementData,
  isLoading,
  onRefresh
}) => {
  const chartData = React.useMemo(() => {
    if (!vmPlacementData?.physical_machines) {
      return {
        labels: [],
        datasets: []
      };
    }

    const physicalMachines = vmPlacementData.physical_machines;
    const labels = physicalMachines.map(pm => pm.name);
    const activeVMs = physicalMachines.map(pm => pm.vms.active.length);
    const inactiveVMs = physicalMachines.map(pm => pm.vms.inactive.length);
    const totalPower = physicalMachines.map(pm => pm.power_consumption);
    const vmPower = physicalMachines.map(pm => 
      pm.vms.active.reduce((sum, vm) => sum + vm.power, 0)
    );

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Active VMs',
          data: activeVMs,
          backgroundColor: '#4caf50',
          yAxisID: 'vmAxis',
          stack: 'vms',
        },
        {
          type: 'bar' as const,
          label: 'Inactive VMs',
          data: inactiveVMs,
          backgroundColor: '#ff9800',
          yAxisID: 'vmAxis',
          stack: 'vms',
        },
        {
          type: 'line' as const,
          label: 'Total Power (W)',
          data: totalPower,
          borderColor: '#f44336',
          backgroundColor: 'transparent',
          yAxisID: 'powerAxis',
          tension: 0.4,
          borderWidth: 2,
        },
        {
          type: 'line' as const,
          label: 'VM Power (W)',
          data: vmPower,
          borderColor: '#2196f3',
          backgroundColor: 'transparent',
          yAxisID: 'powerAxis',
          borderDash: [5, 5],
          tension: 0.4,
          borderWidth: 2,
        }
      ]
    };
  }, [vmPlacementData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Power')) {
              return `${label}: ${value.toFixed(2)} W`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      vmAxis: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Number of VMs',
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        stacked: true,
      },
      powerAxis: {
        type: 'linear' as const,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Power (W)',
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <Grid item xs={12} md={8}>
      <Paper 
        sx={{ 
          p: 2, 
          height: '320px',
          position: 'relative',
          bgcolor: 'background.paper',
          borderRadius: 1,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6">Resource Distribution by Node</Typography>
          <IconButton 
            onClick={onRefresh} 
            disabled={isLoading}
            sx={{ '&:disabled': { opacity: 0.5 } }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: 'calc(100% - 48px)' }}>
          <Chart type="bar" data={chartData} options={options} />
        </Box>
        {isLoading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.7)',
          }}>
            <Typography variant="body2">Loading...</Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

export default ResourceDistributionChart; 