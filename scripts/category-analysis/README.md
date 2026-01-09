# ArcGIS Hub Category Analysis

## Purpose

This folder contains scripts to analyze the current tags and categories in TNC's ArcGIS Hub and generate mappings to the official 13 TNC data categories.

## Key Findings

**✅ The ArcGIS Hub is already using the new TNC category labels!**

The 15 categories found in ArcGIS Hub are:
- **13 Official TNC Categories** (all present)
- 2 Status flags: "Beta" and "General Availability" (can be ignored)

This means that items in ArcGIS Hub already have the correct `categories` field values. Our frontend just needs to:
1. Update the display labels in the UI (dropdown, icons, etc.)
2. Update the tag mappings to work with the new category names

## Files

- `analyze-arcgis-tags.js` - Script that fetches all items from ArcGIS Hub and analyzes their tags/categories
- `analysis-output.txt` - Full output from the analysis run
- `suggested-mappings.json` - Generated JSON structure ready for `category_mappings.json`

## Statistics

From the analysis run:
- **Total items analyzed:** 105
- **Unique tags:** 306
- **Unique categories:** 15 (13 TNC + 2 status flags)

## Next Steps

1. Use `suggested-mappings.json` as the base for updating `src/data-sources/tnc-arcgis/category_mappings.json`
2. Review the unmapped tags list and assign them to appropriate categories
3. Update the UI components to display the new category names

