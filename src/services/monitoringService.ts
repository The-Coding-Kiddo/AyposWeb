import axios from 'axios';

const BASE_URL = 'http://141.196.166.241:8003';

export interface MonitoringConfig {
  migration: {
    script_time_unit: string;
    virtual_machine_estimation: {
      estimation_method: string;
      model_type: string;
    };
    migration_advices: {
      migration_method: string;
      migration_weights: {
        power: string;
        balance: string;
        overload: string;
        allocation: string;
      };
    };
    block_list: string[];
  };
  environmental: {
    number_of_steps: string;
    script_time_unit: string;
    model_type: string;
  };
  preventive: {
    number_of_steps: string;
    script_time_unit: string;
    model_type: string;
  };
}

export interface MonitoringStatus {
  statuses: {
    environmental: {
      is_running: boolean;
      pid: number;
    };
    migration: {
      is_running: boolean;
      pid: number;
    };
    preventive: {
      is_running: boolean;
      pid: number;
    };
  };
}

class MonitoringService {
  private static instance: MonitoringService;
  private controller: AbortController | null = null;
  private statusPollingInterval: NodeJS.Timeout | null = null;
  private previousStatus: MonitoringStatus | null = null;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async startMonitoring(config: MonitoringConfig): Promise<void> {
    try {
      // Validate required fields based on API documentation
      if (!config.migration || !config.environmental || !config.preventive) {
        throw new Error('Invalid configuration: Missing required sections');
      }

      // Ensure script_time_unit has valid values
      if (!config.migration.script_time_unit || 
          !config.environmental.script_time_unit || 
          !config.preventive.script_time_unit) {
        throw new Error('Invalid configuration: Missing script_time_unit values');
      }

      // Log the configuration being sent
      console.log('Sending monitoring configuration:', JSON.stringify(config, null, 2));

      // Always create a new AbortController for this request
      if (this.controller) {
        this.controller.abort();
      }
      this.controller = new AbortController();

      const response = await axios.post(
        `${BASE_URL}/prom/start_monitoring`,
        config,
        {
          signal: this.controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout to prevent hanging
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to start monitoring: Status ${response.status}`);
      }

      console.log('Monitoring started successfully:', response.data);
      return;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Start monitoring request cancelled');
      } else {
        console.error('Error starting monitoring:', error);
        throw this.handleError(error);
      }
    }
  }

  public async stopMonitoring(): Promise<void> {
    try {
      console.log('Attempting to stop monitoring...');
      
      // Cancel any ongoing monitoring request
      if (this.controller) {
        this.controller.abort();
        this.controller = null;
      }

      // Stop status polling if it's running
      this.stopStatusPolling();

      // According to API docs, this needs an empty body
      const response = await axios.post(`${BASE_URL}/prom/stop_monitoring`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`Failed to stop monitoring: Status ${response.status}`);
      }

      console.log('Monitoring stopped successfully:', response.data);
      return;
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      throw this.handleError(error);
    }
  }

  public async getMonitoringStatus(): Promise<MonitoringStatus> {
    try {
      const response = await axios.get(`${BASE_URL}/prom/monitoring_status`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // Shorter timeout for faster feedback
      });

      if (response.status !== 200) {
        throw new Error('Failed to get monitoring status');
      }

      const data = response.data;
      
      // Ensure the response always has the expected structure
      const normalizedData = {
        statuses: {
          environmental: {
            is_running: data?.statuses?.environmental?.is_running || false,
            pid: data?.statuses?.environmental?.pid || 0
          },
          migration: {
            is_running: data?.statuses?.migration?.is_running || false,
            pid: data?.statuses?.migration?.pid || 0
          },
          preventive: {
            is_running: data?.statuses?.preventive?.is_running || false,
            pid: data?.statuses?.preventive?.pid || 0
          }
        }
      };

      // Only log when status actually changes
      if (!this.previousStatus || 
          this.hasStatusChanged(normalizedData, this.previousStatus)) {
        console.log('Monitoring status changed:', JSON.stringify(normalizedData, null, 2));
        this.previousStatus = JSON.parse(JSON.stringify(normalizedData));
      }

      return normalizedData;
    } catch (error) {
      // Only log errors once per minute to reduce console noise
      const now = new Date();
      if (!this._lastErrorLog || now.getTime() - this._lastErrorLog.getTime() > 60000) {
        console.error('Error getting monitoring status:', error);
        this._lastErrorLog = now;
      }
      
      // Return a default structure that indicates no services are running
      return {
        statuses: {
          environmental: {
            is_running: false,
            pid: 0
          },
          migration: {
            is_running: false,
            pid: 0
          },
          preventive: {
            is_running: false,
            pid: 0
          }
        }
      };
    }
  }

  private hasStatusChanged(current: MonitoringStatus, previous: MonitoringStatus): boolean {
    return current.statuses.migration.is_running !== previous.statuses.migration.is_running ||
           current.statuses.environmental.is_running !== previous.statuses.environmental.is_running ||
           current.statuses.preventive.is_running !== previous.statuses.preventive.is_running;
  }

  private _lastErrorLog: Date | null = null;

  public startStatusPolling(callback: (status: MonitoringStatus) => void, interval: number = 5000): void {
    this.stopStatusPolling();

    this.statusPollingInterval = setInterval(async () => {
      try {
        const status = await this.getMonitoringStatus();
        callback(status);
      } catch (error) {
        console.error('Error polling monitoring status:', error);
        callback({
          statuses: {
            environmental: {
              is_running: false,
              pid: 0
            },
            migration: {
              is_running: false,
              pid: 0
            },
            preventive: {
              is_running: false,
              pid: 0
            }
          }
        });
      }
    }, interval);
  }

  public stopStatusPolling(): void {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      return new Error(
        `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`
      );
    } else if (error.request) {
      // Request made but no response received
      return new Error('No response received from server');
    } else {
      // Error in request setup
      return new Error(`Request error: ${error.message}`);
    }
  }

  public async checkMonitoringActive(): Promise<boolean> {
    try {
      console.log('Checking if monitoring is active...');
      
      const status = await this.getMonitoringStatus();
      
      // Check if any of the monitoring services are running
      const migrationRunning = status?.statuses?.migration?.is_running;
      const environmentalRunning = status?.statuses?.environmental?.is_running;
      const preventiveRunning = status?.statuses?.preventive?.is_running;
      
      const isActive = migrationRunning || environmentalRunning || preventiveRunning;
      console.log(`Monitoring active status: ${isActive} (Migration: ${migrationRunning}, Environmental: ${environmentalRunning}, Preventive: ${preventiveRunning})`);
      
      return isActive;
    } catch (error) {
      console.error('Error checking monitoring status:', error);
      // Assume not active if we can't check
      return false;
    }
  }
}

export const monitoringService = MonitoringService.getInstance(); 