import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Divider } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import ComputerIcon from '@mui/icons-material/Computer';

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

const ENDPOINT = 'http://141.196.83.136:8003/prom/get_chart_data/vm_placement';
const REFRESH_INTERVAL = 30000; // 30 seconds

const SummaryStats: React.FC = () => {
  const [data, setData] = useState<VMPlacementData | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(ENDPOINT);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      console.error('Error fetching VM placement data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const stats = React.useMemo(() => {
    if (!data?.physical_machines) {
      return {
        activeComputes: 0,
        totalComputes: 0,
        activeVMs: 0,
        inactiveVMs: 0,
      };
    }

    const activeComputes = data.physical_machines.filter(
      pm => pm.power_consumption > 0 || pm.vms.active.length > 0
    ).length;

    const totalActiveVMs = data.physical_machines.reduce(
      (sum, pm) => sum + pm.vms.active.length,
      0
    );

    const totalInactiveVMs = data.physical_machines.reduce(
      (sum, pm) => sum + pm.vms.inactive.length,
      0
    );

    return {
      activeComputes,
      totalComputes: data.physical_machines.length,
      activeVMs: totalActiveVMs,
      inactiveVMs: totalInactiveVMs,
    };
  }, [data]);

  return (
    <Grid item xs={12}>
      <Paper 
        sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          boxShadow: 3,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StorageIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              Compute Nodes
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 500 }}>
              {stats.activeComputes}/{stats.totalComputes}
            </Typography>
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ComputerIcon sx={{ color: 'info.main', fontSize: 28 }} />
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              Virtual Machines
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 500 }}>
                {stats.activeVMs}
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                active
              </Typography>
              <Typography variant="body2" color="text.secondary">
                /
              </Typography>
              <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 500 }}>
                {stats.activeVMs + stats.inactiveVMs}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                total
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
};

export default SummaryStats; 