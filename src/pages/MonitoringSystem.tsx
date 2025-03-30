import { useState, useEffect } from 'react';
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

// Define the structure of our tree nodes
interface TreeNode {
  id: string;
  name: string;
  type: 'organization' | 'region' | 'datacenter' | 'pm' | 'vm';
  children?: TreeNode[];
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

const MonitoringSystem = () => {
  const [expanded, setExpanded] = useState<string[]>(['org1']);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Updated mock data with three datacenters
        const mockData: TreeNode = {
          id: 'org1',
          name: 'Main Organization',
          type: 'organization',
          children: [
            {
              id: 'region1',
              name: 'Ankara',
              type: 'region',
              children: [
                {
                  id: 'dc1',
                  name: 'Ulak',
                  type: 'datacenter',
                  children: [
                    {
                      id: 'pm1',
                      name: 'Ulak PM 1',
                      type: 'pm',
                      children: [
                        { id: 'vm1', name: 'Ulak VM 1', type: 'vm' },
                        { id: 'vm2', name: 'Ulak VM 2', type: 'vm' },
                        { id: 'vm3', name: 'Ulak VM 3', type: 'vm' },
                      ],
                    },
                    {
                      id: 'pm2',
                      name: 'Ulak PM 2',
                      type: 'pm',
                      children: [
                        { id: 'vm4', name: 'Ulak VM 4', type: 'vm' },
                        { id: 'vm5', name: 'Ulak VM 5', type: 'vm' },
                      ],
                    },
                    {
                      id: 'pm3',
                      name: 'Ulak PM 3',
                      type: 'pm',
                      children: [
                        { id: 'vm6', name: 'Ulak VM 6', type: 'vm' },
                        { id: 'vm7', name: 'Ulak VM 7', type: 'vm' },
                        { id: 'vm8', name: 'Ulak VM 8', type: 'vm' },
                      ],
                    },
                  ],
                },
                {
                  id: 'dc2',
                  name: 'Old Lab',
                  type: 'datacenter',
                  children: [
                    {
                      id: 'pm4',
                      name: 'Old Lab PM 1',
                      type: 'pm',
                      children: [
                        { id: 'vm9', name: 'Old Lab VM 1', type: 'vm' },
                        { id: 'vm10', name: 'Old Lab VM 2', type: 'vm' },
                        { id: 'vm11', name: 'Old Lab VM 3', type: 'vm' },
                      ],
                    },
                    {
                      id: 'pm5',
                      name: 'Old Lab PM 2',
                      type: 'pm',
                      children: [
                        { id: 'vm12', name: 'Old Lab VM 4', type: 'vm' },
                        { id: 'vm13', name: 'Old Lab VM 5', type: 'vm' },
                      ],
                    },
                    {
                      id: 'pm6',
                      name: 'Old Lab PM 3',
                      type: 'pm',
                      children: [
                        { id: 'vm14', name: 'Old Lab VM 6', type: 'vm' },
                        { id: 'vm15', name: 'Old Lab VM 7', type: 'vm' },
                      ],
                    },
                  ],
                },
                {
                  id: 'dc3',
                  name: 'New Lab',
                  type: 'datacenter',
                  children: [
                    {
                      id: 'pm7',
                      name: 'New Lab PM 1',
                      type: 'pm',
                      children: [
                        { id: 'vm16', name: 'New Lab VM 1', type: 'vm' },
                        { id: 'vm17', name: 'New Lab VM 2', type: 'vm' },
                        { id: 'vm18', name: 'New Lab VM 3', type: 'vm' },
                      ],
                    },
                    {
                      id: 'pm8',
                      name: 'New Lab PM 2',
                      type: 'pm',
                      children: [
                        { id: 'vm19', name: 'New Lab VM 4', type: 'vm' },
                        { id: 'vm20', name: 'New Lab VM 5', type: 'vm' },
                        { id: 'vm21', name: 'New Lab VM 6', type: 'vm' },
                      ],
                    },
                    {
                      id: 'pm9',
                      name: 'New Lab PM 3',
                      type: 'pm',
                      children: [
                        { id: 'vm22', name: 'New Lab VM 7', type: 'vm' },
                        { id: 'vm23', name: 'New Lab VM 8', type: 'vm' },
                        { id: 'vm24', name: 'New Lab VM 9', type: 'vm' },
                      ],
                    },
                    {
                      id: 'pm10',
                      name: 'New Lab PM 4',
                      type: 'pm',
                      children: [
                        { id: 'vm25', name: 'New Lab VM 10', type: 'vm' },
                        { id: 'vm26', name: 'New Lab VM 11', type: 'vm' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        };

        setTreeData([mockData]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      const targetNode = findNode(treeData);
      if (!targetNode) return prev;

      if (isSelected) {
        // When deselecting a node, deselect it and all its descendants
        const descendantIds = getDescendantIds(targetNode);
        newSelected = newSelected.filter(id => !descendantIds.includes(id));
      } else {
        // When selecting a node, select it and all its descendants
        const descendantIds = getDescendantIds(targetNode);
        newSelected = [...new Set([...newSelected, ...descendantIds])];
      }

      return newSelected;
    });
  };

  // Updated render function to remove the +All/-All button since it's redundant now
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

  // Handle save action
  const handleSave = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call
      console.log('Selected nodes:', selectedNodes);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving selection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh action
  const handleRefresh = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // For now, just re-expand the root node
      setExpanded(['org1']);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
        <Toolbar>
          <Typography variant="h5" color="textPrimary" sx={{ flex: 1 }}>
            Optimization Space Selection
          </Typography>
          <Tooltip title="Save selected nodes">
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              onClick={handleSave}
              disabled={selectedNodes.length === 0 || loading}
              sx={{ mr: 1 }}
            >
              Save Selection
            </Button>
          </Tooltip>
          <Tooltip title="Refresh tree">
            <IconButton onClick={handleRefresh} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            height: '100%',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
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
      </Box>
    </Box>
  );
};

export default MonitoringSystem;
