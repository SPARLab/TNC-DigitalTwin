/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // =======================================================================
    // CUSTOM BREAKPOINTS
    // Desktop-only application: minimum supported width is 1024px (lg)
    // Below lg, DesktopOnlyGate shows a blocking message
    // =======================================================================
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',   // Minimum supported width (compact mode)
      'xl': '1280px',   // Standard laptop experience
      '2xl': '1440px',  // Desktop/monitor experience
    },
    
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      
      // =======================================================================
      // TYPOGRAPHY - Data-Dense Design System
      // 
      // Optimized for maximum information density
      // Reference: docs/design-system/DESIGN_SYSTEM.md
      // 
      // Naming: text-{role}-{breakpoint}
      // Usage:  text-title-page-lg xl:text-title-page-xl 2xl:text-title-page-2xl
      // =======================================================================
      fontSize: {
        // Page titles (e.g., "Dangermond Preserve Data Catalog")
        // lg: 15px, xl: 16px, 2xl: 18px
        'title-page-base': ['0.875rem', { lineHeight: '1.2', fontWeight: '600' }],    // 14px - fallback
        'title-page-sm': ['0.875rem', { lineHeight: '1.2', fontWeight: '600' }],      // 14px
        'title-page-md': ['0.9375rem', { lineHeight: '1.2', fontWeight: '600' }],     // 15px
        'title-page-lg': ['0.9375rem', { lineHeight: '1.2', fontWeight: '600' }],     // 15px
        'title-page-xl': ['1rem', { lineHeight: '1.2', fontWeight: '600' }],          // 16px
        'title-page-2xl': ['1.125rem', { lineHeight: '1.2', fontWeight: '600' }],     // 18px
        
        // Section headings (e.g., "Data Type", sidebar titles)
        // lg: 13px, xl: 14px, 2xl: 15px
        'title-section-base': ['0.75rem', { lineHeight: '1.2', fontWeight: '600' }],  // 12px - fallback
        'title-section-sm': ['0.8125rem', { lineHeight: '1.2', fontWeight: '600' }],  // 13px
        'title-section-md': ['0.8125rem', { lineHeight: '1.2', fontWeight: '600' }],  // 13px
        'title-section-lg': ['0.8125rem', { lineHeight: '1.2', fontWeight: '600' }],  // 13px
        'title-section-xl': ['0.875rem', { lineHeight: '1.2', fontWeight: '600' }],   // 14px
        'title-section-2xl': ['0.9375rem', { lineHeight: '1.2', fontWeight: '600' }], // 15px
        
        // Card titles, prominent labels
        // lg: 12px, xl: 13px, 2xl: 14px
        'title-card-base': ['0.6875rem', { lineHeight: '1.2', fontWeight: '500' }],   // 11px - fallback
        'title-card-sm': ['0.75rem', { lineHeight: '1.2', fontWeight: '500' }],       // 12px
        'title-card-md': ['0.75rem', { lineHeight: '1.2', fontWeight: '500' }],       // 12px
        'title-card-lg': ['0.75rem', { lineHeight: '1.2', fontWeight: '500' }],       // 12px
        'title-card-xl': ['0.8125rem', { lineHeight: '1.2', fontWeight: '500' }],     // 13px
        'title-card-2xl': ['0.875rem', { lineHeight: '1.2', fontWeight: '500' }],     // 14px
        
        // Body text, descriptions, form inputs
        // lg: 12px, xl: 12px, 2xl: 13px
        'body-base': ['0.6875rem', { lineHeight: '1.4', fontWeight: '400' }],         // 11px - fallback
        'body-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],             // 12px
        'body-md': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],             // 12px
        'body-lg': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],             // 12px
        'body-xl': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],             // 12px
        'body-2xl': ['0.8125rem', { lineHeight: '1.4', fontWeight: '400' }],          // 13px
        
        // Labels, metadata, badges, form labels
        // lg: 10px, xl: 11px, 2xl: 12px
        'label-base': ['0.5625rem', { lineHeight: '1.3', fontWeight: '500' }],        // 9px - fallback
        'label-sm': ['0.625rem', { lineHeight: '1.3', fontWeight: '500' }],           // 10px
        'label-md': ['0.625rem', { lineHeight: '1.3', fontWeight: '500' }],           // 10px
        'label-lg': ['0.625rem', { lineHeight: '1.3', fontWeight: '500' }],           // 10px
        'label-xl': ['0.6875rem', { lineHeight: '1.3', fontWeight: '500' }],          // 11px
        'label-2xl': ['0.75rem', { lineHeight: '1.3', fontWeight: '500' }],           // 12px
        
        // Captions, timestamps, secondary info
        // lg: 10px, xl: 10px, 2xl: 11px
        'caption-base': ['0.5625rem', { lineHeight: '1.3', fontWeight: '400' }],      // 9px - fallback
        'caption-sm': ['0.625rem', { lineHeight: '1.3', fontWeight: '400' }],         // 10px
        'caption-md': ['0.625rem', { lineHeight: '1.3', fontWeight: '400' }],         // 10px
        'caption-lg': ['0.625rem', { lineHeight: '1.3', fontWeight: '400' }],         // 10px
        'caption-xl': ['0.625rem', { lineHeight: '1.3', fontWeight: '400' }],         // 10px
        'caption-2xl': ['0.6875rem', { lineHeight: '1.3', fontWeight: '400' }],       // 11px
        
        // Micro text (badge abbreviations, very small labels)
        // lg: 9px, xl: 9px, 2xl: 10px
        'micro-base': ['0.5rem', { lineHeight: '1.2', fontWeight: '500' }],           // 8px - fallback
        'micro-sm': ['0.5rem', { lineHeight: '1.2', fontWeight: '500' }],             // 8px
        'micro-md': ['0.5625rem', { lineHeight: '1.2', fontWeight: '500' }],          // 9px
        'micro-lg': ['0.5625rem', { lineHeight: '1.2', fontWeight: '500' }],          // 9px
        'micro-xl': ['0.5625rem', { lineHeight: '1.2', fontWeight: '500' }],          // 9px
        'micro-2xl': ['0.625rem', { lineHeight: '1.2', fontWeight: '500' }],          // 10px
      },
      
      // =======================================================================
      // SPACING - Data-Dense Design System
      //
      // Reference: docs/design-system/DESIGN_SYSTEM.md
      //
      // Naming: {role}-{breakpoint}
      // Usage examples:
      //   - px-page-lg xl:px-page-xl 2xl:px-page-2xl (horizontal page padding)
      //   - p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl (card padding)
      //   - gap-gap-section-lg xl:gap-gap-section-xl (section gaps)
      // =======================================================================
      spacing: {
        // Page padding (header, footer, main containers)
        // lg: 10px, xl: 12px, 2xl: 16px
        'page-base': '0.5rem',           // 8px - fallback
        'page-sm': '0.5rem',             // 8px
        'page-md': '0.625rem',           // 10px
        'page-lg': '0.625rem',           // 10px
        'page-xl': '0.75rem',            // 12px
        'page-2xl': '1rem',              // 16px
        
        // Vertical page padding
        // lg: 6px, xl: 8px, 2xl: 10px
        'page-y-base': '0.25rem',        // 4px - fallback
        'page-y-sm': '0.375rem',         // 6px
        'page-y-md': '0.375rem',         // 6px
        'page-y-lg': '0.375rem',         // 6px
        'page-y-xl': '0.5rem',           // 8px
        'page-y-2xl': '0.625rem',        // 10px
        
        // Card padding (standard cards)
        // lg: 6px, xl: 8px, 2xl: 12px
        'pad-card-base': '0.25rem',      // 4px - fallback
        'pad-card-sm': '0.375rem',       // 6px
        'pad-card-md': '0.375rem',       // 6px
        'pad-card-lg': '0.375rem',       // 6px
        'pad-card-xl': '0.5rem',         // 8px
        'pad-card-2xl': '0.75rem',       // 12px
        
        // Compact card padding
        // lg: 4px, xl: 6px, 2xl: 8px
        'pad-card-compact-base': '0.125rem',  // 2px - fallback
        'pad-card-compact-sm': '0.25rem',     // 4px
        'pad-card-compact-md': '0.25rem',     // 4px
        'pad-card-compact-lg': '0.25rem',     // 4px
        'pad-card-compact-xl': '0.375rem',    // 6px
        'pad-card-compact-2xl': '0.5rem',     // 8px
        
        // Legacy card tokens (for backward compatibility)
        'card-base': '0.25rem',          // 4px
        'card-sm': '0.375rem',           // 6px
        'card-md': '0.375rem',           // 6px
        'card-lg': '0.375rem',           // 6px
        'card-xl': '0.5rem',             // 8px
        'card-2xl': '0.75rem',           // 12px
        
        'card-compact-base': '0.125rem', // 2px
        'card-compact-sm': '0.25rem',    // 4px
        'card-compact-md': '0.25rem',    // 4px
        'card-compact-lg': '0.25rem',    // 4px
        'card-compact-xl': '0.375rem',   // 6px
        'card-compact-2xl': '0.5rem',    // 8px
        
        // Section margins (between major UI sections)
        // lg: 12px, xl: 16px, 2xl: 24px
        'margin-section-base': '0.5rem',     // 8px - fallback
        'margin-section-sm': '0.75rem',      // 12px
        'margin-section-md': '0.75rem',      // 12px
        'margin-section-lg': '0.75rem',      // 12px
        'margin-section-xl': '1rem',         // 16px
        'margin-section-2xl': '1.5rem',      // 24px
        
        // Legacy section tokens
        'section-base': '0.5rem',        // 8px
        'section-sm': '0.75rem',         // 12px
        'section-md': '0.75rem',         // 12px
        'section-lg': '0.75rem',         // 12px
        'section-xl': '1rem',            // 16px
        'section-2xl': '1.5rem',         // 24px
        
        'section-compact-base': '0.375rem',  // 6px
        'section-compact-sm': '0.5rem',      // 8px
        'section-compact-md': '0.5rem',      // 8px
        'section-compact-lg': '0.5rem',      // 8px
        'section-compact-xl': '0.75rem',     // 12px
        'section-compact-2xl': '1rem',       // 16px
        
        // Element margins (between sibling elements)
        // lg: 4px, xl: 6px, 2xl: 8px
        'margin-element-base': '0.125rem',   // 2px - fallback
        'margin-element-sm': '0.25rem',      // 4px
        'margin-element-md': '0.25rem',      // 4px
        'margin-element-lg': '0.25rem',      // 4px
        'margin-element-xl': '0.375rem',     // 6px
        'margin-element-2xl': '0.5rem',      // 8px
        
        // Legacy element tokens
        'element-base': '0.125rem',      // 2px
        'element-sm': '0.25rem',         // 4px
        'element-md': '0.25rem',         // 4px
        'element-lg': '0.25rem',         // 4px
        'element-xl': '0.375rem',        // 6px
        'element-2xl': '0.5rem',         // 8px
        
        'element-compact-base': '0.0625rem', // 1px
        'element-compact-sm': '0.125rem',    // 2px
        'element-compact-md': '0.125rem',    // 2px
        'element-compact-lg': '0.125rem',    // 2px
        'element-compact-xl': '0.1875rem',   // 3px
        'element-compact-2xl': '0.25rem',    // 4px
        
        // Section gaps (between major UI sections)
        // lg: 10px, xl: 12px, 2xl: 16px
        'gap-section-base': '0.5rem',        // 8px - fallback
        'gap-section-sm': '0.625rem',        // 10px
        'gap-section-md': '0.625rem',        // 10px
        'gap-section-lg': '0.625rem',        // 10px
        'gap-section-xl': '0.75rem',         // 12px
        'gap-section-2xl': '1rem',           // 16px
        
        // Card grid gaps (between cards in a grid/list)
        // lg: 4px, xl: 6px, 2xl: 8px
        'gap-card-grid-base': '0.125rem',    // 2px - fallback
        'gap-card-grid-sm': '0.25rem',       // 4px
        'gap-card-grid-md': '0.25rem',       // 4px
        'gap-card-grid-lg': '0.25rem',       // 4px
        'gap-card-grid-xl': '0.375rem',      // 6px
        'gap-card-grid-2xl': '0.5rem',       // 8px
        
        // Element gaps (between elements in a row/column)
        // lg: 3px, xl: 4px, 2xl: 6px
        'gap-element-base': '0.125rem',      // 2px - fallback
        'gap-element-sm': '0.1875rem',       // 3px
        'gap-element-md': '0.1875rem',       // 3px
        'gap-element-lg': '0.1875rem',       // 3px
        'gap-element-xl': '0.25rem',         // 4px
        'gap-element-2xl': '0.375rem',       // 6px
        
        // Tight gaps (icon to label, very tight groupings)
        // lg: 2px, xl: 2px, 2xl: 4px
        'gap-tight-base': '0.0625rem',       // 1px - fallback
        'gap-tight-sm': '0.125rem',          // 2px
        'gap-tight-md': '0.125rem',          // 2px
        'gap-tight-lg': '0.125rem',          // 2px
        'gap-tight-xl': '0.125rem',          // 2px
        'gap-tight-2xl': '0.25rem',          // 4px
        
        // Legacy gap tokens (for backward compatibility)
        'gap-large-base': '0.5rem',          // 8px
        'gap-large-sm': '0.625rem',          // 10px
        'gap-large-md': '0.625rem',          // 10px
        'gap-large-lg': '0.625rem',          // 10px
        'gap-large-xl': '0.75rem',           // 12px
        'gap-large-2xl': '1rem',             // 16px
        
        'gap-default-base': '0.1875rem',     // 3px
        'gap-default-sm': '0.25rem',         // 4px
        'gap-default-md': '0.25rem',         // 4px
        'gap-default-lg': '0.25rem',         // 4px
        'gap-default-xl': '0.375rem',        // 6px
        'gap-default-2xl': '0.5rem',         // 8px
        
        'gap-small-base': '0.0625rem',       // 1px
        'gap-small-sm': '0.125rem',          // 2px
        'gap-small-md': '0.125rem',          // 2px
        'gap-small-lg': '0.125rem',          // 2px
        'gap-small-xl': '0.1875rem',         // 3px
        'gap-small-2xl': '0.25rem',          // 4px
        
        // Button horizontal padding
        // lg: 8px, xl: 10px, 2xl: 12px
        'btn-x-base': '0.375rem',         // 6px - fallback
        'btn-x-sm': '0.5rem',             // 8px
        'btn-x-md': '0.5rem',             // 8px
        'btn-x-lg': '0.5rem',             // 8px
        'btn-x-xl': '0.625rem',           // 10px
        'btn-x-2xl': '0.75rem',           // 12px
        
        // Button vertical padding
        // lg: 4px, xl: 6px, 2xl: 6px
        'btn-y-base': '0.1875rem',        // 3px - fallback
        'btn-y-sm': '0.25rem',            // 4px
        'btn-y-md': '0.25rem',            // 4px
        'btn-y-lg': '0.25rem',            // 4px
        'btn-y-xl': '0.375rem',           // 6px
        'btn-y-2xl': '0.375rem',          // 6px
        
        // Compact button padding
        'btn-compact-x-base': '0.25rem',  // 4px
        'btn-compact-x-sm': '0.375rem',   // 6px
        'btn-compact-x-md': '0.375rem',   // 6px
        'btn-compact-x-lg': '0.375rem',   // 6px
        'btn-compact-x-xl': '0.5rem',     // 8px
        'btn-compact-x-2xl': '0.5rem',    // 8px
        
        'btn-compact-y-base': '0.125rem', // 2px
        'btn-compact-y-sm': '0.1875rem',  // 3px
        'btn-compact-y-md': '0.1875rem',  // 3px
        'btn-compact-y-lg': '0.1875rem',  // 3px
        'btn-compact-y-xl': '0.25rem',    // 4px
        'btn-compact-y-2xl': '0.25rem',   // 4px
      },
      
      // =======================================================================
      // WIDTHS - Data-Dense Design System
      //
      // Sidebar widths are crucial for data-dense layouts
      // Reference: docs/design-system/DESIGN_SYSTEM.md
      // =======================================================================
      width: {
        // Left sidebar (Data Catalog)
        // Aligned with midpoint between Category and Spatial Filter buttons
        // Formula: page-padding + filter-width + (gap/2)
        // lg: 10 + 224 + 1 = 235px, xl: 12 + 272 + 1.5 = 286px, 2xl: 16 + 320 + 2 = 338px
        'sidebar-left-base': '100%',
        'sidebar-left-sm': '100%',
        'sidebar-left-md': '100%',
        'sidebar-left-lg': '14.6875rem',  // 235px (aligned with filter gap midpoint)
        'sidebar-left-xl': '17.875rem',   // 286px (aligned with filter gap midpoint)
        'sidebar-left-2xl': '21.125rem',  // 338px (aligned with filter gap midpoint)
        
        // Right sidebar (Details panels)
        // lg: 280px, xl: 320px, 2xl: 384px
        'sidebar-right-base': '100%',
        'sidebar-right-sm': '100%',
        'sidebar-right-md': '100%',
        'sidebar-right-lg': '17.5rem',    // 280px
        'sidebar-right-xl': '20rem',      // 320px
        'sidebar-right-2xl': '24rem',     // 384px
        
        // Legacy sidebar tokens (generic, for backward compatibility)
        'sidebar-base': '100%',
        'sidebar-sm': '100%',
        'sidebar-md': '100%',
        'sidebar-lg': '15rem',            // 240px
        'sidebar-xl': '17.5rem',          // 280px
        'sidebar-2xl': '20rem',           // 320px
        
        // Filter button widths
        'filter-base': 'auto',
        'filter-sm': 'auto',
        'filter-md': 'auto',
        'filter-lg': '14rem',             // 224px - compact
        'filter-xl': '17rem',             // 272px - standard
        'filter-2xl': '20rem',            // 320px - full
      },
      
      minWidth: {
        'filter-base': 'auto',
        'filter-sm': 'auto',
        'filter-md': 'auto',
        'filter-lg': '12rem',             // 192px
        'filter-xl': '15rem',             // 240px
        'filter-2xl': '18rem',            // 288px
      },
      
      maxWidth: {
        'card': '24rem',                  // 384px
      },
      
      // =======================================================================
      // HEIGHTS - Header/Subheader Consistency
      //
      // Fixed heights ensure header and subheader are identical
      // =======================================================================
      height: {
        // Header bar height (header, subheader)
        // lg: 40px, xl: 48px, 2xl: 56px
        'header-base': '2.25rem',         // 36px - fallback
        'header-sm': '2.5rem',            // 40px
        'header-md': '2.5rem',            // 40px
        'header-lg': '2.5rem',            // 40px
        'header-xl': '3rem',              // 48px
        'header-2xl': '3.5rem',           // 56px
      },
      
      // =======================================================================
      // BORDER RADIUS (static - no breakpoint variants needed)
      // =======================================================================
      borderRadius: {
        'card': '0.375rem',               // 6px - slightly smaller for data-dense
        'button': '0.25rem',              // 4px - compact buttons
        'badge': '0.1875rem',             // 3px - small badges
      },
    },
  },
  plugins: [],
}
