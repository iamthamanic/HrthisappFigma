# 🎯 PHASE 2 - PRIORITY 4: Canvas Event Throttling

**File:** Multiple canvas-related files  
**Aufwand:** 10 Stunden  
**Status:** 📋 PLANNING

---

## 📊 **CURRENT STATE ANALYSIS**

### Already Implemented ✅:
1. **Wheel Events** - Already throttled (16ms = ~60fps)
   - File: `HRTHIS_CanvasOrgChart.tsx` Line 201
   - Uses: `useThrottle(handleWheel, 16)`

### NOT Implemented ❌:
1. **MouseMove Events** (Pan during drag) - NOT throttled
   - File: `HRTHIS_CanvasOrgChart.tsx` Line 283-298
   - Issue: `handleCanvasMouseMove` fires 60+ times per second
   - Impact: Excessive state updates during panning

2. **MouseMove Events** (Connection draft) - NOT throttled  
   - File: `HRTHIS_CanvasOrgChart.tsx` Line 284-289
   - Issue: `setMousePosition` called on every mousemove
   - Impact: Excessive re-renders when dragging connections

3. **Node Drag Events** - NOT throttled
   - File: `HRTHIS_CanvasHandlers.ts` Line 32-46
   - Issue: `handleNodeDrag` fires on every mousemove
   - Impact: Excessive node position updates

4. **useRAF** - Imported but NOT used
   - File: `HRTHIS_CanvasOrgChart.tsx` Line 25
   - Potential: Can be used for smooth visual updates

---

## 🎯 **OPTIMIZATION STRATEGY**

### **Performance Goals:**
- ✅ Reduce state updates from 60+ per second to ~30 per second
- ✅ Use RAF for visual updates (smooth 60fps rendering)
- ✅ Use Throttle for state updates (reduce React renders)
- ✅ Maintain smooth UX (no perceived lag)

---

## 📋 **IMPLEMENTATION PLAN**

### **Step 1: Throttle Canvas MouseMove** (Pan)

**Problem:**
```typescript
const handleCanvasMouseMove = (e: React.MouseEvent) => {
  // Fires 60+ times per second ❌
  if (isPanning) {
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  }
}
```

**Solution:**
```typescript
// Use RAF for smooth visual updates
const handleCanvasMouseMove = useRAF((e: React.MouseEvent) => {
  if (isPanning) {
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  }
});
```

**Files to modify:**
- `/components/canvas/HRTHIS_CanvasOrgChart.tsx` (Line 283)

---

### **Step 2: Throttle Connection Draft MouseMove**

**Problem:**
```typescript
const handleCanvasMouseMove = (e: React.MouseEvent) => {
  if (connectionDraft && canvasRef.current) {
    // Fires 60+ times per second ❌
    setMousePosition({ x, y });
  }
}
```

**Solution:**
```typescript
// Use RAF for smooth connection preview
const updateMousePosition = useRAF((x: number, y: number) => {
  setMousePosition({ x, y });
});

const handleCanvasMouseMove = (e: React.MouseEvent) => {
  if (connectionDraft && canvasRef.current) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    updateMousePosition(x, y);
  }
}
```

**Files to modify:**
- `/components/canvas/HRTHIS_CanvasOrgChart.tsx` (Line 284-289)

---

### **Step 3: Throttle Node Drag Updates**

**Problem:**
```typescript
const handleNodeDrag = (nodeId: string, delta: { x: number; y: number }) => {
  // Fires 60+ times per second ❌
  const updatedNodes = nodes.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        position: {
          x: node.position.x + delta.x / zoom,
          y: node.position.y + delta.y / zoom,
        },
      };
    }
    return node;
  });
  onNodesChange(updatedNodes);
};
```

**Solution:**
```typescript
// Use RAF for smooth node dragging
const handleNodeDrag = useRAF((nodeId: string, delta: { x: number; y: number }) => {
  const updatedNodes = nodes.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        position: {
          x: node.position.x + delta.x / zoom,
          y: node.position.y + delta.y / zoom,
        },
      };
    }
    return node;
  });
  onNodesChange(updatedNodes);
});
```

**Files to modify:**
- `/components/canvas/HRTHIS_CanvasHandlers.ts` (Line 32-46)

---

### **Step 4: Add Performance Monitoring**

**Add performance metrics logging:**
```typescript
// Dev mode only - log performance metrics
if (process.env.NODE_ENV === 'development') {
  const perfMonitor = {
    wheelEvents: 0,
    mouseMoveEvents: 0,
    nodeUpdates: 0,
    lastLog: Date.now(),
  };
  
  // Log every 5 seconds
  setInterval(() => {
    if (Date.now() - perfMonitor.lastLog > 5000) {
      console.log('⚡ Canvas Performance:', perfMonitor);
      perfMonitor.wheelEvents = 0;
      perfMonitor.mouseMoveEvents = 0;
      perfMonitor.nodeUpdates = 0;
      perfMonitor.lastLog = Date.now();
    }
  }, 5000);
}
```

**Files to create:**
- `/utils/HRTHIS_canvasPerformance.ts` (NEW)

---

### **Step 5: Optimize OrgNode Component**

**Problem:**
- OrgNode re-renders on every parent update
- No memoization

**Solution:**
```typescript
export default React.memo(OrgNode, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.data.id === nextProps.data.id &&
    prevProps.data.position.x === nextProps.data.position.x &&
    prevProps.data.position.y === nextProps.data.position.y &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging
  );
});
```

**Files to modify:**
- `/components/OrgNode.tsx`

---

### **Step 6: Optimize ConnectionLine Component**

**Problem:**
- ConnectionLine re-renders on every mouse move
- No memoization

**Solution:**
```typescript
export default React.memo(ConnectionLine, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.connection.id === nextProps.connection.id &&
    prevProps.connection.sourceNodeId === nextProps.connection.sourceNodeId &&
    prevProps.connection.targetNodeId === nextProps.connection.targetNodeId &&
    prevProps.isSelected === nextProps.isSelected
  );
});
```

**Files to modify:**
- `/components/ConnectionLine.tsx`

---

## 📁 **FILES TO MODIFY**

### Existing Files:
1. `/components/canvas/HRTHIS_CanvasOrgChart.tsx` - Add RAF throttling
2. `/components/canvas/HRTHIS_CanvasHandlers.ts` - Add RAF to node drag
3. `/components/OrgNode.tsx` - Add React.memo
4. `/components/ConnectionLine.tsx` - Add React.memo

### New Files:
5. `/utils/HRTHIS_canvasPerformance.ts` - Performance monitoring (optional)

---

## ✅ **SUCCESS CRITERIA**

- [ ] Mouse move events throttled to ~30fps
- [ ] Wheel events remain at 60fps (already done)
- [ ] Node drag smooth and responsive
- [ ] Connection draft preview smooth
- [ ] Pan gesture smooth
- [ ] No perceived lag
- [ ] OrgNode memoized
- [ ] ConnectionLine memoized
- [ ] Performance metrics logged (dev mode)

---

## 📊 **EXPECTED RESULTS**

### Before:
```
Wheel Events:      60+ per second (✅ Already throttled to 60fps)
MouseMove Events:  60+ per second (❌ NOT throttled)
Node Drag Updates: 60+ per second (❌ NOT throttled)
State Updates:     180+ per second (❌ Too many)
Re-renders:        180+ per second (❌ Too many)
```

### After:
```
Wheel Events:      ~60 per second (✅ Throttled, 16ms)
MouseMove Events:  ~60 per second (✅ RAF throttled)
Node Drag Updates: ~60 per second (✅ RAF throttled)
State Updates:     ~60 per second (✅ Reduced by 66%)
Re-renders:        ~30 per second (✅ Memoization)
```

**Performance Gain:**
- **State Updates:** -66% (180 → 60 per second)
- **Re-renders:** -83% (180 → 30 per second)
- **Perceived Smoothness:** No change (60fps maintained)

---

## 🚀 **IMPLEMENTATION ORDER**

1. ✅ Step 1: Throttle Canvas MouseMove (Pan) - 1h
2. ✅ Step 2: Throttle Connection Draft - 1h
3. ✅ Step 3: Throttle Node Drag - 1h
4. ✅ Step 4: Add Performance Monitoring - 1h
5. ✅ Step 5: Memoize OrgNode - 0.5h
6. ✅ Step 6: Memoize ConnectionLine - 0.5h
7. ✅ Testing & Verification - 3h
8. ✅ Documentation Update - 2h

**Total:** 10 hours

---

## 💡 **TECHNICAL NOTES**

### **useRAF vs useThrottle:**

**useRAF (requestAnimationFrame):**
- ✅ Perfect for visual updates (smooth 60fps)
- ✅ Syncs with browser paint cycle
- ✅ Use for: Pan, Drag, Connection preview
- ❌ NOT good for: Debouncing, Rate limiting

**useThrottle:**
- ✅ Perfect for rate limiting
- ✅ Configurable delay
- ✅ Use for: Wheel events, Resize events
- ❌ NOT synced with paint cycle

**React.memo:**
- ✅ Prevents unnecessary re-renders
- ✅ Shallow prop comparison
- ✅ Use for: Components that re-render often
- ⚠️ Custom comparison function needed for deep props

---

## 📝 **TESTING CHECKLIST**

### Manual Testing:
- [ ] Pan canvas smoothly (no lag)
- [ ] Zoom with wheel (smooth)
- [ ] Zoom with trackpad pinch (smooth)
- [ ] Drag nodes (smooth, no jitter)
- [ ] Create connections (smooth preview)
- [ ] Drag connection line (smooth)
- [ ] Multiple nodes dragging performance
- [ ] Large org chart (50+ nodes) performance

### Performance Testing:
- [ ] Open DevTools Performance tab
- [ ] Record 10 seconds of panning
- [ ] Check FPS (should be 60fps)
- [ ] Check state updates (should be ~60/sec)
- [ ] Check re-renders (should be ~30/sec)

---

**Created:** 2025-01-10  
**Phase:** Phase 2 - Priority 4  
**Status:** Planning Complete ✅  
**Ready to start:** YES
