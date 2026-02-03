# No Emojis Policy - Use SVG Icons Instead

## Policy

**DO NOT use emojis in code or UI.** Always use SVG icons instead.

## Rationale

- Emojis render inconsistently across different browsers and operating systems
- SVG icons provide consistent visual appearance across all platforms
- SVG icons can be styled with CSS (color, size, etc.)
- SVG icons are more accessible and can be optimized for performance

## Implementation Requirements

1. **When you need an icon:**
   - First, check existing icon components in `src/components/icons/`
   - Check `src/utils/dataSourceIcons.tsx` for data source icons
   - Check `public/icons/` for public assets

2. **If no suitable icon exists:**
   - Search for SVG icons from reputable sources:
     - Lucide React (already in use: `lucide-react`)
     - Heroicons
     - Material Design Icons
     - Feather Icons
   - Create a new React component following the pattern of existing icons (see `DroneIcon.tsx`, `LidarIcon.tsx`)

3. **Icon component pattern:**
   ```tsx
   import React from 'react';
   
   const IconName: React.FC<{ className?: string }> = ({ className = '' }) => (
     <svg 
       viewBox="0 0 24 24" 
       className={className}
       fill="currentColor"
       xmlns="http://www.w3.org/2000/svg"
     >
       {/* SVG path data */}
     </svg>
   );
   
   export default IconName;
   ```

4. **Never:**
   - Use emoji characters (📌, 🔖, 🌪️, etc.) in code
   - Suggest emoji-based solutions
   - Use emojis in UI text or labels

## Existing Icon Locations

- Component icons: `src/components/icons/`
- Data source icons: `src/utils/dataSourceIcons.tsx`
- Public assets: `public/icons/`

## When Reviewing Code

If you see emojis in code or UI:
1. Identify what the emoji represents
2. Find or create an appropriate SVG icon
3. Replace the emoji with the SVG icon component
4. Update any related documentation

## Documentation

Full policy details: `docs/DESIGN-SYSTEM/design-system.md`
