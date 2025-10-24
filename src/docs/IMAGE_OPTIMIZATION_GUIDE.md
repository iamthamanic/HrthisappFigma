# 📸 IMAGE OPTIMIZATION GUIDE - HRthis System

**Created:** 2025-01-10  
**Phase:** Phase 5 - Performance & Monitoring  
**Priority:** 4 - Asset Optimization

---

## 🎯 **OVERVIEW**

This guide provides best practices for image optimization in the HRthis system to ensure optimal performance and user experience.

---

## 📋 **BEST PRACTICES**

### **1. Always Use ImageWithFallback Component**

For all external images, use the `ImageWithFallback` component:

```typescript
import { ImageWithFallback } from './components/figma/ImageWithFallback';

<ImageWithFallback
  src={imageUrl}
  alt="Descriptive alt text"
  className="w-full h-full object-cover"
/>
```

**Benefits:**
- ✅ Automatic lazy loading (`loading="lazy"`)
- ✅ Async decoding (`decoding="async"`)
- ✅ Graceful error handling
- ✅ Fallback placeholder on error
- ✅ Better performance

---

### **2. Optimize Image Sizes**

**Recommended maximum dimensions:**

| Use Case | Max Dimensions | Max File Size | Format |
|----------|---------------|---------------|--------|
| **Profile Pictures** | 500×500px | 100 KB | JPEG 85% |
| **Thumbnails** | 150×150px | 20 KB | JPEG 80% |
| **Card Images** | 400×300px | 80 KB | JPEG 80% |
| **Full-width Images** | 1200×800px | 200 KB | JPEG 85% |
| **Background Images** | 1920×1080px | 300 KB | JPEG 85% |
| **Icons/Graphics** | 256×256px | 50 KB | PNG/SVG |

**Why these sizes?**
- Smaller file sizes = faster loading
- Retina displays need max 2x resolution
- Most screens are < 1920px wide

---

### **3. Choose Correct Image Formats**

#### **JPEG (.jpg, .jpeg)**
- **Best for:** Photos, complex images with gradients
- **Quality:** 80-85% (sweet spot for quality vs size)
- **Compression:** Lossy
- **Example:** Profile pictures, backgrounds

```typescript
// ✅ Good - Optimized JPEG
<ImageWithFallback 
  src="profile-photo-500x500-q85.jpg" 
  alt="User profile" 
/>
```

#### **PNG (.png)**
- **Best for:** Graphics with transparency, screenshots
- **Quality:** Lossless
- **Compression:** Better than JPEG for flat colors
- **Example:** Logos with transparency, UI elements

```typescript
// ✅ Good - PNG for transparency
<ImageWithFallback 
  src="logo-transparent.png" 
  alt="Company logo" 
/>
```

#### **SVG (.svg)**
- **Best for:** Icons, logos, vector graphics
- **Quality:** Infinite (vector-based)
- **Size:** Tiny (often < 5 KB)
- **Example:** Icons, simple graphics

```typescript
// ✅ Best - SVG for icons (imported from HRTHISIcons)
import { User } from './components/icons/HRTHISIcons';

<User className="w-6 h-6" />
```

#### **WebP (.webp)** (Future consideration)
- **Best for:** All types (modern browsers)
- **Quality:** Better compression than JPEG/PNG
- **Support:** 95%+ browsers
- **Note:** Not yet implemented in HRthis

---

### **4. Lazy Loading Strategy**

**Automatic with ImageWithFallback:**

The component automatically adds `loading="lazy"` which:
- Defers loading until image is near viewport
- Reduces initial page load
- Saves bandwidth

```typescript
// ✅ Already optimized - no extra code needed
<ImageWithFallback src={url} alt="Description" />

// ❌ Don't use regular <img> tags for external images
<img src={url} alt="Description" /> // Missing lazy loading!
```

**Manual lazy loading (if needed):**

```typescript
<img 
  src={url} 
  alt="Description"
  loading="lazy"      // Lazy load
  decoding="async"    // Async decode
/>
```

---

### **5. Responsive Images**

For different screen sizes, use `srcset`:

```typescript
<ImageWithFallback
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, 
         (max-width: 900px) 800px, 
         1200px"
  alt="Responsive image"
/>
```

**Breakdown:**
- `srcset`: Available image sizes
- `sizes`: Which size to use based on viewport
- Browser chooses best image automatically

---

### **6. Profile Picture Guidelines**

**Upload requirements:**
- **Max size:** 5 MB
- **Recommended:** 500×500px, JPEG 85%
- **Processing:** Auto-cropped to square in `AvatarEditor`

**Storage:**
- Stored in Supabase Storage
- Served with signed URLs
- Cached by browser (30 days)

**Example:**

```typescript
// Profile picture upload in AvatarEditor
const optimizedImage = await compressImage(file, {
  maxWidth: 500,
  maxHeight: 500,
  quality: 0.85,
  mimeType: 'image/jpeg',
});
```

---

### **7. Unsplash Integration**

When using Unsplash images, **always** append size parameters:

```typescript
// ❌ BAD - Full size image (may be 5+ MB)
const badUrl = unsplashUrl;

// ✅ GOOD - Optimized size
const goodUrl = `${unsplashUrl}?w=800&q=80&fm=jpg&fit=crop`;
```

**Unsplash URL Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `w=800` | Width in pixels | `w=1200` |
| `h=600` | Height in pixels | `h=800` |
| `q=80` | Quality (1-100) | `q=85` |
| `fm=jpg` | Format (jpg, png, webp) | `fm=jpg` |
| `fit=crop` | Crop strategy | `fit=crop` |
| `crop=faces` | Smart crop | `crop=faces` |

**Example:**

```typescript
import { unsplash_tool } from '@tools';

// Get Unsplash image with optimization
const imageUrl = await unsplash_tool({ query: 'office workspace' });
const optimizedUrl = `${imageUrl}?w=800&q=80&fm=jpg&fit=crop`;

<ImageWithFallback src={optimizedUrl} alt="Office workspace" />
```

---

### **8. Performance Checklist**

Before adding any image to HRthis, check:

- [ ] ✅ Using `ImageWithFallback` component?
- [ ] ✅ Image optimized (correct size, format, quality)?
- [ ] ✅ Alt text provided (accessibility)?
- [ ] ✅ File size < recommended max?
- [ ] ✅ Lazy loading enabled?
- [ ] ✅ Proper format (JPEG for photos, PNG for transparency, SVG for icons)?
- [ ] ✅ Unsplash images have size parameters?

---

## 🛠️ **TOOLS & RESOURCES**

### **Online Optimization Tools:**

1. **TinyPNG** (https://tinypng.com/)
   - Compress PNG/JPEG images
   - Up to 70% size reduction
   - Free tier available

2. **Squoosh** (https://squoosh.app/)
   - Advanced compression options
   - Compare before/after
   - Browser-based (private)

3. **ImageOptim** (Mac)
   - Desktop app for batch optimization
   - Lossless & lossy compression

### **Format Conversion:**

- **PNG → JPEG:** Use for photos without transparency
- **JPEG → WebP:** Future optimization (not yet implemented)
- **PNG/JPEG → SVG:** Use vector graphics tools (Illustrator, Figma)

---

## 🚀 **IMPLEMENTATION EXAMPLES**

### **Example 1: Profile Picture Upload**

```typescript
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { supabase } from './utils/supabase/client';

async function uploadProfilePicture(file: File, userId: string) {
  // 1. Optimize image
  const optimized = await compressImage(file, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.85,
    mimeType: 'image/jpeg',
  });
  
  // 2. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(`${userId}/avatar.jpg`, optimized);
    
  if (error) throw error;
  
  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(data.path);
    
  // 4. Display with ImageWithFallback
  return (
    <ImageWithFallback
      src={publicUrl}
      alt="User profile picture"
      className="w-24 h-24 rounded-full object-cover"
    />
  );
}
```

### **Example 2: Dashboard Card Background**

```typescript
// Unsplash image for dashboard card
const backgroundUrl = await unsplash_tool({ 
  query: 'modern office' 
});

const optimized = `${backgroundUrl}?w=400&h=300&q=80&fm=jpg&fit=crop`;

<div className="relative overflow-hidden rounded-lg">
  <ImageWithFallback
    src={optimized}
    alt="Office background"
    className="absolute inset-0 w-full h-full object-cover opacity-20"
  />
  <div className="relative z-10 p-6">
    {/* Card content */}
  </div>
</div>
```

### **Example 3: Gallery with Thumbnails**

```typescript
const images = [
  { thumb: 'thumb-200x200.jpg', full: 'full-1200x800.jpg' },
  { thumb: 'thumb-200x200.jpg', full: 'full-1200x800.jpg' },
];

<div className="grid grid-cols-4 gap-4">
  {images.map((img, i) => (
    <button key={i} onClick={() => openLightbox(img.full)}>
      <ImageWithFallback
        src={img.thumb}
        alt={`Gallery image ${i + 1}`}
        className="w-full h-full object-cover rounded-lg"
      />
    </button>
  ))}
</div>
```

---

## 📊 **PERFORMANCE IMPACT**

### **Before Optimization:**
```
Unoptimized Image:
- Size: 3 MB
- Dimensions: 4000×3000px
- Load time: ~3-5s (3G)
- Format: PNG
```

### **After Optimization:**
```
Optimized Image:
- Size: 80 KB (-97%)
- Dimensions: 800×600px
- Load time: ~0.2s (3G)
- Format: JPEG 85%
```

**Result:** 15-25x faster loading! 🚀

---

## ⚠️ **COMMON MISTAKES TO AVOID**

### **❌ Don't:**

1. **Use full-resolution images**
   ```typescript
   // ❌ BAD - 5 MB image
   <img src="photo-4000x3000-full.jpg" alt="..." />
   ```

2. **Skip alt text**
   ```typescript
   // ❌ BAD - No alt text (accessibility issue)
   <ImageWithFallback src={url} />
   ```

3. **Use PNG for photos**
   ```typescript
   // ❌ BAD - PNG for photos (3x larger than JPEG)
   <ImageWithFallback src="photo.png" alt="..." />
   ```

4. **Forget Unsplash parameters**
   ```typescript
   // ❌ BAD - Full size Unsplash image
   <ImageWithFallback src={unsplashUrl} alt="..." />
   ```

### **✅ Do:**

1. **Use appropriately sized images**
   ```typescript
   // ✅ GOOD - Right size for use case
   <ImageWithFallback src="photo-800x600-q85.jpg" alt="..." />
   ```

2. **Always include alt text**
   ```typescript
   // ✅ GOOD - Descriptive alt text
   <ImageWithFallback src={url} alt="User profile picture" />
   ```

3. **Use JPEG for photos**
   ```typescript
   // ✅ GOOD - JPEG for photos
   <ImageWithFallback src="photo-q85.jpg" alt="..." />
   ```

4. **Add Unsplash parameters**
   ```typescript
   // ✅ GOOD - Optimized Unsplash image
   const optimized = `${unsplashUrl}?w=800&q=80&fm=jpg`;
   <ImageWithFallback src={optimized} alt="..." />
   ```

---

## 📝 **SUMMARY**

### **Key Takeaways:**

1. ✅ **Always use ImageWithFallback** for external images
2. ✅ **Optimize before upload:** Right size, format, quality
3. ✅ **JPEG for photos** (80-85% quality)
4. ✅ **PNG for transparency**, SVG for icons
5. ✅ **Lazy loading** enabled by default
6. ✅ **Add Unsplash parameters** for external images
7. ✅ **Profile pictures:** Max 500×500px, JPEG 85%
8. ✅ **Always include alt text** (accessibility)

### **Performance Goals:**

- Profile pictures: < 100 KB
- Card images: < 80 KB
- Full-width images: < 200 KB
- Total page images: < 1 MB

**Follow these guidelines for a fast, optimized HRthis experience! 🚀**

---

**Created:** 2025-01-10  
**Version:** 1.0.0  
**Phase:** 5 - Performance & Monitoring  
**Priority:** 4 - Asset Optimization
