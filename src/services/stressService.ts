import axios from 'axios';
import { config } from '../config/env';

const BASE_URL = config.apiUrl;

export interface StressConfig {
  vms: string[];
  level: 'low' | 'medium' | 'high';
  force: boolean;
}

export interface StressStatus {
  status: string[];
}

class StressService {
  private static instance: StressService;

  private constructor() {}

  public static getInstance(): StressService {
    if (!StressService.instance) {
      StressService.instance = new StressService();
    }
    return StressService.instance;
  }

  public async startStressTest(config: StressConfig): Promise<void> {
    try {
      // Log the request configuration
      console.log('Starting stress test with config:', {
        url: `${BASE_URL}/stress/start`,
        data: {
          vms: config.vms,
          level: config.level,
          force: true
        }
      });

      const response = await axios.post(
        `${BASE_URL}/stress/start`,
        {
          vms: config.vms,
          level: config.level,
          force: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to start stress test: Status ${response.status}`);
      }

      console.log('Stress test started successfully:', response.data);
      return;
    } catch (error) {
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            headers: error.config?.headers
          }
        });
      } else {
        console.error('Non-axios error:', error);
      }
      throw this.handleError(error);
    }
  }

  public async stopStressTest(vms: string[]): Promise<void> {
    try {
      console.log('Stopping stress test for VMs:', vms);
      
      const response = await axios.post(
        `${BASE_URL}/stress/stop`,
        vms,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to stop stress test: Status ${response.status}`);
      }

      console.log('Stress test stopped successfully:', response.data);
      return;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            headers: error.config?.headers
          }
        });
      } else {
        console.error('Non-axios error:', error);
      }
      throw this.handleError(error);
    }
  }

  public async getStressStatus(vms: string[]): Promise<string[]> {
    try {
      console.log('Fetching stress status for VMs:', vms);
      
      const response = await axios.post(
        `${BASE_URL}/stress/status`,
        vms,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      // Log the raw response for debugging
      console.log('Raw stress status response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });

      if (response.status !== 200) {
        throw new Error(`Failed to get stress test status: ${response.status}`);
      }

      // Handle the new response format where data is an object with VM IPs as keys
      if (response.data && typeof response.data === 'object') {
        // Extract VMs that are running
        const runningVMs = Object.entries(response.data)
          .filter(([_, status]: [string, any]) => status.is_running)
          .map(([ip]) => ip);
        
        console.log('Running VMs:', runningVMs);
        return runningVMs;
      }

      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            headers: error.config?.headers
          }
        });
      } else {
        console.error('Non-axios error:', error);
      }
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      if (response) {
        return new Error(
          `Server error: ${response.status} - ${JSON.stringify(response.data)}`
        );
      } else if (error.request) {
        return new Error('No response received from server');
      }
    }
    return new Error(`Request error: ${error.message}`);
  }
}

export const stressService = StressService.getInstance(); 