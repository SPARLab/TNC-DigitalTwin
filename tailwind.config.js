/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      
      // =======================================================================
      // SEMANTIC TYPOGRAPHY - Maps to CSS custom properties in tokens.css
      // Usage: text-title-page, text-title-section, text-body, etc.
      // =======================================================================
      fontSize: {
        'title-page': ['var(--text-title-page)', { fontWeight: 'var(--text-title-page-weight)' }],
        'title-section': ['var(--text-title-section)', { fontWeight: 'var(--text-title-section-weight)' }],
        'title-card': ['var(--text-title-card)', { fontWeight: 'var(--text-title-card-weight)' }],
        'body': ['var(--text-body)', { fontWeight: 'var(--text-body-weight)' }],
        'label': ['var(--text-label)', { fontWeight: 'var(--text-label-weight)' }],
        'micro': ['var(--text-micro)', { fontWeight: 'var(--text-micro-weight)' }],
      },
      
      // =======================================================================
      // SEMANTIC SPACING - For padding, margin, gap
      // Usage: p-container, px-page, gap-default, mb-section, etc.
      // =======================================================================
      spacing: {
        // Page-level spacing
        'page-x': 'var(--space-page-x)',
        'page-y': 'var(--space-page-y)',
        
        // Container/card padding
        'container': 'var(--space-container)',
        'container-x': 'var(--space-container-x)',
        'container-y': 'var(--space-container-y)',
        'container-sm': 'var(--space-container-sm)',
        'container-sm-x': 'var(--space-container-sm-x)',
        'container-sm-y': 'var(--space-container-sm-y)',
        
        // Gaps
        'gap-lg': 'var(--space-gap-lg)',
        'gap-default': 'var(--space-gap)',
        'gap-sm': 'var(--space-gap-sm)',
        'gap-xs': 'var(--space-gap-xs)',
        
        // Section margins
        'section': 'var(--space-section)',
        'section-sm': 'var(--space-section-sm)',
        
        // Element margins
        'element': 'var(--space-element)',
        'element-sm': 'var(--space-element-sm)',
        
        // Button padding
        'button-x': 'var(--space-button-x)',
        'button-y': 'var(--space-button-y)',
        'button-sm-x': 'var(--space-button-sm-x)',
        'button-sm-y': 'var(--space-button-sm-y)',
      },
      
      // =======================================================================
      // SEMANTIC WIDTHS
      // Usage: w-sidebar, min-w-filter-btn, etc.
      // =======================================================================
      width: {
        'sidebar': 'var(--sidebar-width)',
        'sidebar-lg': 'var(--sidebar-width-lg)',
        'filter-btn': 'var(--filter-button-width)',
      },
      minWidth: {
        'filter-btn': 'var(--filter-button-min-width)',
      },
      maxWidth: {
        'card': 'var(--card-max-width)',
      },
      
      // =======================================================================
      // SEMANTIC BORDER RADIUS
      // Usage: rounded-card, rounded-button, etc.
      // =======================================================================
      borderRadius: {
        'card': 'var(--radius-lg)',
        'button': 'var(--radius-md)',
        'badge': 'var(--radius-sm)',
      },
      
      // =======================================================================
      // SEMANTIC ICON SIZES (for width/height)
      // Usage: w-icon-sm h-icon-sm, w-icon-md h-icon-md, etc.
      // =======================================================================
      // Note: These are added to spacing so they work with w-* and h-*
    },
  },
  plugins: [],
}
