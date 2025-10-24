/**
 * DEBUG VERSION CHECKER
 * Shows current app version and forces cache refresh
 * ✨ DRAGGABLE - Position wird im localStorage gespeichert
 */

import { useState, useRef, useEffect } from 'react';

export default function DebugVersionChecker() {
  const VERSION = '3.5.0-ANNOUNCEMENTS';
  const TIMESTAMP = new Date().toISOString();
  
  // Load saved position from localStorage or use default
  const getInitialPosition = () => {
    const saved = localStorage.getItem('hrthis-debug-position');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { x: window.innerWidth - 220, y: window.innerHeight - 180 };
      }
    }
    // Default: bottom-right corner
    return { x: window.innerWidth - 220, y: window.innerHeight - 180 };
  };

  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hrthis-debug-position', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicking the button
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    setIsDragging(true);
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep element within viewport bounds
    const maxX = window.innerWidth - (elementRef.current?.offsetWidth || 200);
    const maxY = window.innerHeight - (elementRef.current?.offsetHeight || 160);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      className={`bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] text-xs font-mono transition-shadow ${
        isDragging ? 'shadow-2xl' : ''
      }`}
    >
      <div className="font-bold">🎯 HRthis Version</div>
      <div className="text-green-100">✅ v{VERSION}</div>
      <div className="text-green-200 text-[10px]">Loaded: {TIMESTAMP.split('T')[1].split('.')[0]}</div>
      <div className="mt-1 text-[10px] bg-green-700 px-2 py-1 rounded">
        ✅ Infinite loop fixed
      </div>
      <button 
        onClick={() => {
          console.log('🔄 Force reload triggered...');
          window.location.reload();
        }}
        className="mt-2 w-full bg-white text-green-600 px-2 py-1 rounded text-xs hover:bg-green-50 transition-colors"
      >
        🔄 Force Reload
      </button>
    </div>
  );
}
