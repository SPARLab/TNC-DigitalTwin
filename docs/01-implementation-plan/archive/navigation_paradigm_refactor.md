# Navigation Paradigm Shift: Bi-Directional Discovery

## The Core Concept
We are shifting the application's navigation model from a rigid, linear filter process to a flexible, bi-directional discovery experience.

**The Big Change:**
The "Data Source" selection is being moved out of the top filter bar and into the left sidebar as a set of **Data Type Cards**.

This change acknowledges that users might approach the data in two distinct ways:
1.  **"I want to see what exists for a specific criteria."** (e.g., "Show me everything about *Birds* in the *Last Year*.")
2.  **"I know I want to explore a specific dataset."** (e.g., "I want to look at *Remote Sensor Data*.")

---

## User Flows

### Flow A: Filter-Driven Discovery (Top-Down)
*The user starts by defining **context** in the subheader.*

1.  **Action**: User selects a **Category** (e.g., "Ecological") and/or **Tags** in the top subheader.
2.  **System Response**: The left sidebar automatically filters the **Data Type Cards**.
    *   **Active Cards**: Data sources that contain data matching the selected filters float to the top.
    *   **Inactive Cards**: Data sources that contain *no* data for the current filters are grayed out and moved to the bottom.
3.  **Result**: The user immediately sees which datasets are relevant to their query without having to guess.

### Flow B: Source-Driven Discovery (Bottom-Up)
*The user starts by selecting **content** in the sidebar.*

1.  **Action**: User clicks a **Data Type Card** in the left sidebar (e.g., "Wildlife Observations" or "Remote Sensor Data").
2.  **System Response**:
    *   The application transitions to that specific Data View (e.g., the iNaturalist exploration pane).
    *   **Guidance**: If the user hasn't set any filters yet, the relevant filter dropdowns in the subheader (like "Time Range" or "Spatial Filter") visually pulse or highlight.
    *   **Constraints**: The filter options in the subheader update to show only what is relevant for the selected Data Type.
3.  **Result**: The user is guided to refine their broad selection into a specific query.

---

## Key UI Experience Changes

### 1. The New Filter Subheader
*   **Removed**: The "Data Source" dropdown is gone.
*   **Added**: A **"Tags"** dropdown appears after "Category".
    *   *Why?* This allows for fine-grained filtering (e.g., Category: "Ecological" -> Tag: "Invasive Species") which helps narrow down the Data Type cards in the sidebar.
*   **Order**: Category → Tags → Spatial Filter → Time Range.

### 2. The "Data Catalog" Sidebar (Home View)
*   Instead of defaulting to a specific tool (like the iNaturalist list), the sidebar defaults to a **Data Catalog** view.
*   **Visuals**: Large, readable cards representing each data source (e.g., "Remote Sensors", "Wildlife", "Plants", "Map Layers").
*   **Navigation**:
    *   Selecting a card enters that Data View.
    *   A **"Back"** button in specific Data Views returns to this Catalog.

### 3. Visual Feedback Loops
*   **"Graying Out"**: We visually communicate absence of data. If a user filters for "Last 24 Hours", historical datasets like "2005 LiDAR" effectively disappear from the list.
*   **"Blinking Highlights"**: We visually guide required actions. If a data source *requires* a spatial filter to be useful, that filter input will draw attention to itself upon source selection.
