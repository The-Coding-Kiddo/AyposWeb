import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Switch,
  AppBar,
  Toolbar,
  Button,
  CircularProgress,
  Tooltip,
  Collapse,
  Grid,
  useTheme,
  styled,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DnsIcon from '@mui/icons-material/Dns';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SpeedIcon from '@mui/icons-material/Speed';
import { stressService } from '../services/stressService';

// Define the structure of our tree nodes
interface TreeNode {
  id: string;
  name: string;
  type: 'organization' | 'region' | 'datacenter' | 'pm' | 'vm' | 'compute';
  children?: TreeNode[];
  ip?: string;
}

interface ComputeNode {
  host_ip: string;
  hosted_vms: Record<string, string>;
}

interface ApiResponse {
  optimization_space: Record<string, ComputeNode>;
}

// Helper function to get all descendant node IDs
const getDescendantIds = (node: TreeNode): string[] => {
  let ids: string[] = [node.id];
  if (node.children) {
    node.children.forEach(child => {
      ids = [...ids, ...getDescendantIds(child)];
    });
  }
  return ids;
};

// Helper function to get all ancestor node IDs
const getAncestorIds = (nodeId: string, node: TreeNode): string[] => {
  if (!node) return [];
  if (node.id === nodeId) return [node.id];
  
  if (node.children) {
    for (const child of node.children) {
      const path = getAncestorIds(nodeId, child);
      if (path.length > 0) {
        return [node.id, ...path];
      }
    }
  }
  return [];
};

// Helper function to check if all children are selected
const areAllChildrenSelected = (node: TreeNode, selectedNodes: string[]): boolean => {
  if (!node.children) return true;
  return node.children.every(child => {
    if (child.children) {
      return areAllChildrenSelected(child, selectedNodes);
    }
    return selectedNodes.includes(child.id);
  });
};

// Add new styled components for stress testing
const StressTestingCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(3),
}));

const StressLevelChip = styled(Chip)<{ level: 'low' | 'medium' | 'high' }>(({ theme, level }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 500,
  backgroundColor: 
    level === 'low' ? theme.palette.success.light :
    level === 'medium' ? theme.palette.warning.light :
    theme.palette.error.light,
  color: 
    level === 'low' ? theme.palette.success.dark :
    level === 'medium' ? theme.palette.warning.dark :
    theme.palette.error.dark,
}));

interface MonitoringSystemProps {
  onSave?: (unselectedVMs: string[], selectedVMs: string[]) => void;
  isDialog?: boolean;
  initialBlockList?: string[];
  initialSelectedVMs?: string[];
}

const MonitoringSystem: React.FC<MonitoringSystemProps> = ({
  onSave,
  isDialog = false,
  initialBlockList = [],
  initialSelectedVMs = [],
}) => {
  const [expanded, setExpanded] = useState<string[]>(['org-main', 'region-main', 'dc-old-lab']);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedVMs, setSelectedVMs] = useState<string[]>(initialSelectedVMs);
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch data and initialize state
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://141.196.166.241:8003/prom/monitoring');
      const result: ApiResponse = await response.json();
      
      // Create hierarchical structure
      const hierarchicalData: TreeNode[] = [
        {
          id: 'org-main',
          name: 'Main Organization',
          type: 'organization',
          children: [
            {
              id: 'region-main',
              name: 'Region',
              type: 'region',
              children: [
                {
                  id: 'dc-ulak',
                  name: 'Ulak',
                  type: 'datacenter',
                  children: [] // Empty for now
                },
                {
                  id: 'dc-old-lab',
                  name: 'Old Lab',
                  type: 'datacenter',
                  children: Object.entries(result.optimization_space).map(([computeName, computeData]) => ({
                    id: computeName,
                    name: computeName,
                    type: 'compute',
                    ip: computeData.host_ip,
                    children: Object.entries(computeData.hosted_vms).map(([vmName, vmIp]) => ({
                      id: `${computeName}-${vmName}`,
                      name: vmName,
                      type: 'vm',
                      ip: vmIp
                    }))
                  }))
                },
                {
                  id: 'dc-new-lab',
                  name: 'New Lab',
                  type: 'datacenter',
                  children: [] // Empty for now
                }
              ]
            }
          ]
        }
      ];

      setTreeData(hierarchicalData);
      
      // Initialize selection based on initial values only if they exist
      if (initialBlockList.length > 0 || initialSelectedVMs.length > 0) {
        const blockList = initialBlockList;
        
        // Select nodes that are not in the block list
        const nodesToSelect = new Set<string>();
        
        // Helper function to process compute nodes
        const processComputeNodes = (nodes: TreeNode[]) => {
          nodes.forEach(node => {
            if (node.type === 'compute') {
              let hasSelectedVM = false;
              
              // Check compute node
              if (node.ip && !blockList.includes(node.ip)) {
                nodesToSelect.add(node.id);
              }
              
              // Check VM nodes
              node.children?.forEach(vm => {
                if (vm.ip && !blockList.includes(vm.ip)) {
                  nodesToSelect.add(vm.id);
                  hasSelectedVM = true;
                }
              });
              
              // If any VM is selected, ensure the compute is selected too
              if (hasSelectedVM) {
                nodesToSelect.add(node.id);
              }
            }
            
            // Recursively process children
            if (node.children) {
              processComputeNodes(node.children);
            }
          });
        };

        // Process all nodes
        processComputeNodes(hierarchicalData);

        // Set the selected nodes
        setSelectedNodes(Array.from(nodesToSelect));
      }

      // Expand organization and region nodes by default
      setExpanded(['org-main', 'region-main', 'dc-old-lab']);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize with previous state
  useEffect(() => {
    fetchData();
  }, [initialBlockList, initialSelectedVMs]); // Re-fetch when initial values change

  // Get appropriate icon for each node type
  const getNodeIcon = (type: TreeNode['type']) => {
    switch (type) {
      case 'organization':
        return <BusinessIcon color="primary" />;
      case 'region':
        return <LocationOnIcon color="primary" />;
      case 'datacenter':
        return <DnsIcon color="primary" />;
      case 'pm':
        return <ComputerIcon color="primary" />;
      case 'vm':
        return <MemoryIcon color="primary" />;
      default:
        return null;
    }
  };

  // Handle node expansion
  const handleNodeToggle = (nodeId: string) => {
    setExpanded(prev => {
      const isExpanded = prev.includes(nodeId);
      if (isExpanded) {
        return prev.filter(id => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  };

  // Updated node selection handler for toggle-like selection with parent-child association
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodes(prev => {
      const isSelected = prev.includes(nodeId);
      let newSelected = [...prev];

      // Find the node in the tree
      const findNode = (nodes: TreeNode[]): TreeNode | null => {
        for (const node of nodes) {
          if (node.id === nodeId) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      // Find the parent compute node for a VM
      const findParentCompute = (nodes: TreeNode[], vmId: string): TreeNode | null => {
        for (const node of nodes) {
          if (node.type === 'compute' && node.children?.some(vm => vm.id === vmId)) {
            return node;
          }
          if (node.children) {
            const found = findParentCompute(node.children, vmId);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNode = findNode(treeData);
      if (!targetNode) return prev;

      if (isSelected) {
        // When deselecting a node
        if (targetNode.type === 'compute') {
          // If deselecting a compute, deselect all its VMs
          const computeAndVMs = [targetNode.id, ...(targetNode.children?.map(vm => vm.id) || [])];
          newSelected = newSelected.filter(id => !computeAndVMs.includes(id));
        } else if (targetNode.type === 'vm') {
          // If deselecting a VM, just deselect it
          newSelected = newSelected.filter(id => id !== nodeId);
          
          // If this was the last VM, deselect the parent compute too
          const parentCompute = findParentCompute(treeData, nodeId);
          if (parentCompute) {
            const siblingVMs = parentCompute.children?.filter(vm => vm.id !== nodeId) || [];
            const hasSelectedSiblings = siblingVMs.some(vm => newSelected.includes(vm.id));
            if (!hasSelectedSiblings) {
              newSelected = newSelected.filter(id => id !== parentCompute.id);
            }
          }
        }
      } else {
        // When selecting a node
        if (targetNode.type === 'compute') {
          // If selecting a compute, select all its VMs
          newSelected.push(targetNode.id);
          targetNode.children?.forEach(vm => {
            newSelected.push(vm.id);
          });
        } else if (targetNode.type === 'vm') {
          // If selecting a VM, select it and its parent compute
          newSelected.push(nodeId);
          const parentCompute = findParentCompute(treeData, nodeId);
          if (parentCompute) {
            newSelected.push(parentCompute.id);
          }
        }
      }

      // Remove duplicates and return
      return Array.from(new Set(newSelected));
    });
  };

  // Updated render function with disabled switches in view mode
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expanded.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodes.includes(node.id);
    
    return (
      <Box key={node.id} sx={{ ml: level * 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 0.5,
            '&:hover': { bgcolor: 'action.hover' },
            borderRadius: 1,
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => handleNodeToggle(node.id)}
              sx={{ mr: 1 }}
            >
              {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getNodeIcon(node.type)}
            <Typography variant="body2">{node.name}</Typography>
            <Switch
              checked={isSelected}
              onChange={() => handleNodeSelect(node.id)}
              disabled={isViewMode}
              size="small"
              sx={{
                ml: 1,
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4caf50',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#4caf50',
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#bdbdbd',
                },
              }}
            />
          </Box>
        </Box>
        {hasChildren && (
          <Collapse in={isExpanded}>
            <Box>
              {node.children!.map(child => renderTreeNode(child, level + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  // Get unselected and selected VMs including compute IPs
  const getVMSelectionStatus = () => {
    const allIPs: string[] = [];
    const selectedIPs: string[] = [];

    // Find the Old Lab datacenter node that contains the dynamic data
    const oldLabNode = treeData[0]?.children?.[0]?.children?.find(node => node.id === 'dc-old-lab');
    if (!oldLabNode) return { selectedVMs: [], unselectedVMs: [] };

    // Process only the compute nodes in Old Lab
    oldLabNode.children?.forEach(compute => {
      // Add compute IP
      if (compute.ip) {
        allIPs.push(compute.ip);
        if (selectedNodes.includes(compute.id)) {
          selectedIPs.push(compute.ip);
        }
      }

      // Add VM IPs
      compute.children?.forEach(vm => {
        if (vm.ip) {
          allIPs.push(vm.ip);
          if (selectedNodes.includes(vm.id)) {
            selectedIPs.push(vm.ip);
          }
        }
      });
    });

    // Calculate unselected IPs for block list
    const unselectedIPs = allIPs.filter(ip => !selectedIPs.includes(ip));

    console.log('Block list IPs:', unselectedIPs);

    return {
      selectedVMs: selectedIPs,
      unselectedVMs: unselectedIPs
    };
  };

  // Handle save action
  const handleSave = async () => {
    try {
      setLoading(true);
      const { selectedVMs, unselectedVMs } = getVMSelectionStatus();
      console.log('Selected VMs and Computes:', selectedVMs);
      console.log('Unselected VMs and Computes:', unselectedVMs);
      
      // Store selected VMs in localStorage for stress testing
      const oldLabNode = treeData[0]?.children?.[0]?.children?.find(node => node.id === 'dc-old-lab');
      if (oldLabNode) {
        const selectedVMObjects = oldLabNode.children?.flatMap(compute => 
          compute.children?.filter(vm => selectedNodes.includes(vm.id))
            .map(vm => ({ id: vm.id, name: vm.name, ip: vm.ip })) || []
        ) || [];
        
        console.log('Storing VMs in localStorage:', selectedVMObjects);
        localStorage.setItem('stressTestVMs', JSON.stringify(selectedVMObjects));
      }
      
      if (onSave) {
        onSave(unselectedVMs, selectedVMs);
      }
    } catch (error) {
      console.error('Error saving selection:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      height: isDialog ? 'auto' : '100vh', 
      bgcolor: 'background.default',
      p: 3
    }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          bgcolor: 'background.paper', 
          borderBottom: 1, 
          borderColor: 'divider' 
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" color="textPrimary" sx={{ flex: 1 }}>
            Optimization Space Selection
          </Typography>
          {isDialog && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Button
                variant={isViewMode ? "contained" : "outlined"}
                onClick={() => setIsViewMode(true)}
                size="small"
              >
                View
              </Button>
              <Button
                variant={!isViewMode ? "contained" : "outlined"}
                onClick={() => setIsViewMode(false)}
                size="small"
              >
                Edit
              </Button>
            </Box>
          )}
          <Tooltip title="Save selected nodes">
            <span>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={handleSave}
                disabled={loading || isViewMode}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Refresh tree">
            <IconButton onClick={fetchData} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          height: '100%',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          mt: 2
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {treeData.map(node => renderTreeNode(node))}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonitoringSystem;
