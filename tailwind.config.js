/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // =======================================================================
    // CUSTOM BREAKPOINTS
    // Mobile-first: values apply from that breakpoint UP
    // - Base (no prefix): < 640px (small mobile)
    // - sm: 640px+ (large mobile)
    // - md: 768px+ (tablet)
    // - lg: 1024px+ (small desktop - includes 14" MacBook at 1145px)
    // - xl: 1280px+ (desktop)
    // - 2xl: 1440px+ (large desktop)
    // =======================================================================
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
    },
    
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      
      // =======================================================================
      // TYPOGRAPHY - Explicit values per breakpoint
      // 
      // Naming: text-{role}-{breakpoint}
      // Usage:  text-title-page-base lg:text-title-page-lg 2xl:text-title-page-2xl
      // =======================================================================
      fontSize: {
        // Page titles (e.g., "Dangermond Preserve Data Catalog")
        'title-page-base': ['0.875rem', { fontWeight: '600' }],  // 14px - mobile
        'title-page-sm': ['0.9375rem', { fontWeight: '600' }],   // 15px
        'title-page-md': ['1rem', { fontWeight: '600' }],        // 16px
        'title-page-lg': ['1.125rem', { fontWeight: '600' }],    // 18px
        'title-page-xl': ['1.125rem', { fontWeight: '600' }],    // 18px
        'title-page-2xl': ['1.25rem', { fontWeight: '600' }],    // 20px
        
        // Section headings (e.g., "Data Type", sidebar titles)
        'title-section-base': ['0.8125rem', { fontWeight: '600' }], // 13px
        'title-section-sm': ['0.875rem', { fontWeight: '600' }],    // 14px
        'title-section-md': ['0.875rem', { fontWeight: '600' }],    // 14px
        'title-section-lg': ['1rem', { fontWeight: '600' }],        // 16px
        'title-section-xl': ['1rem', { fontWeight: '600' }],        // 16px
        'title-section-2xl': ['1.125rem', { fontWeight: '600' }],   // 18px
        
        // Card titles, prominent labels
        'title-card-base': ['0.75rem', { fontWeight: '500' }],   // 12px
        'title-card-sm': ['0.8125rem', { fontWeight: '500' }],   // 13px
        'title-card-md': ['0.875rem', { fontWeight: '500' }],    // 14px
        'title-card-lg': ['1rem', { fontWeight: '500' }],        // 16px
        'title-card-xl': ['1rem', { fontWeight: '500' }],        // 16px
        'title-card-2xl': ['1rem', { fontWeight: '500' }],       // 16px
        
        // Body text, descriptions, form inputs
        'body-base': ['0.75rem', { fontWeight: '400' }],         // 12px
        'body-sm': ['0.8125rem', { fontWeight: '400' }],         // 13px
        'body-md': ['0.8125rem', { fontWeight: '400' }],         // 13px
        'body-lg': ['0.875rem', { fontWeight: '400' }],          // 14px
        'body-xl': ['0.875rem', { fontWeight: '400' }],          // 14px
        'body-2xl': ['0.875rem', { fontWeight: '400' }],         // 14px
        
        // Labels, metadata, badges, timestamps
        'label-base': ['0.625rem', { fontWeight: '500' }],       // 10px
        'label-sm': ['0.6875rem', { fontWeight: '500' }],        // 11px
        'label-md': ['0.75rem', { fontWeight: '500' }],          // 12px
        'label-lg': ['0.75rem', { fontWeight: '500' }],          // 12px
        'label-xl': ['0.75rem', { fontWeight: '500' }],          // 12px
        'label-2xl': ['0.75rem', { fontWeight: '500' }],         // 12px
        
        // Micro text (badges, very small labels)
        'micro-base': ['0.5rem', { fontWeight: '500' }],         // 8px
        'micro-sm': ['0.5625rem', { fontWeight: '500' }],        // 9px
        'micro-md': ['0.625rem', { fontWeight: '500' }],         // 10px
        'micro-lg': ['0.625rem', { fontWeight: '500' }],         // 10px
        'micro-xl': ['0.625rem', { fontWeight: '500' }],         // 10px
        'micro-2xl': ['0.625rem', { fontWeight: '500' }],        // 10px
      },
      
      // =======================================================================
      // SPACING - Explicit values per breakpoint
      //
      // Naming: {role}-{breakpoint}
      // Usage:  px-page-base lg:px-page-lg 2xl:px-page-2xl
      //         gap-large-base lg:gap-large-lg 2xl:gap-large-2xl
      // =======================================================================
      spacing: {
        // Page horizontal padding (header, footer, main containers)
        'page-base': '0.25rem',      // 4px
        'page-sm': '0.375rem',       // 6px
        'page-md': '0.5rem',         // 8px
        'page-lg': '0.75rem',        // 12px
        'page-xl': '0.75rem',        // 12px
        'page-2xl': '0.75rem',       // 12px
        
        // Vertical page padding (header/footer height contribution)
        'page-y-base': '0.375rem',   // 6px
        'page-y-sm': '0.5rem',       // 8px
        'page-y-md': '0.5rem',       // 8px
        'page-y-lg': '0.375rem',     // 6px
        'page-y-xl': '0.5rem',       // 8px
        'page-y-2xl': '1rem',        // 16px
        
        // Container/card padding
        'card-base': '0.25rem',      // 4px
        'card-sm': '0.375rem',       // 6px
        'card-md': '0.5rem',         // 8px
        'card-lg': '0.75rem',        // 12px
        'card-xl': '0.75rem',        // 12px
        'card-2xl': '1rem',          // 16px
        
        // Compact container padding (smaller cards, dense UI)
        'card-compact-base': '0.25rem',  // 4px
        'card-compact-sm': '0.25rem',    // 4px
        'card-compact-md': '0.375rem',   // 6px
        'card-compact-lg': '0.5rem',     // 8px
        'card-compact-xl': '0.5rem',     // 8px
        'card-compact-2xl': '0.75rem',   // 12px
        
        // Large gaps (between filter groups, major sections)
        'gap-large-base': '0.375rem',    // 6px
        'gap-large-sm': '0.375rem',      // 6px
        'gap-large-md': '0.5rem',        // 8px
        'gap-large-lg': '0.75rem',       // 12px
        'gap-large-xl': '0.75rem',       // 12px
        'gap-large-2xl': '1rem',         // 16px
        
        // Default gaps (between elements in a group)
        'gap-default-base': '0.25rem',   // 4px
        'gap-default-sm': '0.25rem',     // 4px
        'gap-default-md': '0.25rem',     // 4px
        'gap-default-lg': '0.375rem',    // 6px
        'gap-default-xl': '0.375rem',    // 6px
        'gap-default-2xl': '0.5rem',     // 8px
        
        // Small gaps (tight spacing)
        'gap-small-base': '0.125rem',    // 2px
        'gap-small-sm': '0.125rem',      // 2px
        'gap-small-md': '0.25rem',       // 4px
        'gap-small-lg': '0.25rem',       // 4px
        'gap-small-xl': '0.375rem',      // 6px
        'gap-small-2xl': '0.375rem',     // 6px
        
        // Section margins (between major UI sections)
        'section-base': '0.375rem',      // 6px
        'section-sm': '0.5rem',          // 8px
        'section-md': '0.75rem',         // 12px
        'section-lg': '1rem',            // 16px
        'section-xl': '1rem',            // 16px
        'section-2xl': '1.5rem',         // 24px
        
        // Compact section margins
        'section-compact-base': '0.25rem',  // 4px
        'section-compact-sm': '0.375rem',   // 6px
        'section-compact-md': '0.5rem',     // 8px
        'section-compact-lg': '0.75rem',    // 12px
        'section-compact-xl': '0.75rem',    // 12px
        'section-compact-2xl': '1rem',      // 16px
        
        // Element margins (between sibling elements)
        'element-base': '0.125rem',      // 2px
        'element-sm': '0.25rem',         // 4px
        'element-md': '0.25rem',         // 4px
        'element-lg': '0.5rem',          // 8px
        'element-xl': '0.5rem',          // 8px
        'element-2xl': '0.5rem',         // 8px
        
        // Compact element margins
        'element-compact-base': '0.125rem', // 2px
        'element-compact-sm': '0.125rem',   // 2px
        'element-compact-md': '0.25rem',    // 4px
        'element-compact-lg': '0.25rem',    // 4px
        'element-compact-xl': '0.25rem',    // 4px
        'element-compact-2xl': '0.25rem',   // 4px
        
        // Button horizontal padding
        'btn-x-base': '0.375rem',        // 6px
        'btn-x-sm': '0.375rem',          // 6px
        'btn-x-md': '0.5rem',            // 8px
        'btn-x-lg': '0.625rem',          // 10px
        'btn-x-xl': '0.625rem',          // 10px
        'btn-x-2xl': '0.75rem',          // 12px
        
        // Button vertical padding
        'btn-y-base': '0.25rem',         // 4px
        'btn-y-sm': '0.25rem',           // 4px
        'btn-y-md': '0.375rem',          // 6px
        'btn-y-lg': '0.375rem',          // 6px
        'btn-y-xl': '0.375rem',          // 6px
        'btn-y-2xl': '0.5rem',           // 8px
        
        // Compact button padding
        'btn-compact-x-base': '0.25rem', // 4px
        'btn-compact-x-sm': '0.375rem',  // 6px
        'btn-compact-x-md': '0.5rem',    // 8px
        'btn-compact-x-lg': '0.5rem',    // 8px
        'btn-compact-x-xl': '0.5rem',    // 8px
        'btn-compact-x-2xl': '0.5rem',   // 8px
        
        'btn-compact-y-base': '0.125rem', // 2px
        'btn-compact-y-sm': '0.25rem',    // 4px
        'btn-compact-y-md': '0.25rem',    // 4px
        'btn-compact-y-lg': '0.25rem',    // 4px
        'btn-compact-y-xl': '0.25rem',    // 4px
        'btn-compact-y-2xl': '0.25rem',   // 4px
      },
      
      // =======================================================================
      // WIDTHS - Explicit values per breakpoint
      //
      // Usage: w-sidebar-base lg:w-sidebar-lg 2xl:w-sidebar-2xl
      // =======================================================================
      width: {
        // Sidebar widths
        'sidebar-base': '100%',
        'sidebar-sm': '100%',
        'sidebar-md': '100%',
        'sidebar-lg': '12rem',       // 192px
        'sidebar-xl': '14rem',       // 224px
        'sidebar-2xl': '16rem',      // 256px
        
        // Filter button widths
        'filter-base': 'auto',
        'filter-sm': 'auto',
        'filter-md': 'auto',
        'filter-lg': '17.2rem',        // 192px
        'filter-xl': '19rem',        // 288px - good for 14" MacBook
        'filter-2xl': '23rem',     // 366px
      },
      
      minWidth: {
        'filter-base': 'auto',
        'filter-sm': 'auto',
        'filter-md': 'auto',
        'filter-lg': '12rem',        // 192px
        'filter-xl': '18rem',        // 288px
        'filter-2xl': '22.9rem',     // 366px
      },
      
      maxWidth: {
        'card': '24rem',             // 384px
      },
      
      // =======================================================================
      // BORDER RADIUS (static - no breakpoint variants needed)
      // =======================================================================
      borderRadius: {
        'card': '0.5rem',            // 8px - rounded-lg
        'button': '0.375rem',        // 6px - rounded-md
        'badge': '0.25rem',          // 4px - rounded
      },
    },
  },
  plugins: [],
}
