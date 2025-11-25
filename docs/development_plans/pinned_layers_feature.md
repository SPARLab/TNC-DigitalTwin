# Feature Specification: Cross-Source Layer Pinning

## The Core Concept
We are breaking the limitation of only viewing one data source at a time. The **Pinned Layers** feature allows users to "collect" interesting layers from different sources and overlay them on a single map view.

**The Goal:**
Enable a researcher to see **iNaturalist bird observations** (Point Data) overlaid on top of a **Vegetation Classification Map** (Raster/Feature Data) to discover relationships between species and habitat.

---

## User Experience

### 1. The "Pin" Action
*   **Discovery**: Every data card or search result that can be represented on the map will have a consistent **"Pin to Map"** icon (likely a pushpin or bookmark symbol).
*   **Feedback**: When clicked, the icon animates to a "filled" state, and the global "Pinned Layers" counter increments.

### 2. The Pinned Layers Manager
A new floating control on the map (distinct from the sidebar) manages this composition.

#### Collapsed State (Default)
*   A simple, unobtrusive pill or button showing the count of active layers (e.g., "📌 3 Layers").
*   *Animation*: When a user pins a new layer, this component momentarily expands or pulses to confirm the addition without blocking the view.

#### Expanded State (Management)
*   Clicking the collapsed pill expands a panel listing all pinned layers.
*   **Reordering**: Users can drag layers up and down to change their drawing order (z-index). This is critical for seeing point data on top of polygon/raster data.
*   **Opacity**: Each layer has an opacity slider, allowing users to "fade out" a solid vegetation map to see the satellite imagery or terrain underneath.
*   **Visibility**: Quick toggles to hide/show layers without losing the query.
*   **Legend**: An optional toggle to reveal the specific legend for just that pinned layer.

### 3. Data Persistence
*   Pinned layers remain on the map even as the user navigates back to the Data Catalog or switches to a different Data View in the sidebar.
*   This allows the map to serve as a permanent "canvas" while the sidebar acts as the "palette" to find new data.

---

## Visual Hierarchy
1.  **Base**: Satellite/Topographic Basemap.
2.  **Pinned Layers**: User-selected stack (e.g., Historic Fire Perimeters, Vegetation).
3.  **Active View**: The transient data currently being explored in the active Sidebar (e.g., the live search results from the current Dendra query).

*Note: Users should be able to "Pin" the Active View to move it into the permanent stack.*
