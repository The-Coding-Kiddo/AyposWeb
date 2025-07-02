export interface Weights {
  energy: number;
  balance: number;
  overload: number;
  allocation: number;
}

export interface AlertState {
  open: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

export interface MonitoringStatus {
  statuses: {
    migration: {
      is_running: boolean;
    };
    environmental: {
      is_running: boolean;
    };
    preventive: {
      is_running: boolean;
    };
  };
}

export interface MonitoringConfig {
  migration: {
    script_time_unit: string;
    estimation_method: 'direct' | 'indirect';
    model_type: string;
    migration_method: string;
    operation_mode: 'auto' | 'semiauto';
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