import { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  Building2,
  UserCircle,
  Minimize2,
  RotateCcw
} from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Department, OrganigramPosition, User } from '../types/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrgNode {
  position: OrganigramPosition;
  children: OrgNode[];
  level: number;
  type: 'ceo' | 'department' | 'employee';
  x: number;
  y: number;
}

interface SimpleOrgChartProps {
  positions: OrganigramPosition[];
  users: User[];
  departments: Department[];
  onNodeClick?: (position: OrganigramPosition) => void;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 80;

export default function SimpleOrgChart({
  positions,
  users,
  departments,
  onNodeClick,
}: SimpleOrgChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);

  // Build tree structure
  const buildTree = () => {
    if (departments.length === 0) return { root: null, width: 0, height: 0 };

    // Group positions by department
    const byDept: Record<string, OrganigramPosition[]> = {};
    positions.forEach(pos => {
      if (!byDept[pos.department_id]) {
        byDept[pos.department_id] = [];
      }
      byDept[pos.department_id].push(pos);
    });

    // Sort positions within departments by sort_order
    Object.keys(byDept).forEach(deptId => {
      byDept[deptId].sort((a, b) => a.sort_order - b.sort_order);
    });

    // Find management department (CEO)
    const managementDept = departments.find(d => 
      d.name.toLowerCase().includes('geschäftsführung') || 
      d.name.toLowerCase().includes('management') ||
      d.name.toLowerCase().includes('ceo')
    );

    let rootNode: OrgNode | null = null;

    // Create CEO node if management department exists and has positions
    if (managementDept && byDept[managementDept.id]?.length > 0) {
      const ceoPosition = byDept[managementDept.id][0];
      rootNode = {
        position: ceoPosition,
        children: [],
        level: 0,
        type: 'ceo',
        x: 0,
        y: 0,
      };

      // Add other positions from management as employees under CEO
      const managementEmployees = byDept[managementDept.id].slice(1);
      managementEmployees.forEach(pos => {
        rootNode!.children.push({
          position: pos,
          children: [],
          level: 1,
          type: 'employee',
          x: 0,
          y: 0,
        });
      });

      // Add department heads as children of CEO
      const otherDepts = departments
        .filter(d => d.id !== managementDept.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      otherDepts.forEach(dept => {
        const deptPositions = byDept[dept.id] || [];
        
        if (deptPositions.length > 0) {
          // First position is department head
          const deptHead = deptPositions[0];
          const deptHeadNode: OrgNode = {
            position: deptHead,
            children: [],
            level: 1,
            type: 'department',
            x: 0,
            y: 0,
          };

          // Other positions are employees under department head
          const deptEmployees = deptPositions.slice(1);
          deptEmployees.forEach(pos => {
            deptHeadNode.children.push({
              position: pos,
              children: [],
              level: 2,
              type: 'employee',
              x: 0,
              y: 0,
            });
          });

          rootNode!.children.push(deptHeadNode);
        } else {
          // Empty department - create placeholder
          const placeholderPosition: OrganigramPosition = {
            id: `placeholder-${dept.id}`,
            name: dept.name,
            department_id: dept.id,
            organization_id: dept.organization_id,
            sort_order: 0,
            is_active: true,
            specialization: 'Keine Positionen',
            primary_user_id: null,
            backup_user_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          rootNode!.children.push({
            position: placeholderPosition,
            children: [],
            level: 1,
            type: 'department',
            x: 0,
            y: 0,
          });
        }
      });
    } else {
      // No management - show all departments at top level
      const sortedDepts = [...departments].sort((a, b) => a.sort_order - b.sort_order);
      
      // Create a virtual root to hold all departments
      const virtualRoot: OrgNode = {
        position: {
          id: 'virtual-root',
          name: 'Organisation',
          department_id: '',
          organization_id: departments[0]?.organization_id || '',
          sort_order: 0,
          is_active: true,
          specialization: null,
          primary_user_id: null,
          backup_user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        children: [],
        level: 0,
        type: 'ceo',
        x: 0,
        y: 0,
      };

      sortedDepts.forEach(dept => {
        const deptPositions = byDept[dept.id] || [];
        
        if (deptPositions.length > 0) {
          const deptHead = deptPositions[0];
          const deptHeadNode: OrgNode = {
            position: deptHead,
            children: [],
            level: 1,
            type: 'department',
            x: 0,
            y: 0,
          };

          const deptEmployees = deptPositions.slice(1);
          deptEmployees.forEach(pos => {
            deptHeadNode.children.push({
              position: pos,
              children: [],
              level: 2,
              type: 'employee',
              x: 0,
              y: 0,
            });
          });

          virtualRoot.children.push(deptHeadNode);
        } else {
          // Empty department
          const placeholderPosition: OrganigramPosition = {
            id: `placeholder-${dept.id}`,
            name: dept.name,
            department_id: dept.id,
            organization_id: dept.organization_id,
            sort_order: 0,
            is_active: true,
            specialization: 'Keine Positionen',
            primary_user_id: null,
            backup_user_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          virtualRoot.children.push({
            position: placeholderPosition,
            children: [],
            level: 1,
            type: 'department',
            x: 0,
            y: 0,
          });
        }
      });

      rootNode = virtualRoot;
    }

    // Calculate positions using tree layout algorithm
    if (rootNode) {
      calculateTreeLayout(rootNode);
      const bounds = getTreeBounds(rootNode);
      return {
        root: rootNode,
        width: bounds.maxX - bounds.minX + NODE_WIDTH + 200,
        height: bounds.maxY + NODE_HEIGHT + 100,
      };
    }

    return { root: null, width: 0, height: 0 };
  };

  // Calculate horizontal position based on subtree width
  const calculateTreeLayout = (node: OrgNode, depth: number = 0) => {
    node.level = depth;
    node.y = depth * (NODE_HEIGHT + VERTICAL_GAP);

    if (node.children.length === 0) {
      node.x = 0;
      return NODE_WIDTH;
    }

    // Recursively calculate positions for children
    let totalWidth = 0;
    const childWidths: number[] = [];

    node.children.forEach((child) => {
      const childWidth = calculateTreeLayout(child, depth + 1);
      childWidths.push(childWidth);
      totalWidth += childWidth;
    });

    // Add gaps between children
    totalWidth += (node.children.length - 1) * HORIZONTAL_GAP;

    // Position children
    let currentX = 0;
    node.children.forEach((child, i) => {
      const childCenterOffset = childWidths[i] / 2;
      child.x = currentX + childCenterOffset - NODE_WIDTH / 2;
      currentX += childWidths[i] + HORIZONTAL_GAP;
    });

    // Center parent over children
    const firstChildX = node.children[0].x + NODE_WIDTH / 2;
    const lastChildX = node.children[node.children.length - 1].x + NODE_WIDTH / 2;
    node.x = (firstChildX + lastChildX) / 2 - NODE_WIDTH / 2;

    return Math.max(totalWidth, NODE_WIDTH);
  };

  // Get bounds of entire tree
  const getTreeBounds = (node: OrgNode) => {
    let minX = node.x;
    let maxX = node.x + NODE_WIDTH;
    let maxY = node.y + NODE_HEIGHT;

    const traverse = (n: OrgNode) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.y + NODE_HEIGHT);
      n.children.forEach(traverse);
    };

    traverse(node);
    return { minX, maxX, maxY };
  };

  // Shift tree to start from (100, 50)
  const shiftTree = (node: OrgNode, offsetX: number, offsetY: number) => {
    node.x += offsetX;
    node.y += offsetY;
    node.children.forEach(child => shiftTree(child, offsetX, offsetY));
  };

  const { root, width, height } = buildTree();

  // Shift tree to positive coordinates
  if (root) {
    const bounds = getTreeBounds(root);
    shiftTree(root, -bounds.minX + 100, 50);
  }

  // Export functions
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

  const exportAsPDF = async () => {
    if (!chartRef.current) return;
    
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height],
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save('organigram.pdf');
  };

  // Render a single node
  const renderNode = (node: OrgNode) => {
    const dept = departments.find(d => d.id === node.position.department_id);
    const primaryUser = node.position.primary_user_id 
      ? users.find(u => u.id === node.position.primary_user_id)
      : null;
    const isPlaceholder = node.position.id.startsWith('placeholder-');
    const isVirtual = node.position.id === 'virtual-root';

    // Don't render virtual root
    if (isVirtual) return null;

    // Color based on type
    const bgColor = isPlaceholder 
      ? 'from-gray-100 to-gray-50 border-gray-300 border-dashed'
      : node.type === 'ceo' 
      ? 'from-purple-100 to-purple-50 border-purple-300'
      : node.type === 'department'
      ? 'from-blue-100 to-blue-50 border-blue-300'
      : 'from-green-100 to-green-50 border-green-300';

    return (
      <div
        key={node.position.id}
        className={`absolute bg-gradient-to-br ${bgColor} border-2 rounded-lg p-3 shadow-lg transition-all hover:shadow-xl cursor-pointer ${isPlaceholder ? 'opacity-60' : ''}`}
        style={{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${NODE_WIDTH}px`,
          height: `${NODE_HEIGHT}px`,
        }}
        onClick={() => !isPlaceholder && onNodeClick?.(node.position)}
      >
        {/* Department Badge */}
        {dept && (
          <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-200">
            <Building2 className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600 font-medium truncate">{dept.name}</span>
          </div>
        )}

        {/* Position Name */}
        <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
          {node.position.name}
        </h4>

        {/* Specialization */}
        {node.position.specialization && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            {node.position.specialization}
          </p>
        )}

        {/* User Info */}
        {primaryUser ? (
          <div className="flex items-center gap-2 mt-auto">
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
          <div className="flex items-center gap-2 mt-auto text-gray-400">
            <UserCircle className="w-8 h-8" />
            <p className="text-xs">{isPlaceholder ? 'Keine Positionen' : 'Nicht besetzt'}</p>
          </div>
        )}

        {/* Placeholder Badge */}
        {isPlaceholder && (
          <Badge 
            variant="outline" 
            className="absolute top-2 right-2 text-xs bg-amber-50 text-amber-700 border-amber-300"
          >
            Leer
          </Badge>
        )}
      </div>
    );
  };

  // Render connection lines
  const renderConnections = (node: OrgNode): JSX.Element[] => {
    const lines: JSX.Element[] = [];
    const isVirtual = node.position.id === 'virtual-root';

    node.children.forEach((child) => {
      // Start point (bottom center of parent)
      const parentX = node.x + NODE_WIDTH / 2;
      const parentY = node.y + NODE_HEIGHT;

      // End point (top center of child)
      const childX = child.x + NODE_WIDTH / 2;
      const childY = child.y;

      // Middle point for the horizontal line
      const midY = parentY + VERTICAL_GAP / 2;

      // Path: vertical down from parent, horizontal to child column, vertical down to child
      const pathData = `
        M ${parentX} ${parentY}
        L ${parentX} ${midY}
        L ${childX} ${midY}
        L ${childX} ${childY}
      `;

      lines.push(
        <path
          key={`${node.position.id}-${child.position.id}`}
          d={pathData}
          fill="none"
          stroke={isVirtual ? 'transparent' : '#94a3b8'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      );

      // Recursively render connections for children
      lines.push(...renderConnections(child));
    });

    return lines;
  };

  // Render all nodes recursively
  const renderAllNodes = (node: OrgNode): JSX.Element[] => {
    const nodes = [renderNode(node)];
    node.children.forEach(child => {
      nodes.push(...renderAllNodes(child));
    });
    return nodes.filter(Boolean) as JSX.Element[];
  };

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

  if (!root) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>Fehler beim Laden der Organisationsstruktur</p>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Organisations-Hierarchie</span>
        </div>

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
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsPNG}
          >
            <Download className="w-4 h-4 mr-2" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
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
        </div>
      </div>

      {/* Chart Container */}
      <div 
        className={`border border-gray-200 rounded-lg bg-white overflow-hidden ${
          isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'
        }`}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={0.8}
          minScale={0.3}
          maxScale={2}
          centerOnInit
        >
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: '100%',
            }}
          >
            <div
              ref={chartRef}
              className="relative bg-gradient-to-br from-blue-50/30 to-purple-50/30"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                minWidth: '100%',
                minHeight: '100%',
              }}
            >
              {/* SVG for connection lines */}
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={width}
                height={height}
              >
                {renderConnections(root)}
              </svg>

              {/* Render all nodes */}
              {renderAllNodes(root)}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-300 rounded"></div>
          <span>CEO / Geschäftsführung</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-300 rounded"></div>
          <span>Abteilungsleiter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-green-100 to-green-50 border-2 border-green-300 rounded"></div>
          <span>Mitarbeiter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-dashed border-gray-300 rounded"></div>
          <span>Leere Abteilung</span>
        </div>
      </div>
    </div>
  );
}