import { useState } from 'react';
import { ChevronDown, ChevronRight, Users, Building2, UserCircle, Shield, Star } from './icons/HRTHISIcons';
import { OrganigramPosition, User, Department } from '../types/database';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface OrgChartNode {
  position: OrganigramPosition;
  children: OrgChartNode[];
  level: number;
  type: 'ceo' | 'teamlead' | 'manager' | 'employee';
}

interface OrgChartProps {
  positions: OrganigramPosition[];
  users: User[];
  departments: Department[];
  onNodeClick?: (position: OrganigramPosition) => void;
}

export default function OrgChart({ positions, users, departments, onNodeClick }: OrgChartProps) {
  // Auto-expand all nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(positions.map(p => p.id))
  );

  // Build hierarchy tree
  const buildTree = (): OrgChartNode[] => {
    if (positions.length === 0 || departments.length === 0) {
      return [];
    }

    // Group positions by department
    const byDept: Record<string, OrganigramPosition[]> = {};
    positions.forEach(pos => {
      if (!byDept[pos.department_id]) {
        byDept[pos.department_id] = [];
      }
      byDept[pos.department_id].push(pos);
    });

    // Sort positions by sort_order within each department
    Object.keys(byDept).forEach(deptId => {
      byDept[deptId].sort((a, b) => a.sort_order - b.sort_order);
    });

    const nodes: OrgChartNode[] = [];

    // Find Geschäftsführung department
    const managementDept = departments.find(d => 
      d.name.toLowerCase().includes('geschäftsführung') || 
      d.name.toLowerCase().includes('management') ||
      d.name.toLowerCase().includes('ceo')
    );

    // Level 0: CEO/Geschäftsführung (first position in management dept)
    if (managementDept && byDept[managementDept.id] && byDept[managementDept.id].length > 0) {
      const ceoPosition = byDept[managementDept.id][0];
      const ceoNode: OrgChartNode = {
        position: ceoPosition,
        children: [],
        level: 0,
        type: 'ceo'
      };

      // Level 1: Other positions in management dept (teamleads) AND all other departments
      const managementTeamleads = byDept[managementDept.id].slice(1);
      managementTeamleads.forEach(pos => {
        ceoNode.children.push({
          position: pos,
          children: [],
          level: 1,
          type: 'teamlead'
        });
      });

      // Add all positions from other departments as children of CEO
      const sortedDepts = [...departments]
        .filter(d => d.id !== managementDept.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      sortedDepts.forEach(dept => {
        if (!byDept[dept.id]) return;
        
        // First position in each department is a teamlead/department head
        const deptHead = byDept[dept.id][0];
        const deptHeadNode: OrgChartNode = {
          position: deptHead,
          children: [],
          level: 1,
          type: 'teamlead'
        };

        // Other positions in this department are under the department head
        const deptEmployees = byDept[dept.id].slice(1);
        deptEmployees.forEach(pos => {
          deptHeadNode.children.push({
            position: pos,
            children: [],
            level: 2,
            type: 'manager'
          });
        });

        ceoNode.children.push(deptHeadNode);
      });

      nodes.push(ceoNode);
    } else {
      // No management dept - show all departments at top level
      const sortedDepts = [...departments].sort((a, b) => a.sort_order - b.sort_order);
      
      sortedDepts.forEach(dept => {
        if (!byDept[dept.id]) return;
        
        // First position is the department head
        if (byDept[dept.id].length > 0) {
          const deptHead = byDept[dept.id][0];
          const deptHeadNode: OrgChartNode = {
            position: deptHead,
            children: [],
            level: 0,
            type: 'teamlead'
          };

          // Other positions are under the department head
          const deptEmployees = byDept[dept.id].slice(1);
          deptEmployees.forEach(pos => {
            deptHeadNode.children.push({
              position: pos,
              children: [],
              level: 1,
              type: 'employee'
            });
          });

          nodes.push(deptHeadNode);
        }
      });
    }

    return nodes;
  };

  const tree = buildTree();

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getUser = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  const getDepartment = (deptId: string) => {
    return departments.find(d => d.id === deptId);
  };

  const getNodeIcon = (type: OrgChartNode['type']) => {
    switch (type) {
      case 'ceo':
        return <Shield className="w-5 h-5 text-purple-600" />;
      case 'teamlead':
        return <Star className="w-5 h-5 text-blue-600" />;
      case 'manager':
        return <Users className="w-5 h-5 text-green-600" />;
      default:
        return <UserCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNodeColor = (type: OrgChartNode['type']) => {
    switch (type) {
      case 'ceo':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 hover:shadow-purple-200';
      case 'teamlead':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:shadow-blue-200';
      case 'manager':
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:shadow-green-200';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:shadow-gray-200';
    }
  };

  const renderNode = (node: OrgChartNode, index: number) => {
    const primaryUser = getUser(node.position.primary_user_id);
    const backupUser = getUser(node.position.backup_user_id);
    const dept = getDepartment(node.position.department_id);
    const isExpanded = expandedNodes.has(node.position.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.position.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          className={`
            relative group cursor-pointer transition-all duration-300
            ${getNodeColor(node.type)}
            border-2 rounded-xl p-4 min-w-[280px] max-w-[320px]
            hover:shadow-lg hover:scale-105
            ${onNodeClick ? 'cursor-pointer' : 'cursor-default'}
          `}
          onClick={() => onNodeClick?.(node.position)}
        >
          {/* Department Badge */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600 truncate">{dept?.name}</span>
          </div>

          {/* Position Header */}
          <div className="flex items-start gap-3 mb-3">
            {getNodeIcon(node.type)}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {node.position.name}
              </h4>
              {node.position.specialization && (
                <p className="text-xs text-gray-500 truncate">
                  {node.position.specialization}
                </p>
              )}
            </div>
          </div>

          {/* Primary User */}
          {primaryUser ? (
            <div className="flex items-center gap-2 p-2 bg-white/80 rounded-lg mb-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={primaryUser.profile_picture || undefined} />
                <AvatarFallback>
                  {primaryUser.first_name?.[0]}{primaryUser.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {primaryUser.first_name} {primaryUser.last_name}
                </p>
                <p className="text-xs text-gray-500">Hauptverantwortlich</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-white/50 rounded-lg mb-2 border border-dashed border-gray-300">
              <UserCircle className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500">Nicht besetzt</p>
            </div>
          )}

          {/* Backup User */}
          {backupUser && (
            <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
              <Avatar className="w-6 h-6">
                <AvatarImage src={backupUser.profile_picture || undefined} />
                <AvatarFallback className="text-xs">
                  {backupUser.first_name?.[0]}{backupUser.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {backupUser.first_name} {backupUser.last_name}
                </p>
                <p className="text-xs text-gray-500">Vertretung</p>
              </div>
            </div>
          )}

          {/* Expand/Collapse Button - Hidden for now as all nodes auto-expand */}
          {/* {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.position.id);
              }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )} */}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative mt-12">
            {/* Vertical connector line from parent to horizontal line */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300" />
            
            {/* Children container with connecting lines */}
            <div className="relative">
              {/* Horizontal line connecting all children - only if more than one */}
              {node.children.length > 1 && (
                <div className="absolute top-0 left-0 right-0 flex justify-center">
                  <div className="relative w-full max-w-[90%]">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300" />
                  </div>
                </div>
              )}
              
              {/* Children grid */}
              <div className="flex gap-6 pt-6 justify-center">
                {node.children.map((child, idx) => (
                  <div key={child.position.id} className="relative flex-shrink-0">
                    {/* Vertical line from horizontal connector to child */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300" />
                    
                    {renderNode(child, idx)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (positions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="mb-2">Noch keine Positionen im Organigram</p>
        <p className="text-sm mb-4">
          {departments.length === 0 
            ? 'Lade die Seite neu, um die Standard-Abteilung "Geschäftsführung" zu erstellen.'
            : 'Wechseln Sie zur Listen-Ansicht, um Positionen hinzuzufügen.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-8">
      {tree.length === 1 ? (
        // Single root node (CEO) - center it
        <div className="inline-flex flex-col items-center gap-16 min-w-full p-8">
          {renderNode(tree[0], 0)}
        </div>
      ) : (
        // Multiple root nodes - show them side by side
        <div className="inline-flex flex-row items-start justify-center gap-8 min-w-full p-8">
          {tree.map((node, idx) => (
            <div key={node.position.id} className="flex-shrink-0">
              {renderNode(node, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
