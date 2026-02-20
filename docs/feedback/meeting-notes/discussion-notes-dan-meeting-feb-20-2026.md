# Discussion Notes: Dan Meeting — Feb 20, 2026

**Meeting Date:** Feb 20, 2026  
**Source Transcript:** Dan Meeting & Feedback Feb 20 at 11_02 AM.txt  
**Participants:** Dan (ArcGIS Enterprise backend), Will  
**Purpose of This Document:** Capture open-ended conversations that raised ideas, questions, or future directions — but are not yet concrete, scoped tasks. Use this as input when planning future phases or when picking up these threads in future meetings.

---

## 1. Jupyter Notebooks / Python API Access

**Context:** Will and Trisalyn had discussed Jupyter notebooks as a potential next major feature. Dan shared his own perspective on what this should actually mean in practice.

**Dan's vision:** A researcher who wants to access real-time Dendra data (or other catalog data) without downloading it would want a template showing how to query the API. Specifically:
- What packages are needed (e.g., `requests`, data formatting libraries)
- How to structure the request (station ID, data stream, date range)
- How to access real-time data in their own scripts

Dan imagined this as a code snippet or template — not a running notebook environment inside the app. The analogy he used: like a coding tutorial site that shows "here's how you do it" with runnable examples.

**Will's framing:** Two distinct options on the table:
1. **Auto-generate Python code** — In the Export Builder, generate a copy-pasteable Python snippet for the current filter state. Researcher takes it away and runs it in their own environment. Lower effort, high utility.
2. **In-app Jupyter notebook environment** — Let users run Python directly in the catalog. Dan noted this might be a security concern and questioned whether it adds utility beyond option 1.

**Agreed direction:** Option 1 (auto-generate Python code in Export Builder) is the right first step. It's lower-hanging fruit, lower risk, and directly useful to researchers accessing live data. Option 2 is not worth the complexity unless there's a clear research need articulated by Amy/Trisalyn/Kelly.

**Possible future stage 2:** An LLM that has access to the Python code templates and can write API queries for you. Will referenced a demo from a meeting with Kelly and Sophia where an LLM queried multiple data sources and ran analysis — called it "honestly sick." Dan agreed this would be genuinely useful. Will's proposed roadmap: auto-gen Python code → LLM that writes the Python for you.

**ArcGIS Notebook Server tangent:** Dan mentioned ArcGIS Enterprise includes a Notebook Server that can host Jupyter-style environments on TNC's own servers. Discussed briefly but Will felt this is a lot of infrastructure work for marginal benefit over just giving people code templates. Not pursued further.

**Open questions:**
- What exactly does Trisalyn/Amy have in mind for Jupyter notebooks? The meeting felt like they hadn't fully defined it either.
- Is there a real researcher need for running code in-app, or is a code template sufficient?
- If we do the LLM route eventually, what data sources should it have access to first?

---

## 2. Monitoring / Anomaly Detection Feature

**Context:** Will and Trisalyn had discussed a monitoring/alert feature as the #1 next major feature (after finishing current data source work). Will wanted to get Dan's thoughts on what that should look like.

**Dan's feedback was deferred** — Will asked Dan to think about it over the week and come back with thoughts by next week. Questions Will asked Dan to think through:
- Where should the notification bell/alert UI live? (Header? Footer? Right sidebar? New dashboard page? Dropdown widget?)
- How should alerts interact with the map? (Does clicking an alert fly to a location? Does it open a layer?)
- What kinds of anomalies would Dan personally want to be alerted to?
- Should it be a new page, a drop-down, a widget?

**What Will already described to Dan:** The core concept (from Trisalyn's meeting) — a bell icon with count badge, clicking it opens a dedicated Alerts page or dropdown listing recent anomaly events. Trisalyn's framing: "an early warning system for changes in the landscape — finding weird things you wouldn't know to look for."

**Species-based monitoring concepts already discussed with Trisalyn:**
- iNaturalist: historical observation polygon per species; observations outside polygon = novel occurrence alert
- ANiML: flag species never before seen at a camera trap, or unusual frequency shifts

**Status:** No concrete design decisions yet. Dan to send thoughts next week.

---

## 3. 3D / Dynamic Visualization

**Context:** Will mentioned that in his meeting with Jack Dangermond, "dynamic" was mentioned repeatedly. Trisalyn agreed that 3D eye candy is compelling for the Dangermond presentation but must be grounded in a research purpose.

**Tradeoff framed by Will:** 3D visualization vs. Jupyter notebooks as the "next big feature" after monitoring. Trisalyn's framing: "If the video game helps us do science, let's do it. If it doesn't, we're not doing a video game."

**Dan's perspective:** True 3D with predictive modeling probably belongs in a different (future) sister platform — the full Digital Twin, not the current Data Catalog. The catalog has more limited 3D scope. However, there are some meaningful 3D-ish things that could be done in the catalog:

**Concept 1: Real-time sensor weather overlays**  
Animate or display real-time sensor readings directly on the map. Examples Dan suggested:
- **Wind sensors:** Animated arrows showing wind direction + speed at each station location, similar to a weather map. "Here's what the wind is doing right now."
- **Rain gauges:** Dry/mist/heavy rain icon at each gauge showing latest reading.
- **Weather stations:** Thermometer icon with current temperature at each station plotted on map. Allow user to select which sensor type to visualize across all stations simultaneously.
- **Possible argument for this:** It makes the case for looking at data streams across all stations simultaneously, which Dan noted would be a useful feature even outside the 3D context.

**Concept 2: 3D water well depth visualization**  
Will mentioned he had already built 3D cylinders for water wells (dynamically generated, height = well depth). Dan reacted positively: "That'd be a great visualization for groundwater levels — a 3D viz where you can see the depths." This would be a strong demo piece for Dangermond because water well data is one of the key live data assets at the preserve.

**Concept 3: Scene viewer / draping 2D polygons over 3D terrain**  
Will proposed: swap the 2D map scene viewer for an ArcGIS 3D scene viewer, then drape existing 2D polygon layers (vegetation, fire perimeters, etc.) over a 3D terrain model using elevation data. This would be low-hanging fruit if ArcGIS JS API supports it with minimal code changes. Would provide "depth" to existing data without needing new data sources.

**Concept 4: MODIS radio telemetry (future data source)**  
Trisalyn mentioned this in an earlier meeting (not discussed in depth here). Would show animal movement over time — birds/tagged species moving across the preserve. "Things that move" is what makes 3D dynamic and meaningful to researchers. Not yet implemented; worth tracking as a future data source.

**Open questions:**
- Is swapping the 2D scene viewer for a 3D scene viewer technically feasible without breaking existing layer rendering?
- Which 3D concept would have the most research value vs. demo/eye-candy value?
- Dan suggested the current catalog might not be the right home for full 3D — does Will want to test this out anyway as a proof of concept?
- Should we prototype the 3D water well visualization first since it's the most clearly useful and is partially built?

**Status:** No decisions made. Both Will and Dan are still thinking about what "3D + dynamic + useful to researchers" means in the catalog context. Will's directive to Dan: come back next week with thoughts on 3D (same ask as monitoring).

---

## 4. Right Sidebar — Default Tab (Overview vs Browse)

**Context:** Will raised the question of whether the first thing shown in the right sidebar should be the Overview tab or the Browse tab.

**Will's hypothesis:** Users aren't naturally gravitating toward the right sidebar because they're focused on the left sidebar when exploring layers. By the time they need to interact with the right sidebar, they may not know what the Browse tab can do. He wondered if defaulting to Browse would make the functionality more discoverable.

**Dan's reaction:** He actually liked the current overview-first flow. The big green "Browse Stations" button in the overview felt like a natural call-to-action to him. His issue wasn't the tab order — it was that his eyes were on the left sidebar and the map, not the right side of the screen.

**Dan's suggestion (unprompted):** What if automatically showing a chart in the right sidebar when a layer is selected would draw his eye to it? "I'd be like, oh what's this chart?" This is more of a discoverability concept than a tab order change.

**No decision made.** Current state (overview first) retained. If future UX testing suggests it's still a problem, revisit whether a chart preview or other auto-loaded content in the right sidebar could improve discoverability.

---

## 5. Amy's Layer Categorization Document

**Context:** Dan mentioned Amy and he had been working on a doc with the current categorization of map layers, ordered by usefulness based on survey results.

**Amy's proposed layer category order:** Boundaries → Infrastructure → Species → Land Cover → Sensor Equipment → (rest)

**Amy's UI comments:** Dan said there are comments in the doc directed at Will's frontend work (specifically around the legend and maybe interacting with it incorrectly). Will said he'd take a look.

**Dan's role:** Dan will handle re-categorizing and re-ordering layers on the ArcGIS Enterprise side. The frontend code should automatically reflect whatever Dan does in the layer management app.

**Status:** Dan has the doc / is working on it. Will needs to review Amy's UI-specific comments when Dan shares the document.

---

## 6. UI Density / Screen Size Concern

**Context:** Dan raised that on his laptop, the UI feels very crowded with both sidebars + map visible. Will acknowledged this is primarily developed for desktop but noted the issue.

**Ideas discussed:**
- A tooltip or initial modal on small screens suggesting the user zoom out (Cmd + - / browser zoom) for a better experience
- A settings icon allowing users to adjust font size, panel sizes (Kindle-like)
- Dan ultimately concluded font size is probably fine — people who need larger text know how to increase browser zoom

**Conclusion:** Not a priority right now. Right sidebar collapse (D20-01) and left sidebar collapse (D20-13) address the most acute screen real estate concerns. No settings panel or adaptive font sizing planned at this time.
