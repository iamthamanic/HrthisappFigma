import { useState, useRef, memo } from 'react';
import { cn } from './ui/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

/**
 * CONNECTION LINE COMPONENT
 * ==========================
 * Pure SVG Line between two pin points
 * 
 * Features:
 * - Curved (Bezier) or Orthogonal style
 * - Click to select
 * - Hover effect
 * - Click to disconnect from nearest side (with confirmation)
 */

export type LineStyle = 'curved' | 'orthogonal' | 'straight';

interface Point {
  x: number;
  y: number;
}

interface ConnectionLineProps {
  id: string;
  start: Point;
  end: Point;
  style: LineStyle;
  color?: string;
  strokeWidth?: number;
  isSelected?: boolean;
  isReconnecting?: boolean; // NEW: Gray out during reconnection
  isConnectedToSelectedNode?: boolean; // NEW: Green when connected to selected node
  onSelect?: (id: string) => void;
  onReconnectStart?: (connectionId: string, isDraggingSource: boolean) => void; // NEW: Start reconnection
  onDisconnect?: (connectionId: string, disconnectFromSource: boolean) => void; // NEW: Disconnect from one side
  sourceNodeName?: string; // NEW: For confirmation dialog
  targetNodeName?: string; // NEW: For confirmation dialog
  className?: string;
}

function ConnectionLine({
  id,
  start,
  end,
  style = 'curved',
  color = '#6B7280',
  strokeWidth = 10, // Extra thick lines for maximum visibility
  isSelected = false,
  isReconnecting = false,
  isConnectedToSelectedNode = false,
  onSelect,
  onReconnectStart,
  onDisconnect,
  sourceNodeName = 'Start',
  targetNodeName = 'End',
  className,
}: ConnectionLineProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringSourcePin, setIsHoveringSourcePin] = useState(false);
  const [isHoveringTargetPin, setIsHoveringTargetPin] = useState(false);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [disconnectFromSource, setDisconnectFromSource] = useState(true);
  const svgRef = useRef<SVGGElement>(null);

  // Debug: Log when component mounts with onDisconnect
  console.log('🔗 ConnectionLine rendered:', {
    id,
    hasOnDisconnect: !!onDisconnect,
    hasOnReconnectStart: !!onReconnectStart,
    sourceNodeName,
    targetNodeName
  });

  // Generate path based on style - using ABSOLUTE coordinates
  const generatePath = (): string => {
    switch (style) {
      case 'curved':
        // Bezier curve (Canva/Figma style)
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        
        // Control points for smooth curve
        const cp1x = start.x + dx * 0.3;
        const cp1y = start.y;
        const cp2x = end.x - dx * 0.3;
        const cp2y = end.y;
        
        return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;

      case 'orthogonal':
        // Rechtwinklige Linie (Flowchart style)
        const midPointX = (start.x + end.x) / 2;
        return `M ${start.x} ${start.y} L ${midPointX} ${start.y} L ${midPointX} ${end.y} L ${end.x} ${end.y}`;

      case 'straight':
        // Gerade Linie
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

      default:
        return '';
    }
  };

  const path = generatePath();

  // Calculate distance from mouse to a point
  const getDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Determine which pin is closer to mouse
  const isCloserToSource = mousePos 
    ? getDistance(mousePos, start) < getDistance(mousePos, end)
    : true;

  // Calculate midpoint for gradient effect
  const midPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (!svgRef.current) return;
    
    // Get SVG coordinates from mouse event
    const svg = svgRef.current.ownerSVGElement;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    setMousePos({ x: svgP.x, y: svgP.y });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('🔗 Connection Line clicked!', {
      id,
      hasOnDisconnect: !!onDisconnect,
      hasMousePos: !!mousePos,
      sourceNodeName,
      targetNodeName
    });
    
    // If onDisconnect is available, calculate position and show disconnect confirmation
    if (onDisconnect) {
      console.log('✅ onDisconnect is available, calculating position...');
      
      // Get click position in SVG coordinates
      let clickPos = mousePos;
      
      // If mousePos is not set (no hover before click), calculate it now
      if (!clickPos && svgRef.current) {
        console.log('📍 Calculating click position from event...');
        const svg = svgRef.current.ownerSVGElement;
        if (svg) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
          clickPos = { x: svgP.x, y: svgP.y };
          console.log('📍 Click position:', clickPos);
        }
      }
      
      // Calculate which side is closer
      if (clickPos) {
        const distToSource = getDistance(clickPos, start);
        const distToTarget = getDistance(clickPos, end);
        const closerToSource = distToSource < distToTarget;
        
        console.log('📏 Distances:', { distToSource, distToTarget, closerToSource });
        console.log('🔔 Opening disconnect dialog for:', closerToSource ? sourceNodeName : targetNodeName);
        
        setDisconnectFromSource(closerToSource);
        setShowDisconnectDialog(true);
      } else {
        console.log('❌ No click position available!');
      }
    } else {
      console.log('⚠️ No onDisconnect handler, using onSelect instead');
      if (onSelect) {
        onSelect(id);
      }
    }
  };

  const handleDisconnectConfirm = () => {
    if (onDisconnect) {
      onDisconnect(id, disconnectFromSource);
    }
    setShowDisconnectDialog(false);
  };

  const handleSourcePinMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReconnectStart) {
      console.log('🔄 Starting reconnection from SOURCE pin');
      onReconnectStart(id, true); // true = dragging source
    }
  };

  const handleTargetPinMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReconnectStart) {
      console.log('🔄 Starting reconnection from TARGET pin');
      onReconnectStart(id, false); // false = dragging target
    }
  };

  // Determine base line color
  const baseLineColor = isReconnecting 
    ? '#9CA3AF' // Gray during reconnection
    : isConnectedToSelectedNode
    ? '#10B981' // Green when connected to selected node
    : (isSelected ? '#3B82F6' : color);

  // Gradient ID for this specific line
  const gradientId = `line-gradient-${id}`;

  // Create gradient based on hover and which side is closer
  const useGradient = isHovering && mousePos;
  const gradientStops = useGradient
    ? isCloserToSource
      ? [
          { offset: '0%', color: '#EF4444' },   // Red at source
          { offset: '50%', color: baseLineColor }, // Base color at middle
          { offset: '100%', color: baseLineColor }  // Base color at target
        ]
      : [
          { offset: '0%', color: baseLineColor },  // Base color at source
          { offset: '50%', color: baseLineColor }, // Base color at middle
          { offset: '100%', color: '#EF4444' }   // Red at target
        ]
    : [];

  return (
    <>
      {/* Define gradient for this line */}
      {useGradient && (
        <defs>
          <linearGradient
            id={gradientId}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            gradientUnits="userSpaceOnUse"
          >
            {gradientStops.map((stop, i) => (
              <stop
                key={i}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>
        </defs>
      )}

      <g ref={svgRef} className={className}>
        {/* Invisible wider path for easier clicking */}
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={strokeWidth + 10}
          style={{ cursor: 'pointer' }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setMousePos(null);
          }}
          onMouseMove={handleMouseMove}
        />

      {/* Visible path with gradient on hover */}
      <path
        d={path}
        fill="none"
        stroke={useGradient ? `url(#${gradientId})` : baseLineColor}
        strokeWidth={strokeWidth}
        className="transition-all duration-200"
        style={{ 
          pointerEvents: 'none',
          filter: isSelected && !isReconnecting 
            ? 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3))' 
            : isConnectedToSelectedNode && !isReconnecting
            ? 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.3))'
            : undefined,
          opacity: isReconnecting ? 0.5 : 1, // Fade during reconnection
        }}
      />

      {/* START PIN: Interactive pin point (only visible on hover or when selected) */}
      {(isHovering || isSelected) && (onReconnectStart || onDisconnect) && (
        <g>
          {/* Invisible larger circle for easier clicking */}
          <circle
            cx={start.x}
            cy={start.y}
            r={10}
            fill="transparent"
            style={{ cursor: 'grab' }}
            onMouseDown={handleSourcePinMouseDown}
            onMouseEnter={() => setIsHoveringSourcePin(true)}
            onMouseLeave={() => setIsHoveringSourcePin(false)}
          />
          {/* Visible pin - Orange if closer to disconnect, Green if reconnecting */}
          <circle
            cx={start.x}
            cy={start.y}
            r={isHoveringSourcePin ? 6 : 5}
            fill={
              isHoveringSourcePin 
                ? (onDisconnect && isCloserToSource ? '#EA580C' : '#059669') // Orange if closer to disconnect
                : (onDisconnect && isCloserToSource ? '#F97316' : '#10B981') // Orange or Green
            }
            stroke="white"
            strokeWidth={2}
            className="pointer-events-none transition-all duration-150"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
            }}
          />
        </g>
      )}

      {/* END PIN: Interactive pin point (only visible on hover or when selected) */}
      {(isHovering || isSelected) && (onReconnectStart || onDisconnect) && (
        <g>
          {/* Invisible larger circle for easier clicking */}
          <circle
            cx={end.x}
            cy={end.y}
            r={10}
            fill="transparent"
            style={{ cursor: 'grab' }}
            onMouseDown={handleTargetPinMouseDown}
            onMouseEnter={() => setIsHoveringTargetPin(true)}
            onMouseLeave={() => setIsHoveringTargetPin(false)}
          />
          {/* Visible pin - Orange if closer to disconnect, Green if reconnecting */}
          <circle
            cx={end.x}
            cy={end.y}
            r={isHoveringTargetPin ? 6 : 5}
            fill={
              isHoveringTargetPin 
                ? (onDisconnect && !isCloserToSource ? '#EA580C' : '#059669') // Orange if closer to disconnect
                : (onDisconnect && !isCloserToSource ? '#F97316' : '#10B981') // Orange or Green
            }
            stroke="white"
            strokeWidth={2}
            className="pointer-events-none transition-all duration-150"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
            }}
          />
        </g>
      )}
      </g>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verbindung lösen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Verbindung von{' '}
              <span className="font-medium text-foreground">
                {disconnectFromSource ? sourceNodeName : targetNodeName}
              </span>{' '}
              lösen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectConfirm}>
              Verbindung lösen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ⚡ PERFORMANCE: Memoize component to prevent unnecessary re-renders
// Only re-render when these specific props change
export default memo(ConnectionLine, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.start.x === nextProps.start.x &&
    prevProps.start.y === nextProps.start.y &&
    prevProps.end.x === nextProps.end.x &&
    prevProps.end.y === nextProps.end.y &&
    prevProps.style === nextProps.style &&
    prevProps.color === nextProps.color &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isReconnecting === nextProps.isReconnecting &&
    prevProps.isConnectedToSelectedNode === nextProps.isConnectedToSelectedNode
  );
});
