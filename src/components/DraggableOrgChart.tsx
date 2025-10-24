import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Plus, Info } from './icons/HRTHISIcons';
import { Department, User } from '../types/database';
import { useOrganigramStore } from '../stores/HRTHIS_organigramStore';
import svgPaths from '../imports/svg-pkwhrqe2rm';

interface DraggableOrgChartProps {
  departments: Department[];
  users: User[];
  onNodeClick?: (department: Department) => void;
  onAddDepartment?: () => void;
}

const NODE_WIDTH = 204;
const NODE_HEIGHT_FULL = 139;
const NODE_HEIGHT_LOCATION = 48;

// ==================== SVG ICONS FROM FIGMA ====================

// Department Icon (Small Building)
function DepartmentIcon() {
  return (
    <div className="relative shrink-0 size-[9.6px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_dept)" id="Icon">
          <path d={svgPaths.pb241600} id="Vector" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.799998" />
          <path d={svgPaths.p31745400} id="Vector_2" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.799998" />
          <path d={svgPaths.p1b2faf40} id="Vector_3" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.799998" />
          <path d="M3.99999 2.39999H5.59999" id="Vector_4" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.799998" />
          <path d="M3.99999 3.99999H5.59999" id="Vector_5" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.799998" />
          <path d="M3.99999 5.59999H5.59999" id="Vector_6" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.799998" />
          <path d="M3.99999 7.19998H5.59999" id="Vector_7" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.799998" />
        </g>
        <defs>
          <clipPath id="clip0_dept">
            <rect fill="white" height="9.59998" width="9.59998" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

// MapPin Icon (Location)
function MapPinIcon() {
  return (
    <div className="h-[19px] relative shrink-0 w-[16px]">
      <div className="absolute inset-[-3.95%_-4.69%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <g id="Group">
            <path clipRule="evenodd" d={svgPaths.p30855900} fill="black" fillOpacity="0.16" fillRule="evenodd" id="Vector" />
            <path d={svgPaths.pd9df900} id="Vector_2" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

// CheckCircle Icon (Primary User - Green)
function CheckCircleIcon() {
  return (
    <div className="relative shrink-0 size-[25.6px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 26">
        <g id="Icon">
          <path d={svgPaths.p15030870} id="Vector" stroke="#01C418" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.13333" />
          <path d={svgPaths.p162c6800} id="Vector_2" stroke="#01C418" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.13333" />
          <path d={svgPaths.p1e7b6180} id="Vector_3" stroke="#01C418" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.13333" />
        </g>
      </svg>
    </div>
  );
}

// AlertCircle Icon (Backup User - Yellow)
function AlertCircleIcon() {
  return (
    <div className="relative shrink-0 size-[25.6px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 26">
        <g id="Icon">
          <path d={svgPaths.p15030870} id="Vector" stroke="#FFD230" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.13333" />
          <path d={svgPaths.p162c6800} id="Vector_2" stroke="#FFD230" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.13333" />
          <path d={svgPaths.p1e7b6180} id="Vector_3" stroke="#FFD230" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.13333" />
        </g>
      </svg>
    </div>
  );
}

// ==================== DRAGGABLE NODE COMPONENT ====================

interface DraggableNodeProps {
  department: Department;
  users: User[];
  onNodeClick?: (department: Department) => void;
  onPositionUpdate: (id: string, x: number, y: number) => void;
}

function DraggableNode({ department, users, onNodeClick, onPositionUpdate }: DraggableNodeProps) {
  const [position, setPosition] = useState({
    x: department.x_position ?? 100,
    y: department.y_position ?? 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onPositionUpdate(department.id, position.x, position.y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position, department.id, onPositionUpdate]);

  const primaryUser = department.primary_user_id 
    ? users.find(u => u.id === department.primary_user_id)
    : null;
  
  const backupUser = department.backup_user_id
    ? users.find(u => u.id === department.backup_user_id)
    : null;

  const isLocation = department.is_location;
  const nodeHeight = isLocation ? NODE_HEIGHT_LOCATION : NODE_HEIGHT_FULL;

  // ==================== LOCATION NODE (HEIGHT: 48px) ====================
  if (isLocation) {
    return (
      <div
        className="absolute cursor-move select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${NODE_WIDTH}px`,
          height: `${nodeHeight}px`,
          opacity: isDragging ? 0.3 : 0.6,
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            onNodeClick?.(department);
          }
        }}
      >
        {/* Background with border and shadow */}
        <div 
          aria-hidden="true" 
          className="absolute border-2 border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" 
        />
        
        {/* Location Name Container */}
        <div className="absolute box-border content-stretch flex gap-[3.2px] h-[20px] items-center left-[11.2px] pb-px pt-0 px-0 top-[11.2px] w-[169.6px]">
          <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-200 border-solid inset-0 pointer-events-none" />
          <p className="font-['Inter',_sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#101828] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre">
            {department.name}
          </p>
          <MapPinIcon />
        </div>
      </div>
    );
  }

  // ==================== DEPARTMENT NODE (HEIGHT: 139px) ====================
  return (
    <div
      className="absolute cursor-move select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${NODE_WIDTH}px`,
        height: `${nodeHeight}px`,
        opacity: isDragging ? 0.3 : 0.6,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onNodeClick?.(department);
        }
      }}
    >
      {/* Background with border and shadow */}
      <div 
        aria-hidden="true" 
        className="absolute border-2 border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" 
      />
      
      {/* Department Name Container */}
      <div className="absolute box-border content-stretch flex gap-[3.2px] h-[20px] items-center left-[11.2px] pb-px pt-0 px-0 top-[11.2px] w-[169.6px]">
        <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-200 border-solid inset-0 pointer-events-none" />
        <DepartmentIcon />
        <p className="font-['Inter',_sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#101828] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre">
          {department.name}
        </p>
      </div>

      {/* Primary User Container */}
      <div className="absolute content-stretch flex gap-[6.4px] h-[25.6px] items-center left-[11px] top-[55px] w-[169.6px]">
        <CheckCircleIcon />
        <div className="h-[12.8px] relative shrink-0 w-[74.838px]">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[12.8px] relative w-[74.838px]">
            <p className="absolute font-['Inter',_sans-serif] font-normal leading-[16px] left-0 not-italic text-[#99a1af] text-[12px] text-nowrap top-[0.8px] whitespace-pre">
              {primaryUser ? `${primaryUser.first_name} ${primaryUser.last_name}` : 'Nicht zugewiesen'}
            </p>
          </div>
        </div>
      </div>

      {/* Backup User Container */}
      <div className="absolute content-stretch flex gap-[6.4px] h-[25.6px] items-center left-[12px] top-[87px] w-[169.6px]">
        <AlertCircleIcon />
        <div className="h-[12.8px] relative shrink-0 w-[74.838px]">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[12.8px] relative w-[74.838px]">
            <p className="absolute font-['Inter',_sans-serif] font-normal leading-[16px] left-0 not-italic text-[#99a1af] text-[12px] text-nowrap top-[0.8px] whitespace-pre">
              {backupUser ? `${backupUser.first_name} ${backupUser.last_name}` : 'Kein Backup'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== CONNECTION LINES ====================

function ConnectionLines({ departments }: { departments: Department[] }) {
  const connections: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];

  departments.forEach(dept => {
    if (dept.parent_department_id) {
      const parent = departments.find(d => d.id === dept.parent_department_id);
      if (parent && parent.x_position != null && parent.y_position != null && 
          dept.x_position != null && dept.y_position != null) {
        
        const parentHeight = parent.is_location ? NODE_HEIGHT_LOCATION : NODE_HEIGHT_FULL;
        const childHeight = dept.is_location ? NODE_HEIGHT_LOCATION : NODE_HEIGHT_FULL;
        
        // Connection from center bottom of parent to center top of child
        const fromX = parent.x_position + NODE_WIDTH / 2;
        const fromY = parent.y_position + parentHeight;
        const toX = dept.x_position + NODE_WIDTH / 2;
        const toY = dept.y_position;

        connections.push({
          from: { x: fromX, y: fromY },
          to: { x: toX, y: toY },
        });
      }
    }
  });

  if (connections.length === 0) return null;

  // Calculate SVG bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  departments.forEach(dept => {
    if (dept.x_position != null && dept.y_position != null) {
      const height = dept.is_location ? NODE_HEIGHT_LOCATION : NODE_HEIGHT_FULL;
      minX = Math.min(minX, dept.x_position);
      minY = Math.min(minY, dept.y_position);
      maxX = Math.max(maxX, dept.x_position + NODE_WIDTH);
      maxY = Math.max(maxY, dept.y_position + height);
    }
  });

  const width = maxX - minX + 400;
  const height = maxY - minY + 400;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {connections.map((conn, idx) => (
        <line
          key={idx}
          x1={conn.from.x}
          y1={conn.from.y}
          x2={conn.to.x}
          y2={conn.to.y}
          stroke="black"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

// ==================== MAIN COMPONENT ====================

export default function DraggableOrgChart({
  departments,
  users,
  onNodeClick,
  onAddDepartment,
}: DraggableOrgChartProps) {
  const { updateDepartmentPosition } = useOrganigramStore();

  const handlePositionUpdate = (id: string, x: number, y: number) => {
    updateDepartmentPosition(id, x, y);
  };

  // Calculate canvas size
  const canvasWidth = departments.reduce((max, dept) => {
    const height = dept.is_location ? NODE_HEIGHT_LOCATION : NODE_HEIGHT_FULL;
    return Math.max(max, (dept.x_position ?? 0) + NODE_WIDTH + 200);
  }, 1400);
  
  const canvasHeight = departments.reduce((max, dept) => {
    const height = dept.is_location ? NODE_HEIGHT_LOCATION : NODE_HEIGHT_FULL;
    return Math.max(max, (dept.y_position ?? 0) + height + 200);
  }, 1000);

  if (departments.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <DepartmentIcon />
          </div>
          <p className="text-gray-600 mb-4">Noch keine Abteilungen vorhanden</p>
          {onAddDepartment && (
            <Button onClick={onAddDepartment}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Abteilung erstellen
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">Drag & Drop Organigram (Figma Design):</p>
              <ul className="space-y-1 text-blue-800">
                <li>🖱️ <strong>Klicken & Ziehen</strong> → Abteilungen frei positionieren</li>
                <li>🔗 <strong>Verbindungen</strong> → Automatische Hierarchie-Linien</li>
                <li>📍 <strong>Pin-Icon</strong> → Standorte (48px hoch, opacity 60%)</li>
                <li>🏢 <strong>Building-Icon</strong> → Abteilungen (139px hoch, opacity 60%)</li>
                <li>✅ <strong>Grünes Icon</strong> → Primärer Verantwortlicher</li>
                <li>⚠️ <strong>Gelbes Icon</strong> → Backup Verantwortlicher</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                💡 Tipp: Positionen werden automatisch gespeichert
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Container */}
      <div className="border-2 border-gray-200 rounded-lg bg-white overflow-auto" style={{ height: '600px' }}>
        <div
          className="relative bg-gradient-to-br from-blue-50/30 to-purple-50/30"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          {/* Connection Lines */}
          <ConnectionLines departments={departments} />

          {/* Draggable Nodes */}
          {departments.map((dept) => (
            <DraggableNode
              key={dept.id}
              department={dept}
              users={users}
              onNodeClick={onNodeClick}
              onPositionUpdate={handlePositionUpdate}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <MapPinIcon />
          </div>
          <span>Standort</span>
        </div>
        <div className="flex items-center gap-2">
          <DepartmentIcon />
          <span>Abteilung</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <CheckCircleIcon />
          </div>
          <span>Primärer Verantwortlicher</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <AlertCircleIcon />
          </div>
          <span>Backup Verantwortlicher</span>
        </div>
      </div>
    </div>
  );
}