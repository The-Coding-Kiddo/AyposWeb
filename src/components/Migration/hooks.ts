import { useState, useEffect } from 'react';
import { VMDetails, GainBeforeData, MigrationAdviceData } from './types';
import { config } from '../../config/env';

const API_BASE_URL = config.apiUrl;
const REFRESH_INTERVAL = 30000; // 30 seconds

interface GainAfterData {
  past_power: number;
  cur_power: number;
  prop_power: number;
  prop_ratio: number;
  actual_ratio: number;
  val_ratio: number;
  val_difference: number;
}

export const useMigrationData = () => {
  const [gainBeforeData, setGainBeforeData] = useState<GainBeforeData | null>(null);
  const [migrationAdviceData, setMigrationAdviceData] = useState<MigrationAdviceData | null>(null);
  const [isLoadingGainData, setIsLoadingGainData] = useState(false);

  const fetchMigrationData = async () => {
    try {
      setIsLoadingGainData(true);
      
      // Log the request start
      console.log('Fetching migration data...');
      
      const [gainResponse, migrationResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/prom/get_chart_data/gain_before`),
        fetch(`${API_BASE_URL}/prom/get_chart_data/migration`)
      ]);

      // Log the response status
      console.log('Gain Response Status:', gainResponse.status);
      console.log('Migration Response Status:', migrationResponse.status);

      if (!gainResponse.ok || !migrationResponse.ok) {
        throw new Error(`Failed to fetch migration data: Gain Status ${gainResponse.status}, Migration Status ${migrationResponse.status}`);
      }

      const [gainData, migrationData] = await Promise.all([
        gainResponse.json(),
        migrationResponse.json()
      ]);

      // Log the received data
      console.log('Received Gain Data:', gainData);
      console.log('Received Migration Data:', migrationData);

      if (!gainData || typeof gainData.cur_power === 'undefined') {
        console.error('Invalid gain data format:', gainData);
        throw new Error('Invalid gain data format');
      }

      if (!migrationData || Object.keys(migrationData).length === 0) {
        console.warn('No migration advice available:', migrationData);
      }

      setGainBeforeData(gainData);
      setMigrationAdviceData(migrationData);
    } catch (error) {
      console.error('Error fetching migration data:', error);
      // Clear the data on error to prevent showing stale data
      setGainBeforeData(null);
      setMigrationAdviceData(null);
    } finally {
      setIsLoadingGainData(false);
    }
  };

  useEffect(() => {
    fetchMigrationData();
    const interval = setInterval(fetchMigrationData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { gainBeforeData, migrationAdviceData, isLoadingGainData, fetchMigrationData };
};

export const useMonitoringData = () => {
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stableHosts, setStableHosts] = useState<string[]>([]);
  const [computeCount, setComputeCount] = useState<number>(0);
  const [vmCount, setVmCount] = useState<number>(0);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/prom/monitoring`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      
      if (result?.data) {
        setMonitoringData(result.data);
        const filteredData = result.data.filter((pm: any) => pm.virtual_machines?.length > 0);
        setComputeCount(filteredData.length);
        setVmCount(filteredData.reduce((acc: number, pm: any) => acc + pm.virtual_machines.length, 0));
        
        const newHosts = result.data.map((pm: any) => pm.host);
        setStableHosts(prevHosts => {
          const allHosts = Array.from(new Set([...prevHosts, ...newHosts]));
          return allHosts.filter(host => newHosts.includes(host));
        });
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setMonitoringData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { monitoringData, loading, stableHosts, computeCount, vmCount };
};

export const useVMDetails = () => {
  const [vmDetails, setVmDetails] = useState<Record<string, VMDetails>>({});
  const [expandedVMs, setExpandedVMs] = useState<Record<string, boolean>>({});

  const toggleVMDetails = (vmId: string) => {
    setExpandedVMs(prev => ({
      ...prev,
      [vmId]: !prev[vmId]
    }));
  };

  useEffect(() => {
    const fetchVMDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/prom/vm_mac_details`);
        if (!response.ok) {
          throw new Error('Failed to fetch VM details');
        }
        const data = await response.json();
        if (data?.res) {
          setVmDetails(data.res);
        }
      } catch (error) {
        console.error('Error fetching VM details:', error);
      }
    };

    fetchVMDetails();
    const interval = setInterval(fetchVMDetails, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { vmDetails, expandedVMs, toggleVMDetails };
};

export const useGainAfterData = () => {
  const [gainAfterData, setGainAfterData] = useState<GainAfterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGainAfterData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/prom/get_chart_data/gain_after`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gain-after data');
      }

      const data = await response.json();
      setGainAfterData(data);
    } catch (error) {
      console.error('Error fetching gain-after data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { gainAfterData, isLoading, fetchGainAfterData };
}; 