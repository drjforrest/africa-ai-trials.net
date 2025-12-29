# Aligning Next.js Network Diagram with Publication Figure

Matching the interactive Next.js visualization to the Lancet publication figure.

---

## Publication Figure Styling (from visualize_network_N11.py)

### Node Colors

```typescript
const COLORS = {
  trial: "#E8E8E8", // Light gray - Clinical trials
  academia: "#2E86AB", // Blue - Academic institutions
  funder: "#A23B72", // Purple - Funding organizations
  industry: "#F18F01", // Orange - Industry partners
  government: "#C73E1D", // Red - Government institutions
};
```

### Node Shapes

- **Trials**: Circles (○)
- **Institutions**: Squares (□) - all types

### Node Sizes

```python
# Python calculation (degree centrality based)
min_size = 200
max_size = 2000
size = min_size + (max_size - min_size) * degree_centrality

# Trial nodes: size * 0.6 (slightly smaller)
```

### Edge Styling

```python
alpha = 0.2          # 20% opacity
width = 0.5          # Thin lines
color = gray/black   # Subtle
```

### Labels

- **Only show** institutions with degree > 5
- **Font size**: 8pt
- **Font weight**: Bold
- **Position**: Slightly above node (y + 0.02)

### Layout

- **Algorithm**: Spring layout (force-directed)
- **Parameters**: k=0.5, iterations=50, seed=42
- **Canvas**: 20x16 (aspect ratio 1.25)

---

## Current Next.js Issues (Likely)

Based on typical D3.js defaults, your Next.js version probably has:

❌ Different colors (D3 default color schemes)  
❌ All nodes same shape (circles)  
❌ All nodes same size OR different size calculation  
❌ Thicker, darker edges  
❌ Labels on all nodes OR no labels  
❌ Different force parameters

---

## Fixes for NetworkDiagram.tsx

### 1. Update Color Mapping

Replace the color logic around line 100-150 with:

```typescript
// Publication colors
const getNodeColor = (node: Node): string => {
  if (node.type === "clinical_trial") {
    return "#E8E8E8"; // Light gray for trials
  }

  // Institution colors by sector
  switch (node.sector) {
    case "Academia":
      return "#2E86AB"; // Blue
    case "Funder":
      return "#A23B72"; // Purple
    case "Industry":
      return "#F18F01"; // Orange
    case "Government":
      return "#C73E1D"; // Red
    default:
      return "#999999"; // Fallback gray
  }
};
```

### 2. Update Node Shapes

Around line 200-250, change node rendering:

```typescript
// Draw nodes with shapes based on type
const nodeGroup = svg
  .selectAll(".node")
  .data(filteredNodes)
  .enter()
  .append("g")
  .attr("class", "node");

nodeGroup.each(function (d: Node) {
  const g = d3.select(this);

  if (d.type === "clinical_trial") {
    // Circles for trials
    g.append("circle")
      .attr("r", (d: Node) => Math.sqrt(getNodeSize(d)))
      .attr("fill", getNodeColor(d))
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7);
  } else {
    // Squares for institutions
    const size = Math.sqrt(getNodeSize(d)) * 1.5; // Slightly larger
    g.append("rect")
      .attr("width", size)
      .attr("height", size)
      .attr("x", -size / 2)
      .attr("y", -size / 2)
      .attr("fill", getNodeColor(d))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);
  }
});
```

### 3. Update Node Sizing

Replace size calculation:

```typescript
const getNodeSize = (
  node: Node,
  degreeCentrality: Map<string, number>
): number => {
  const MIN_SIZE = 200;
  const MAX_SIZE = 2000;

  const centrality = degreeCentrality.get(node.id) || 0;
  let size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * centrality;

  // Trials slightly smaller
  if (node.type === "clinical_trial") {
    size *= 0.6;
  }

  return size;
};
```

### 4. Update Edge Styling

Around line 180-200:

```typescript
// Draw edges (before nodes so they appear behind)
svg
  .selectAll(".link")
  .data(filteredLinks)
  .enter()
  .append("line")
  .attr("class", "link")
  .attr("stroke", "#999") // Gray
  .attr("stroke-opacity", 0.2) // 20% opacity
  .attr("stroke-width", 0.5); // Thin
```

### 5. Update Label Logic

Only show labels for high-degree institutions:

```typescript
// Calculate degrees
const degrees = new Map<string, number>();
filteredNodes.forEach((node) => {
  const degree = filteredLinks.filter(
    (l) => l.source === node.id || l.target === node.id
  ).length;
  degrees.set(node.id, degree);
});

// Only label institutions with degree > 5
const labeledNodes = filteredNodes.filter(
  (node) => node.type !== "clinical_trial" && (degrees.get(node.id) || 0) > 5
);

// Draw labels
svg
  .selectAll(".label")
  .data(labeledNodes)
  .enter()
  .append("text")
  .text((d) => d.title.substring(0, 30)) // Truncate long names
  .attr("text-anchor", "middle")
  .attr("dy", -15) // Position above node
  .attr("font-size", "8px")
  .attr("font-weight", "bold")
  .attr("fill", "black");
```

### 6. Update Force Simulation Parameters

Match the Python spring layout:

```typescript
const simulation = d3
  .forceSimulation(filteredNodes as any)
  .force("charge", d3.forceManyBody().strength(-200)) // Repulsion
  .force(
    "link",
    d3
      .forceLink(filteredLinks)
      .id((d: any) => d.id)
      .distance(80)
  ) // Link distance
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(30)) // Prevent overlap
  .alpha(1) // Start intensity
  .alphaDecay(0.02) // Slower cooling
  .on("tick", ticked);
```

---

## Complete Updated Component Structure

```typescript
"use client";

import data from "@/data/network-data.json";
import * as d3 from "d3";
import React, { useEffect, useRef } from "react";

// Publication colors
const COLORS = {
  trial: "#E8E8E8",
  academia: "#2E86AB",
  funder: "#A23B72",
  industry: "#F18F01",
  government: "#C73E1D",
  default: "#999999",
};

const getNodeColor = (node: Node): string => {
  if (node.type === "clinical_trial") return COLORS.trial;

  switch (node.sector) {
    case "Academia":
      return COLORS.academia;
    case "Funder":
      return COLORS.funder;
    case "Industry":
      return COLORS.industry;
    case "Government":
      return COLORS.government;
    default:
      return COLORS.default;
  }
};

const getNodeSize = (node: Node, centrality: number): number => {
  const MIN_SIZE = 5; // Adjust for screen vs print
  const MAX_SIZE = 20;

  let size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * centrality;

  if (node.type === "clinical_trial") {
    size *= 0.6;
  }

  return size;
};

// ... rest of component
```

---

## Quick Test Checklist

After updating NetworkDiagram.tsx:

- [ ] Trials are gray circles
- [ ] Institutions are colored squares (blue/purple/orange/red)
- [ ] Node sizes vary by degree centrality
- [ ] Trials slightly smaller than institutions
- [ ] Edges are thin (0.5px), light gray, 20% opacity
- [ ] Only high-degree institutions (>5 connections) have labels
- [ ] Labels are bold, 8pt, positioned above nodes
- [ ] Force layout feels similar (not too tight/loose)

---

## Alternative: Use Static Image

If dynamic matching is too complex, you can simply:

1. **Copy publication figure** to `web_interface/public/figures/`
2. **Display as static image** with zoom/pan controls
3. **Add interactive filters** that highlight regions of the static image

This preserves exact publication styling while adding interactivity.

---

## Example: Hybrid Approach

```typescript
<div className="network-container">
  {showStaticVersion ? (
    <div className="static-network">
      <Image
        src="/figures/network_diagram_N11.png"
        alt="Network diagram"
        width={1600}
        height={1280}
        className="zoomable-image"
      />
      <FilterOverlay nodes={filteredNodes} />
    </div>
  ) : (
    <NetworkDiagram layout="force" colorBy="sector" {...props} />
  )}
  <button onClick={() => setShowStaticVersion(!showStaticVersion)}>
    Toggle {showStaticVersion ? "Interactive" : "Static"} View
  </button>
</div>
```

This gives users both: publication-quality static figure AND interactive exploration.

---

## Priority Fixes (Most Visual Impact)

1. ✅ **Colors** - Biggest visual difference
2. ✅ **Shapes** - Circles vs squares is very noticeable
3. ✅ **Edge opacity** - Makes huge difference in readability
4. ✅ **Labels** - Only high-degree nodes
5. ⚠️ **Sizes** - Can be adjusted by eye
6. ⚠️ **Force parameters** - Fine-tune after above fixes

Start with colors, shapes, and edge styling - those alone will get you 80% of the way there!
