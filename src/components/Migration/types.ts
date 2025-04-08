export interface VMDetails {
  disk: number;
  ephemeral: number;
  extra_specs: Record<string, any>;
  host: string;
  ip: string;
  name: string;
  original_name: string;
  ram: number;
  swap: number;
  vcpus: number;
}

export interface GainBeforeData {
  prop_gain: number;
  prop_power: number;
  cur_power: number;
}

export interface MigrationAdviceData {
  [key: string]: {
    current_pm: string;
    proposed_pm: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
} 