// ============================================================================
// Layout breakpoints shared by pages that must adapt to smaller windows.
//
//   compact  < 1536px   laptops: slim nav rail with a popover, panels open at
//                       their minimum width
//   narrow   < 1024px   small tablets and phones: no nav rail; a hamburger
//                       opens the page menu as a drawer
//   portrait narrow and taller than wide (phones): side panels become bottom
//                       sheets so the map keeps the full width
// ============================================================================

/**
 * Windows narrower than this are "compact". 1536px covers 13" to 15" laptops at
 * their default scaling.
 */
export const COMPACT_VIEWPORT_QUERY = '(max-width: 1535px)';

/** Windows narrower than this are "narrow": the nav rail is replaced by a hamburger. */
export const NARROW_VIEWPORT_QUERY = '(max-width: 1023px)';

/** Narrow windows that are taller than they are wide, such as phones held upright. */
export const PORTRAIT_VIEWPORT_QUERY = '(max-width: 1023px) and (orientation: portrait)';
