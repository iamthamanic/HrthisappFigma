import { useState, useRef, useCallback, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  Shield,
  Star,
  Users,
  UserCircle,
  Minimize2
} from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Department, OrganigramPosition, User } from '../types/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrgNode {
  position: OrganigramPosition;
  children: OrgNode[];
  level: number;
  type: 'ceo' | 'teamlead' | 'manager' | 'employee';
  x: number;
  y: number;
  width: number;
  height: number;
  isCollapsed?: boolean;
}

interface ModernOrgChartProps {
  positions: OrganigramPosition[];
  users: User[];
  departments: Department[];
  onNodeClick?: (position: OrganigramPosition) => void;
}

const NODE_WIDTH = 300;
const NODE_HEIGHT = 140;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 100;

export default function ModernOrgChart({
  positions,
  users,
  departments,
  onNodeClick,
}: ModernOrgChartProps) {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);

  // Build tree structure with positioning
  const buildTree = useCallback(() => {
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

    // Sort positions within departments
    Object.keys(byDept).forEach(deptId => {
      byDept[deptId].sort((a, b) => a.sort_order - b.sort_order);
    });

    const nodes: OrgNode[] = [];

    // Find management department
    const managementDept = departments.find(d => 
      d.name.toLowerCase().includes('geschäftsführung') || 
      d.name.toLowerCase().includes('management') ||
      d.name.toLowerCase().includes('ceo')
    );

    if (managementDept && byDept[managementDept.id]?.length > 0) {
      // CEO node
      const ceoPosition = byDept[managementDept.id][0];
      const ceoNode: OrgNode = {
        position: ceoPosition,
        children: [],
        level: 0,
        type: 'ceo',
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        isCollapsed: collapsedNodes.has(ceoPosition.id),
      };

      // Management teamleads
      const managementTeamleads = byDept[managementDept.id].slice(1);
      managementTeamleads.forEach(pos => {
        ceoNode.children.push({
          position: pos,
          children: [],
          level: 1,
          type: 'teamlead',
          x: 0,
          y: 0,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          isCollapsed: collapsedNodes.has(pos.id),
        });
      });

      // Other departments
      const sortedDepts = [...departments]
        .filter(d => d.id !== managementDept.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      sortedDepts.forEach(dept => {
        // Check if department has positions
        if (!byDept[dept.id] || byDept[dept.id].length === 0) {
          // Create a placeholder node for empty departments
          const placeholderNode: OrgNode = {
            position: {
              id: `placeholder-${dept.id}`,
              name: `${dept.name} (Leer)`,
              department_id: dept.id,
              organization_id: dept.organization_id,
              sort_order: 0,
              is_active: true,
              specialization: 'Keine Positionen erstellt',
              primary_user_id: null,
              backup_user_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as OrganigramPosition,
            children: [],
            level: 1,
            type: 'teamlead',
            x: 0,
            y: 0,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            isCollapsed: collapsedNodes.has(dept.id),
          };
          ceoNode.children.push(placeholderNode);
          return;
        }
        
        const deptHead = byDept[dept.id][0];
        const deptHeadNode: OrgNode = {
          position: deptHead,
          children: [],
          level: 1,
          type: 'teamlead',
          x: 0,
          y: 0,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          isCollapsed: collapsedNodes.has(deptHead.id),
        };

        const deptEmployees = byDept[dept.id].slice(1);
        deptEmployees.forEach(pos => {
          deptHeadNode.children.push({
            position: pos,
            children: [],
            level: 2,
            type: 'employee',
            x: 0,
            y: 0,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            isCollapsed: collapsedNodes.has(pos.id),
          });
        });

        ceoNode.children.push(deptHeadNode);
      });

      nodes.push(ceoNode);
    } else {
      // No management - show all departments at top level
      const sortedDepts = [...departments].sort((a, b) => a.sort_order - b.sort_order);
      
      sortedDepts.forEach(dept => {
        // Check if department has positions
        if (!byDept[dept.id] || byDept[dept.id].length === 0) {
          // Create a placeholder node for empty departments
          const placeholderNode: OrgNode = {
            position: {
              id: `placeholder-${dept.id}`,
              name: `${dept.name} (Leer)`,
              department_id: dept.id,
              organization_id: dept.organization_id,
              sort_order: 0,
              is_active: true,
              specialization: 'Keine Positionen erstellt',
              primary_user_id: null,
              backup_user_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as OrganigramPosition,
            children: [],
            level: 0,
            type: 'teamlead',
            x: 0,
            y: 0,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            isCollapsed: collapsedNodes.has(dept.id),
          };
          nodes.push(placeholderNode);
          return;
        }
        
        const deptHead = byDept[dept.id][0];
        const deptHeadNode: OrgNode = {
          position: deptHead,
          children: [],
          level: 0,
          type: 'teamlead',
          x: 0,
          y: 0,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          isCollapsed: collapsedNodes.has(deptHead.id),
        };

        const deptEmployees = byDept[dept.id].slice(1);
        deptEmployees.forEach(pos => {
          deptHeadNode.children.push({
            position: pos,
            children: [],
            level: 1,
            type: 'employee',
            x: 0,
            y: 0,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            isCollapsed: collapsedNodes.has(pos.id),
          });
        });

        nodes.push(deptHeadNode);
      });
    }

    // Calculate positions
    calculateNodePositions(nodes);
    return nodes;
  }, [positions, departments, collapsedNodes]);

  // Calculate node positions recursively
  const calculateNodePositions = (nodes: OrgNode[], startX = 0, startY = 0) => {
    if (nodes.length === 0) return { width: 0, height: 0 };

    let currentX = startX;
    
    nodes.forEach((node, index) => {
      // Calculate children positions first (if not collapsed)
      const visibleChildren = node.isCollapsed ? [] : node.children;
      const childrenLayout = calculateNodePositions(
        visibleChildren,
        0,
        startY + NODE_HEIGHT + VERTICAL_SPACING
      );

      const nodeWidth = Math.max(
        NODE_WIDTH,
        childrenLayout.width || NODE_WIDTH
      );

      // Center node above children
      node.x = currentX + (nodeWidth - NODE_WIDTH) / 2;
      node.y = startY;

      // Position children under this node
      if (visibleChildren.length > 0) {
        const childrenStartX = currentX;
        let childX = childrenStartX;
        
        visibleChildren.forEach((child) => {
          child.x += childX;
          childX += calculateSubtreeWidth(child) + HORIZONTAL_SPACING;
        });
      }

      currentX += nodeWidth + HORIZONTAL_SPACING;
    });

    const totalWidth = currentX - startX - HORIZONTAL_SPACING;
    const totalHeight = startY + NODE_HEIGHT + 
      (nodes.some(n => !n.isCollapsed && n.children.length > 0) 
        ? VERTICAL_SPACING + NODE_HEIGHT 
        : 0);

    return { width: totalWidth, height: totalHeight };
  };

  // Calculate subtree width
  const calculateSubtreeWidth = (node: OrgNode): number => {
    if (node.isCollapsed || node.children.length === 0) {
      return NODE_WIDTH;
    }

    const childrenWidth = node.children.reduce((sum, child) => {
      return sum + calculateSubtreeWidth(child) + HORIZONTAL_SPACING;
    }, 0) - HORIZONTAL_SPACING;

    return Math.max(NODE_WIDTH, childrenWidth);
  };

  useEffect(() => {
    setTree(buildTree());
  }, [buildTree]);

  // Toggle collapse
  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setHighlightedNodeId(null);
      return;
    }

    const foundPosition = positions.find(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (foundPosition) {
      setHighlightedNodeId(foundPosition.id);
      // Expand all parent nodes
      setCollapsedNodes(new Set());
    }
  };

  // Export as PNG
  const exportAsPNG = async () => {
    if (!chartRef.current) return;
    
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    const link = document.createElement('a');
    link.download = 'organigram.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Export as PDF
  const exportAsPDF = async () => {
    if (!chartRef.current) return;
    
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('organigram.pdf');
  };

  // Get node color
  const getNodeColor = (type: string, isHighlighted: boolean) => {
    if (isHighlighted) {
      return 'from-yellow-100 to-yellow-200 border-yellow-400 ring-4 ring-yellow-300';
    }
    switch (type) {
      case 'ceo':
        return 'from-purple-50 to-purple-100 border-purple-300 hover:shadow-purple-200';
      case 'teamlead':
        return 'from-blue-50 to-blue-100 border-blue-300 hover:shadow-blue-200';
      case 'manager':
      case 'employee':
        return 'from-green-50 to-green-100 border-green-300 hover:shadow-green-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-300';
    }
  };

  // Get node icon
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'ceo':
        return <Shield className="w-5 h-5 text-purple-600" />;
      case 'teamlead':
        return <Star className="w-5 h-5 text-blue-600" />;
      default:
        return <Users className="w-5 h-5 text-green-600" />;
    }
  };

  // Render node
  const renderNode = (node: OrgNode) => {
    const dept = departments.find(d => d.id === node.position.department_id);
    const primaryUser = node.position.primary_user_id 
      ? users.find(u => u.id === node.position.primary_user_id)
      : null;
    const hasChildren = node.children.length > 0;
    const isHighlighted = highlightedNodeId === node.position.id;
    const isPlaceholder = node.position.id.startsWith('placeholder-');

    return (
      <g key={node.position.id}>
        {/* Node card */}
        <foreignObject
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
        >
          <div
            className={`
              relative group cursor-pointer transition-all duration-300
              bg-gradient-to-br ${getNodeColor(node.type, isHighlighted)}
              ${isPlaceholder ? 'border-dashed opacity-70' : 'border-2'}
              rounded-xl p-4 h-full
              hover:shadow-xl hover:scale-105
              ${isHighlighted ? 'animate-pulse' : ''}
            `}
            onClick={() => !isPlaceholder && onNodeClick?.(node.position)}
          >
            {/* Collapse button */}
            {hasChildren && (
              <button
                onClick={(e) => toggleCollapse(node.position.id, e)}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 z-10 shadow-md"
              >
                {node.isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}

            {/* Department badge */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
              <Building2 className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600 truncate font-medium">{dept?.name}</span>
            </div>

            {/* Position info */}
            <div className="flex items-start gap-2 mb-3">
              {getNodeIcon(node.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate text-sm">
                  {node.position.name}
                </h4>
                {node.position.specialization && (
                  <p className="text-xs text-gray-500 truncate">
                    {node.position.specialization}
                  </p>
                )}
              </div>
            </div>

            {/* User info */}
            {primaryUser ? (
              <div className="flex items-center gap-2 bg-white/80 rounded-lg p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={primaryUser.profile_picture || undefined} />
                  <AvatarFallback className="text-xs">
                    {primaryUser.first_name?.[0]}{primaryUser.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {primaryUser.first_name} {primaryUser.last_name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2 border border-dashed border-gray-300">
                <UserCircle className="w-8 h-8 text-gray-400" />
                <p className="text-xs text-gray-500">Nicht besetzt</p>
              </div>
            )}

            {/* Children count badge */}
            {hasChildren && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 text-xs"
              >
                {node.children.length}
              </Badge>
            )}

            {/* Placeholder hint */}
            {isPlaceholder && (
              <Badge 
                variant="outline" 
                className="absolute -top-2 -right-2 text-xs bg-amber-50 text-amber-700 border-amber-300"
              >
                Leer
              </Badge>
            )}
          </div>
        </foreignObject>

        {/* Connection lines to children */}
        {!node.isCollapsed && node.children.length > 0 && (
          <>
            {/* Vertical line down */}
            <line
              x1={node.x + NODE_WIDTH / 2}
              y1={node.y + NODE_HEIGHT}
              x2={node.x + NODE_WIDTH / 2}
              y2={node.y + NODE_HEIGHT + VERTICAL_SPACING / 2}
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Horizontal line connecting children */}
            {node.children.length > 1 && (
              <line
                x1={node.children[0].x + NODE_WIDTH / 2}
                y1={node.y + NODE_HEIGHT + VERTICAL_SPACING / 2}
                x2={node.children[node.children.length - 1].x + NODE_WIDTH / 2}
                y2={node.y + NODE_HEIGHT + VERTICAL_SPACING / 2}
                stroke="#cbd5e1"
                strokeWidth="2"
              />
            )}

            {/* Vertical lines to each child */}
            {node.children.map(child => (
              <line
                key={child.position.id}
                x1={child.x + NODE_WIDTH / 2}
                y1={node.y + NODE_HEIGHT + VERTICAL_SPACING / 2}
                x2={child.x + NODE_WIDTH / 2}
                y2={child.y}
                stroke="#cbd5e1"
                strokeWidth="2"
              />
            ))}
          </>
        )}

        {/* Render children recursively */}
        {!node.isCollapsed && node.children.map(child => renderNode(child))}
      </g>
    );
  };

  // Calculate SVG dimensions
  const getSVGDimensions = () => {
    if (tree.length === 0) return { width: 1000, height: 600 };

    let maxX = 0;
    let maxY = 0;

    const traverse = (node: OrgNode) => {
      maxX = Math.max(maxX, node.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.y + NODE_HEIGHT);
      if (!node.isCollapsed) {
        node.children.forEach(traverse);
      }
    };

    tree.forEach(traverse);

    return {
      width: maxX + 100,
      height: maxY + 100,
    };
  };

  const svgDims = getSVGDimensions();

  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="mb-2">Noch keine Abteilungen vorhanden</p>
        <p className="text-sm">
          Lade die Seite neu, um die Standard-Abteilung "Geschäftsführung" zu erstellen.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Position suchen..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => transformRef.current?.zoomIn()}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => transformRef.current?.zoomOut()}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => transformRef.current?.resetTransform()}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsPNG}
          >
            <Download className="w-4 h-4 mr-1" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsPDF}
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className={`border rounded-lg bg-gray-50 ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}`}>
        <TransformWrapper
          ref={transformRef}
          initialScale={0.7}
          minScale={0.1}
          maxScale={2}
          centerOnInit
          wheel={{ step: 0.1 }}
          panning={{ velocityDisabled: true }}
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full"
          >
            <div ref={chartRef} className="w-full h-full flex items-center justify-center p-8">
              <svg
                width={svgDims.width}
                height={svgDims.height}
                className="overflow-visible"
              >
                {tree.map(node => renderNode(node))}
              </svg>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300" />
          <span>CEO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300" />
          <span>Teamlead</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-green-100 to-green-200 border border-green-300" />
          <span>Mitarbeiter</span>
        </div>
      </div>
    </div>
  );
}
