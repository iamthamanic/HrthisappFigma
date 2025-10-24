# 🎯 PHASE 5 PRIORITY 2 - BUNDLE OPTIMIZATION - DETAILED PLAN

**Priority:** 2 - Bundle Optimization & Code Splitting  
**Status:** 🔵 Ready to Start  
**Time:** 10 hours  
**Phase:** Phase 5 - Performance & Monitoring  
**Date:** 2025-01-10

---

## 📊 **EXECUTIVE SUMMARY**

**Goal:** Reduce bundle size from ~850 KB to <512 KB (-40%)

**Current State Analysis:**
- ✅ **Good:** All screens are already lazy-loaded in App.tsx
- ✅ **Good:** Suspense boundaries in place
- ❌ **Problem 1:** Lucide Icons - Using versioned imports, might load all icons
- ❌ **Problem 2:** Heavy components not lazy-loaded (Recharts, etc.)
- ❌ **Problem 3:** Vite config not optimized for chunking

**Expected Savings:**
- Lucide optimization: ~100-150 KB
- Heavy components lazy loading: ~200 KB from initial bundle
- Vite config optimization: Better caching, ~20% faster loads

---

## 🎯 **PRIORITIES**

| Task | Time | Savings | Complexity |
|------|------|---------|------------|
| **2.1** Lucide Icons Analysis | 2h | ~150 KB | 🟢 Low |
| **2.2** Heavy Components Lazy Loading | 3h | ~200 KB | 🟡 Medium |
| **2.3** Vite Config Optimization | 3h | Better caching | 🟡 Medium |
| **2.4** Bundle Analysis & Verification | 2h | Validation | 🟢 Low |
| **Total** | **10h** | **~350 KB** | 🟡 **Medium** |

---

## 🔍 **2.1: LUCIDE ICONS ANALYSIS & OPTIMIZATION**

**Time:** 2 hours  
**Expected Savings:** ~100-150 KB

### **Current State:**

**Found 30+ files using lucide-react!**

**Two patterns detected:**

1. **ShadCN Components (16 files):**
   - Using versioned imports: `lucide-react@0.487.0`
   - Examples: `/components/ui/dialog.tsx`, `/components/ui/button.tsx`, etc.
   - Import style: `import { XIcon } from "lucide-react@0.487.0";`

2. **Custom Components (14+ files):**
   - Using unversioned imports: `lucide-react`
   - Examples: `/components/Login.tsx`, `/components/NotificationCenter.tsx`, etc.
   - Import style: `import { Bell, Check } from 'lucide-react';`

**Problem:**
- **Versioned imports** (`lucide-react@0.487.0`) might bundle ALL icons
- **Tree-shaking might not work** with versioned imports
- Estimated: ~200 KB of unused icons in bundle

### **Solution Strategy:**

#### **Option A: Keep Current Imports (Recommended for ShadCN)**

**Keep versioned imports for ShadCN UI components** because:
- ✅ ShadCN expects specific icon versions
- ✅ Only ~20 icons total in UI components
- ✅ Tree-shaking should work with modern bundlers
- ✅ No migration needed

**Only optimize custom components:**
- Create icon wrapper for app-specific icons
- Lazy load icon groups by feature

#### **Option B: Icon Wrapper System**

Create centralized icon system with guaranteed tree-shaking.

**File:** `/components/icons/HRTHISIcons.tsx`

```typescript
/**
 * Centralized Icon System - HRthis
 * 
 * Only imported icons are included in bundle.
 * Tree-shaking guaranteed.
 */

// Import ONLY needed icons
import {
  // Auth & User
  User,
  UserPlus,
  ArrowLeft,
  Key,
  Mail,
  
  // Notifications
  Bell,
  Check,
  CheckCheck,
  CheckCircle,
  Circle,
  Trash2,
  X,
  
  // Navigation
  Home,
  Settings,
  Calendar,
  Clock,
  Book,
  Award,
  FileText,
  Users,
  BarChart,
  LogOut,
  
  // Actions
  Play,
  Pause,
  Save,
  Camera,
  Copy,
  ExternalLink,
  
  // UI
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter,
  
  // Status
  Lock,
  Star,
  Trophy,
  Coffee,
  
  // Media
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  
  // Lists
  ClipboardList,
  Timer,
} from 'lucide-react';

// Export as object for easy mapping
export const icons = {
  // Auth & User
  user: User,
  userPlus: UserPlus,
  arrowLeft: ArrowLeft,
  key: Key,
  mail: Mail,
  
  // Notifications
  bell: Bell,
  check: Check,
  checkCheck: CheckCheck,
  checkCircle: CheckCircle,
  circle: Circle,
  trash: Trash2,
  x: X,
  
  // Navigation
  home: Home,
  settings: Settings,
  calendar: Calendar,
  clock: Clock,
  book: Book,
  award: Award,
  fileText: FileText,
  users: Users,
  barChart: BarChart,
  logOut: LogOut,
  
  // Actions
  play: Play,
  pause: Pause,
  save: Save,
  camera: Camera,
  copy: Copy,
  externalLink: ExternalLink,
  
  // UI
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  moreHorizontal: MoreHorizontal,
  search: Search,
  filter: Filter,
  
  // Status
  lock: Lock,
  star: Star,
  trophy: Trophy,
  coffee: Coffee,
  
  // Media
  volume: Volume2,
  volumeOff: VolumeX,
  maximize: Maximize,
  rotate: RotateCcw,
  
  // Lists
  clipboard: ClipboardList,
  timer: Timer,
} as const;

export type IconName = keyof typeof icons;

// Icon component with consistent API
interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, className, strokeWidth = 2 }: IconProps) {
  const IconComponent = icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent 
      size={size} 
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}

// Direct exports for convenience
export {
  User,
  UserPlus,
  Bell,
  Check,
  // ... etc (for components that want direct imports)
};
```

**Migration Example:**

```typescript
// ❌ BEFORE (Login.tsx)
import { UserPlus } from 'lucide-react';

function Login() {
  return <UserPlus size={20} />;
}

// ✅ AFTER (Option 1 - Direct)
import { UserPlus } from '../components/icons/HRTHISIcons';

function Login() {
  return <UserPlus size={20} />;
}

// ✅ AFTER (Option 2 - Icon component)
import { Icon } from '../components/icons/HRTHISIcons';

function Login() {
  return <Icon name="userPlus" size={20} />;
}
```

### **Recommendation:**

**Hybrid Approach:**

1. ✅ **Keep ShadCN versioned imports** (`lucide-react@0.487.0`)
   - No migration needed
   - Only ~20 icons
   - Tree-shaking works

2. ✅ **Migrate custom components** to centralized icon system
   - 14 files to migrate
   - Guaranteed tree-shaking
   - ~100 KB savings

3. ✅ **Verify in bundle analyzer**
   - Check if lucide is still too large
   - Only proceed if >150 KB

### **Action Items:**

**Today:**
- [ ] Run bundle analyzer to check current lucide size
- [ ] If >150 KB, create `/components/icons/HRTHISIcons.tsx`
- [ ] Migrate 14 custom components
- [ ] Re-measure bundle

**Files to Migrate:**
```
/components/PersonalSettings.tsx
/components/Login.tsx
/components/Register.tsx
/components/ForgotPassword.tsx
/components/ResetPassword.tsx
/components/NotificationCenter.tsx
/components/SetupChecklist.tsx
/components/BreakManager.tsx
/components/VideoPlayer.tsx
/components/QuizPlayer.tsx
/components/AchievementBadge.tsx
/components/AvatarDisplay.tsx
+ other components in /components/, /layouts/, /screens/
```

**Keep as-is:**
```
/components/ui/* (all ShadCN components)
```

---

## 📦 **2.2: HEAVY COMPONENTS LAZY LOADING**

**Time:** 3 hours  
**Expected Savings:** ~200 KB from initial bundle

### **Current State:**

**Already Lazy-Loaded (Good!):**
- ✅ All screens in App.tsx
- ✅ OrganigramCanvasScreen

**NOT Lazy-Loaded (Problem!):**

1. **Recharts** (Dashboard charts)
   - Size: ~150 KB
   - Used in: `/screens/DashboardScreen.tsx`
   - Problem: Loaded on initial app load

2. **YouTube Player**
   - Component: `/components/YouTubeVideoPlayer.tsx`
   - Used in: `/screens/VideoDetailScreen.tsx`
   - Already lazy? Need to check

3. **Quiz Player**
   - Component: `/components/QuizPlayer.tsx`
   - Used in: `/screens/QuizDetailScreen.tsx`
   - Already lazy? Need to check

4. **Image Crop Dialog**
   - Component: `/components/ImageCropDialog.tsx`
   - Library: `react-image-crop` or similar
   - Size: ~40-50 KB

5. **Canvas Components** (Organigram)
   - Already lazy via Screen lazy loading ✅

### **Strategy:**

#### **2.2.1: Lazy Load Recharts**

**Problem:** Dashboard loads immediately, Recharts included

**Solution:** Lazy load chart components within Dashboard

**File:** `/components/charts/LazyCharts.tsx` (new)

```typescript
/**
 * Lazy-Loaded Chart Components
 * 
 * Recharts is ~150 KB - only load when charts are visible
 */

import { lazy, Suspense, ComponentType } from 'react';
import type { LineChartProps, BarChartProps, PieChartProps } from 'recharts';

// Lazy load Recharts components
const RechartsLineChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.LineChart }))
);

const RechartsBarChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.BarChart }))
);

const RechartsPieChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.PieChart }))
);

const RechartsLine = lazy(() =>
  import('recharts').then(mod => ({ default: mod.Line }))
);

const RechartsBar = lazy(() =>
  import('recharts').then(mod => ({ default: mod.Bar }))
);

const RechartsPie = lazy(() =>
  import('recharts').then(mod => ({ default: mod.Pie }))
);

const RechartsXAxis = lazy(() =>
  import('recharts').then(mod => ({ default: mod.XAxis }))
);

const RechartsYAxis = lazy(() =>
  import('recharts').then(mod => ({ default: mod.YAxis }))
);

const RechartsCartesianGrid = lazy(() =>
  import('recharts').then(mod => ({ default: mod.CartesianGrid }))
);

const RechartsTooltip = lazy(() =>
  import('recharts').then(mod => ({ default: mod.Tooltip }))
);

const RechartsLegend = lazy(() =>
  import('recharts').then(mod => ({ default: mod.Legend }))
);

const RechartsResponsiveContainer = lazy(() =>
  import('recharts').then(mod => ({ default: mod.ResponsiveContainer }))
);

// Loading fallback
function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading chart...</div>
    </div>
  );
}

// Wrapped components with Suspense
export function LineChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RechartsLineChart {...props} />
    </Suspense>
  );
}

export function BarChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RechartsBarChart {...props} />
    </Suspense>
  );
}

export function PieChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RechartsPieChart {...props} />
    </Suspense>
  );
}

export function Line(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsLine {...props} />
    </Suspense>
  );
}

export function Bar(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsBar {...props} />
    </Suspense>
  );
}

export function Pie(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsPie {...props} />
    </Suspense>
  );
}

export function XAxis(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsXAxis {...props} />
    </Suspense>
  );
}

export function YAxis(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsYAxis {...props} />
    </Suspense>
  );
}

export function CartesianGrid(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsCartesianGrid {...props} />
    </Suspense>
  );
}

export function Tooltip(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsTooltip {...props} />
    </Suspense>
  );
}

export function Legend(props: any) {
  return (
    <Suspense fallback={null}>
      <RechartsLegend {...props} />
    </Suspense>
  );
}

export function ResponsiveContainer(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RechartsResponsiveContainer {...props} />
    </Suspense>
  );
}
```

**Usage in DashboardScreen:**

```typescript
// ❌ BEFORE
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ✅ AFTER
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '../components/charts/LazyCharts';
```

**Savings:** ~150 KB from initial bundle (only loaded when Dashboard visited)

#### **2.2.2: Lazy Load Heavy Dialogs**

**Components to wrap:**

1. **ImageCropDialog**
2. **CreateVideoDialog** (if it has heavy deps)
3. **Any dialog with form libraries**

**Pattern:**

```typescript
// In parent component
const ImageCropDialog = lazy(() => import('./components/ImageCropDialog'));

function Component() {
  const [showCrop, setShowCrop] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowCrop(true)}>Crop Image</Button>
      
      {showCrop && (
        <Suspense fallback={<DialogSkeleton />}>
          <ImageCropDialog open={showCrop} onClose={() => setShowCrop(false)} />
        </Suspense>
      )}
    </>
  );
}
```

#### **2.2.3: Check Existing Lazy Loading**

**Files to verify:**

```bash
# Check if these are already lazy
- /components/YouTubeVideoPlayer.tsx
- /components/QuizPlayer.tsx
- /components/VideoPlayer.tsx
```

**If NOT lazy, wrap them:**

```typescript
// In VideoDetailScreen.tsx
const YouTubeVideoPlayer = lazy(() => import('../components/YouTubeVideoPlayer'));

// In QuizDetailScreen.tsx
const QuizPlayer = lazy(() => import('../components/QuizPlayer'));
```

### **Action Items:**

**Today:**
- [ ] Create `/components/charts/LazyCharts.tsx`
- [ ] Find all Recharts imports in DashboardScreen
- [ ] Replace with lazy imports
- [ ] Test Dashboard still works
- [ ] Verify bundle size reduction

**This Week:**
- [ ] Lazy load ImageCropDialog
- [ ] Verify YouTubeVideoPlayer lazy loading
- [ ] Verify QuizPlayer lazy loading
- [ ] Re-measure bundle

---

## ⚙️ **2.3: VITE CONFIG OPTIMIZATION**

**Time:** 3 hours  
**Expected Impact:** Better caching, faster subsequent loads

### **Current Config:**

Need to check `/vite.config.ts`

### **Optimizations to Add:**

**File:** `/vite.config.ts` (update)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    
    // Bundle visualizer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ].filter(Boolean),
  
  build: {
    // Chunk size warning threshold
    chunkSizeWarningLimit: 500, // 500 KB
    
    // Rollup options
    rollupOptions: {
      output: {
        // ============================================
        // MANUAL CHUNKS - Better code splitting
        // ============================================
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React vendor chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            
            // Supabase vendor chunk
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            
            // UI library vendor chunk
            if (id.includes('zustand') || id.includes('sonner') || id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            
            // Form & validation vendor chunk
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'vendor-form';
            }
            
            // Recharts - separate chunk (heavy!)
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            
            // Lucide icons - separate chunk
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            // Date libraries
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            
            // Canvas/diagram libraries
            if (id.includes('react-image-crop')) {
              return 'vendor-editor';
            }
            
            // Other node_modules -> vendor-misc
            return 'vendor-misc';
          }
          
          // App chunks by feature
          // Admin screens
          if (id.includes('/screens/admin/')) {
            return 'app-admin';
          }
          
          // Learning screens
          if (id.includes('/screens/Learning') || id.includes('/screens/Video') || id.includes('/screens/Quiz')) {
            return 'app-learning';
          }
          
          // Time & Leave
          if (id.includes('/screens/TimeAndLeave') || id.includes('/screens/Calendar')) {
            return 'app-time';
          }
          
          // Documents
          if (id.includes('/screens/Documents')) {
            return 'app-documents';
          }
          
          // Settings
          if (id.includes('/screens/Settings')) {
            return 'app-settings';
          }
        },
        
        // ============================================
        // ASSET FILE NAMES - Better caching
        // ============================================
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          // Images
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          
          // Fonts
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          // Other assets
          return 'assets/[name]-[hash][extname]';
        },
        
        // ============================================
        // CHUNK FILE NAMES
        // ============================================
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // ============================================
    // MINIFICATION
    // ============================================
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // Remove console.logs in production
        drop_debugger: true,   // Remove debugger statements
        pure_funcs: ['console.log', 'console.info'], // Remove specific functions
      },
      mangle: {
        safari10: true, // Fix Safari 10 bugs
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    
    // ============================================
    // SOURCE MAPS
    // ============================================
    sourcemap: false, // Production: false, Staging: 'hidden'
    
    // ============================================
    // CSS CODE SPLITTING
    // ============================================
    cssCodeSplit: true,
  },
  
  // ============================================
  // OPTIMIZATION - Dependency Pre-bundling
  // ============================================
  optimizeDeps: {
    include: [
      // Pre-bundle these (faster dev)
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand',
    ],
    exclude: [
      // Don't pre-bundle these (lazy load)
      'recharts',
      'react-image-crop',
    ],
  },
  
  // ============================================
  // SERVER - Dev server config
  // ============================================
  server: {
    open: true,
    port: 5173,
  },
});
```

### **Expected Bundle Structure:**

After optimization:

```
dist/
├── assets/
│   ├── js/
│   │   ├── main-[hash].js              ~100 KB  (App code)
│   │   ├── vendor-react-[hash].js      ~140 KB  (React ecosystem)
│   │   ├── vendor-supabase-[hash].js    ~80 KB  (Supabase client)
│   │   ├── vendor-ui-[hash].js          ~60 KB  (UI libs)
│   │   ├── vendor-form-[hash].js        ~70 KB  (Forms/validation)
│   │   ├── vendor-icons-[hash].js       ~50 KB  (Lucide icons - optimized!)
│   │   ├── vendor-date-[hash].js        ~30 KB  (Date utilities)
│   │   ├── vendor-recharts-[hash].js   ~150 KB  (Charts - lazy!)
│   │   ├── vendor-editor-[hash].js      ~40 KB  (Image editor - lazy!)
│   │   ├── vendor-misc-[hash].js        ~40 KB  (Other deps)
│   │   ├── app-admin-[hash].js         ~100 KB  (Admin screens - lazy!)
│   │   ├── app-learning-[hash].js       ~80 KB  (Learning - lazy!)
│   │   ├── app-time-[hash].js           ~60 KB  (Time & Leave - lazy!)
│   │   ├── app-documents-[hash].js      ~40 KB  (Documents - lazy!)
│   │   └── app-settings-[hash].js       ~30 KB  (Settings - lazy!)
│   ├── css/
│   │   └── main-[hash].css              ~80 KB
│   └── images/
│       └── ...
└── index.html

Initial Load (critical path):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
main.js:              100 KB
vendor-react.js:      140 KB
vendor-supabase.js:    80 KB
vendor-ui.js:          60 KB
vendor-form.js:        70 KB
vendor-icons.js:       50 KB  (optimized!)
main.css:              80 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                580 KB  ⚠️ (Still over 512 KB target!)

After Icon Optimization:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vendor-icons.js:       30 KB  (-20 KB)
vendor-recharts.js:     0 KB  (lazy loaded!)
vendor-editor.js:       0 KB  (lazy loaded!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                490 KB  ✅ (Under 512 KB target!)
```

### **Action Items:**

**Today:**
- [ ] Check current `/vite.config.ts`
- [ ] Add manual chunking
- [ ] Add terser minification
- [ ] Add file naming strategy
- [ ] Test build

**This Week:**
- [ ] Fine-tune chunk sizes
- [ ] Verify caching works
- [ ] Test production build

---

## 📊 **2.4: BUNDLE ANALYSIS & VERIFICATION**

**Time:** 2 hours  
**Goal:** Measure improvements, identify remaining issues

### **Tools:**

**1. Vite Bundle Visualizer**

```bash
# Install
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts (already in example above)

# Build with analysis
ANALYZE=true npm run build

# Opens visual bundle map in browser
```

**2. Bundle Size Check**

```bash
# Build
npm run build

# Check budgets
node scripts/HRTHIS_performanceBudgetCheck.js
```

**3. Lighthouse**

```bash
# After optimizations
npm run build
npm run preview

# In another terminal
npx lighthouse http://localhost:4173 --view
```

### **Metrics to Track:**

**Before Optimization:**
```
Bundle Size:       ~850 KB  ❌
Lighthouse:        ~68      ❌
LCP:               ~3.2s    ❌

Top Dependencies:
1. lucide-react:   ~200 KB  ❌
2. recharts:       ~150 KB  ❌
3. react-dom:      ~130 KB  ✅
4. @supabase:       ~80 KB  ✅
```

**After Optimization (Target):**
```
Bundle Size:       ~490 KB  ✅
Lighthouse:        ~80      ⚠️
LCP:               ~2.5s    ✅

Top Dependencies:
1. react-dom:      ~130 KB  ✅
2. @supabase:       ~80 KB  ✅
3. recharts:         0 KB  ✅ (lazy)
4. lucide-react:    ~30 KB  ✅ (optimized)
```

### **Verification Checklist:**

**Bundle Size:**
- [ ] Main bundle < 512 KB
- [ ] Vendor-react < 150 KB
- [ ] Vendor-icons < 50 KB (lucide optimized)
- [ ] Recharts not in initial bundle
- [ ] Total initial load < 512 KB

**Functionality:**
- [ ] All screens load correctly
- [ ] Charts render properly (lazy)
- [ ] Icons display correctly
- [ ] No console errors
- [ ] Suspense boundaries work

**Performance:**
- [ ] Lighthouse score improved
- [ ] LCP improved
- [ ] No performance regressions

---

## 📋 **PRIORITY 2 COMPLETE CHECKLIST**

### **2.1: Lucide Icons** ✅
- [ ] Run bundle analyzer
- [ ] Check lucide size in bundle
- [ ] Create `/components/icons/HRTHISIcons.tsx` (if needed)
- [ ] Migrate custom components
- [ ] Verify tree-shaking works
- [ ] Measure savings

### **2.2: Heavy Components** ✅
- [ ] Create `/components/charts/LazyCharts.tsx`
- [ ] Replace Recharts imports in Dashboard
- [ ] Test charts still work
- [ ] Lazy load ImageCropDialog
- [ ] Verify YouTubeVideoPlayer lazy
- [ ] Verify QuizPlayer lazy
- [ ] Measure savings

### **2.3: Vite Config** ✅
- [ ] Update `/vite.config.ts`
- [ ] Add manual chunking
- [ ] Add terser minification
- [ ] Test production build
- [ ] Verify chunk sizes

### **2.4: Verification** ✅
- [ ] Build & analyze bundle
- [ ] Run budget check
- [ ] Run Lighthouse audit
- [ ] Verify all features work
- [ ] Document savings

---

## 🎯 **SUCCESS CRITERIA**

### **Must Have:**
- ✅ Bundle size < 512 KB
- ✅ No functionality broken
- ✅ All lazy loading works
- ✅ Budget check passes

### **Nice to Have:**
- ⭐ Bundle size < 450 KB
- ⭐ Lighthouse score > 80
- ⭐ LCP < 2.5s
- ⭐ All chunks < 200 KB

---

## 📊 **EXPECTED RESULTS**

### **Bundle Size Reduction:**

```
Component Breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before:
Main bundle:       850 KB  ❌

After:
Main bundle:       490 KB  ✅ (-360 KB, -42%)

Savings:
- Icon optimization:  -150 KB
- Recharts lazy:      -150 KB
- Other optimizations: -60 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Savings:        -360 KB  (-42%)
```

### **Performance Impact:**

```
Lighthouse Score:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before:        68      ❌
After:         82      ⚠️ (+14 points)
Target:        90      🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LCP:
Before:        3.2s    ❌
After:         2.5s    ✅ (-0.7s, -22%)
Target:        <2.5s   🎯
```

---

## 🚀 **NEXT STEPS**

### **After Priority 2 Complete:**

**Immediate:**
1. Update Performance Dashboard with new metrics
2. Document savings achieved
3. Commit changes

**Next Priority:**
4. Priority 3: Component Performance Optimization (8h)
5. React.memo(), useMemo(), useCallback()
6. Further re-render reduction

---

## 📚 **FILES TO CREATE**

**New Files:**
1. `/components/icons/HRTHISIcons.tsx` - Centralized icon system
2. `/components/charts/LazyCharts.tsx` - Lazy-loaded Recharts

**Files to Update:**
1. `/vite.config.ts` - Optimization config
2. `/screens/DashboardScreen.tsx` - Use lazy charts
3. ~14 component files - Use centralized icons

---

**Created:** 2025-01-10  
**Status:** 🔵 Ready to Start  
**Estimated Time:** 10 hours  
**Expected Savings:** ~360 KB (-42%)  
**Phase:** Phase 5 - Performance & Monitoring  
**Priority:** 2 - Bundle Optimization & Code Splitting
