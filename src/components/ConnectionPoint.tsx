import { useState } from 'react';
import { cn } from './ui/utils';

/**
 * CONNECTION POINT COMPONENT
 * ============================
 * Pin Point für Canva-Style Connections
 * 
 * Features:
 * - 4 Positionen: top, right, bottom, left
 * - Nur sichtbar bei Node-Hover
 * - States: unconnected (grau) → connected (grün)
 * - Drag & Drop: Source & Target
 * - Multi-Connection: Ein Pin kann mehrere Connections haben
 * - Delete: Nur über Connection Line (nicht über Pin Click)
 */

export type PinPosition = 'top' | 'right' | 'bottom' | 'left';

interface ConnectionPointProps {
  nodeId: string;
  position: PinPosition;
  isConnected: boolean; // Has any connections
  isSelected?: boolean; // 🎯 Is this node the currently selected node?
  isConnectedToSelected?: boolean; // 🎯 Is THIS SPECIFIC PIN connected to the selected node?
  isVisible: boolean; // Only show on node hover
  onConnectionStart: (nodeId: string, position: PinPosition) => void;
  onConnectionEnd: (nodeId: string, position: PinPosition) => void;
  onDisconnect?: (nodeId: string, position: PinPosition) => void;
  className?: string;
}

export default function ConnectionPoint({
  nodeId,
  position,
  isConnected,
  isSelected = false,
  isConnectedToSelected = false,
  isVisible,
  onConnectionStart,
  onConnectionEnd,
  onDisconnect,
  className,
}: ConnectionPointProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Position styles for each pin point
  const positionStyles: Record<PinPosition, string> = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
    right: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
    left: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('📍 Pin MouseDown:', nodeId, position);
    setIsDragging(true);
    onConnectionStart(nodeId, position);
    
    // Add global mouse up listener to handle drag end anywhere
    const handleGlobalMouseUp = () => {
      console.log('📍 Global MouseUp - clearing drag state');
      setIsDragging(false);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHovering(true);
    console.log('📍 Pin MouseEnter:', nodeId, position);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('📍 Pin MouseUp:', nodeId, position);
    
    // When mouse up happens on THIS pin, it means:
    // - Either we're completing a connection here (as target)
    // - Or we're ending a drag that started elsewhere
    onConnectionEnd(nodeId, position);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Multi-connection: Do not disconnect on click
    // Users should delete individual connections by clicking the connection line
    // This allows one pin to have multiple connections
  };

  return (
    <div
      className={cn(
        'absolute z-50 transition-all duration-200',
        // Add padding for larger hit area
        'p-2',
        positionStyles[position],
        // Visibility
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        setIsHovering(false);
        console.log('📍 Pin MouseLeave:', nodeId, position);
      }}
      onClick={handleClick}
    >
      {/* Outer ring (hover effect) */}
      <div
        className={cn(
          'absolute inset-2 rounded-full transition-all duration-200',
          isHovering && 'ring-2 ring-blue-400 ring-offset-1'
        )}
      />

      {/* Pin point circle */}
      <div
        className={cn(
          'w-4 h-4 rounded-full border-2 transition-all duration-200',
          // States
          isDragging && 'scale-150 ring-4 ring-blue-400',
          isHovering && !isDragging && 'scale-125',
          // 🎯 COLOR LOGIC (Priority order):
          // 1. Dragging → BLUE
          // 2. Hover → WHITE
          // 3. GREEN wenn:
          //    - Node ist selektiert UND dieser Pin hat Verbindungen ODER
          //    - Dieser spezifische Pin ist mit der selektierten Node verbunden
          // 4. Default → BLACK
          isDragging 
            ? 'bg-blue-500 border-blue-700 shadow-lg shadow-blue-500/50'
            : isHovering
            ? 'bg-white border-gray-400 shadow-md'
            : (isSelected && isConnected) || isConnectedToSelected
            ? 'bg-green-500 border-green-700 shadow-lg shadow-green-500/50'
            : 'bg-black border-gray-800'
        )}
      />
    </div>
  );
}
