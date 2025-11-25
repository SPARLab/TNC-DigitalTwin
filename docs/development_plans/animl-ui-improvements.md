# Animl UI Improvements and Bug Fixes

## Overview
This document outlines improvements needed for the Animl data source integration, focusing on UI/UX enhancements, bug fixes, and performance optimizations.

## Issues to Fix

### 1. Duplicate Key Warnings (Critical Bug)
**Problem:** When clicking on a camera in the left sidebar to highlight it on the map, React warnings appear about duplicate keys:
```
Warning: Encountered two children with the same key, `4686`. Keys should be unique...
```

**Location:** `src/components/AnimlSidebar.tsx` - likely in the deployment list rendering

**Solution:** 
- Review the key generation logic for deployment items
- Ensure unique composite keys (e.g., `deployment-${id}-${animl_dp_id}-${index}`)
- Check if highlighting is causing re-renders that duplicate items

### 2. Remove Image Limit and Add Pagination
**Problem:** Currently hardcoded to fetch maximum 1000 image labels, which may miss data.

**Requirements:**
- Remove the `maxResults: 1000` limit (or make it configurable/unlimited)
- Implement pagination support for large datasets
- Add a total count query before fetching data
- Add count-by-category queries (e.g., "How many mountain lion images?")

**Implementation Notes:**
- Use `returnCountOnly=true` for count queries
- Implement progressive loading with pagination
- Show count information in the UI (e.g., "625 images (all loaded)" or "1,000+ images (showing first 1,000)")
- Consider lazy loading images in the gallery view

**Files to Modify:**
- `src/services/animlService.ts` - Remove maxResults limit, add count queries
- `src/App.tsx` - Update service calls
- `src/components/AnimlSidebar.tsx` - Show count information

### 3. Better Map Icon for Camera Traps
**Problem:** Current orange dots are unclear and don't indicate what they represent.

**Solution:** 
- Replace simple orange circle markers with a camera-on-tripod icon
- Use an SVG icon or symbol that clearly represents a camera trap
- Reference: Camera on tripod icon design (black and white line art, rounded corners)

**Files to Modify:**
- `src/components/MapView.tsx` - Update symbol creation in `loadAnimlObservations`

**Implementation:**
- Create or import a camera icon SVG
- Use `PictureMarkerSymbol` or `SimpleMarkerSymbol` with an icon path
- Consider using an emoji fallback (📷) or creating a custom icon component

### 4. Alphabetical Organization of Animals
**Problem:** Animals/labels in the "Animals" tab are not alphabetically organized, making it hard to find specific animals.

**Solution:**
- Sort animal tags alphabetically by label name in the Animals tab view
- Ensure sorting is case-insensitive

**Files to Modify:**
- `src/components/AnimlSidebar.tsx` - Sort `animlAnimalTags` alphabetically before rendering

### 5. Expandable/Collapsible Animal Categories
**Problem:** Currently, clicking on an animal category (e.g., "Wild Boar") navigates to a new view showing a gallery of images. This is confusing because:
- Users don't know categories are clickable
- Navigation feels abrupt
- Hard to see all categories at once

**Solution:**
- Make animal categories expandable/collapsible (accordion-style)
- When expanded, show all images for that animal in a gallery view
- Use clear visual indicators (chevron icons, "Expand/Collapse" text)
- Allow multiple categories to be expanded at once (or single-expand mode, user's choice)

**UI/UX:**
- Use an accordion component pattern
- Show image count for each category: "Wild Boar (127 images)"
- When expanded, show a grid/gallery of image thumbnails
- Thumbnails should be larger than current small thumbnails
- Consider lazy loading images as user scrolls

**Files to Modify:**
- `src/components/AnimlSidebar.tsx` - Implement accordion for animal categories
- `src/components/AnimlDetailsSidebar.tsx` - May need updates for expanded view

**Design Considerations:**
- Use Tailwind CSS for styling (accordion, grid layout)
- Consider using a component library if available (e.g., Radix UI, Headless UI)
- Ensure smooth expand/collapse animations
- Make it clear which categories are expanded

### 6. Image Display Improvements
**Problem:** 
- Images are shown as very small thumbnails
- Users want to see all images quickly without clicking through each one

**Solution:**
- When an animal category is expanded, show a grid of larger thumbnails
- Implement a lightbox/modal for full-size image viewing
- Consider infinite scroll or pagination for large image sets
- Show image metadata (date, camera name) with each thumbnail

**Files to Modify:**
- `src/components/AnimlSidebar.tsx` - Update image gallery rendering
- Potentially create a new `AnimlImageGallery.tsx` component

### 7. Layout Improvements for Image Details
**Problem:** Date info and camera name info for individual image captures are on the same row, which is cluttered.

**Solution:**
- Put date info on one row
- Put camera name info on a separate row below it
- Ensure proper spacing and readability

**Files to Modify:**
- `src/components/AnimlDetailsSidebar.tsx` - Update image detail card layout
- `src/components/AnimlSidebar.tsx` - Update image card layout if applicable

## Implementation Priority

1. **High Priority (Bugs):**
   - Fix duplicate key warnings (#1)
   - Better map icon (#3)

2. **Medium Priority (UX):**
   - Alphabetical organization (#4)
   - Expandable categories (#5)
   - Layout improvements (#7)

3. **Lower Priority (Performance/Features):**
   - Remove image limit and pagination (#2)
   - Image display improvements (#6)

## Technical Notes

### Count Queries
```typescript
// Example count query structure
const countParams = {
  where: whereClause,
  returnCountOnly: true,
  f: 'json'
};

// Count by category example
const categoryCountParams = {
  where: `label = 'mountain lion' ${dateFilter}`,
  returnCountOnly: true,
  f: 'json'
};
```

### Pagination Strategy
- Use `resultOffset` and `resultRecordCount` for pagination
- Fetch in batches (e.g., 1000 records per batch)
- Show progress indicator during loading
- Consider virtual scrolling for large lists

### Icon Resources
- Search for "camera tripod icon SVG" or create custom
- Consider using icon libraries like:
  - Heroicons
  - Material Icons
  - Font Awesome
  - Custom SVG component

## Testing Checklist

- [ ] No duplicate key warnings when clicking cameras
- [ ] Map shows camera icons instead of orange dots
- [ ] Animals are sorted alphabetically
- [ ] Animal categories are expandable/collapsible
- [ ] Expanded categories show image gallery
- [ ] Date and camera name are on separate rows
- [ ] Count queries work correctly
- [ ] Pagination handles large datasets
- [ ] Images load progressively
- [ ] UI is responsive and performs well with many images

