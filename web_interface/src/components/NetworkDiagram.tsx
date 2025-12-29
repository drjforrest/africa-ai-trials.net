'use client';

import data from '@/data/network-data.json';
import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutType } from './LayoutControls';

interface Node {
  id: string;
  originalId?: string;
  title: string;
  type: 'institution' | 'company' | 'clinical_trial' | 'funder';
  country: string;
  city?: string;
  year: number;
  category: string;
  sector?: string; // For institutions: 'Academia', 'Funder', 'Industry', 'Government'
  
  // Institution specific
  specialization?: string;
  size?: string;
  
  // Company specific  
  focus?: string;
  technology?: string;
  
  // Clinical trial specific
  status?: string;
  condition?: string;
  sampleSize?: number;
  
  // Legacy fields for compatibility
  author?: string;
  citations?: number;
  keywords?: string[];
  abstract?: string;
  
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type?: string;
  strength?: string;
  fundingAmount?: number;
  fundingType?: string;
  hasPersonnelExchange?: boolean;
  hasTechTransfer?: boolean;
}

interface NetworkDiagramProps {
  year: number;
  searchTerm?: string;
  selectedTypes?: string[];
  selectedCountries?: string[];
  onNodeClick?: (node: typeof import('@/data/network-data.json').nodes[0]) => void;
  layout?: LayoutType;
  forceStrength?: number;
  linkDistance?: number;
  colorBy?: 'year' | 'category' | 'type' | 'country';
  selectedCategories?: string[];
}

const NetworkDiagram: React.FC<NetworkDiagramProps> = ({ 
  year, 
  searchTerm = '', 
  selectedTypes = [],
  selectedCountries = [],
  onNodeClick,
  layout = 'force',
  forceStrength = -200,
  linkDistance = 80,
  colorBy = 'type',
  selectedCategories = []
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ node: Node; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 800;
    const height = 600;

    svg.attr('width', width).attr('height', height);
    
    // Early return if no data
    if (!data || !data.nodes || data.nodes.length === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .text('No network data available');
      return;
    }

    // Apply filters
    let filteredNodes = data.nodes.filter(node => node.year <= year);
    
    // Search filter
    if (searchTerm) {
      filteredNodes = filteredNodes.filter(node => {
        const searchLower = searchTerm.toLowerCase();
        const nodeWithFocus = node as Node & { focus?: string };
        return (
          node.title.toLowerCase().includes(searchLower) ||
          node.country.toLowerCase().includes(searchLower) ||
          node.type.toLowerCase().includes(searchLower) ||
          (node.specialization && node.specialization.toLowerCase().includes(searchLower)) ||
          (nodeWithFocus.focus && nodeWithFocus.focus.toLowerCase().includes(searchLower)) ||
          (node.condition && node.condition.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Type filter
    if (selectedTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedTypes.includes(node.type)
      );
    }
    
    // Country filter
    if (selectedCountries.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedCountries.some(country => node.country.includes(country))
      );
    }
    
    // Category filter
    if (selectedCategories.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedCategories.includes(node.category)
      );
    }
    
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredLinks = (data.links || []).filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    // Calculate node degrees for sizing (degree centrality)
    const nodeDegrees = new Map<string, number>();
    filteredNodes.forEach(node => nodeDegrees.set(node.id, 0));
    filteredLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as Node).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as Node).id;
        nodeDegrees.set(sourceId, (nodeDegrees.get(sourceId) || 0) + 1);
        nodeDegrees.set(targetId, (nodeDegrees.get(targetId) || 0) + 1);
    });
    
    // Calculate degree centrality (normalized by max degree)
    const maxDegree = Math.max(...Array.from(nodeDegrees.values()), 1);
    const degreeCentrality = new Map<string, number>();
    nodeDegrees.forEach((degree, nodeId) => {
        degreeCentrality.set(nodeId, degree / maxDegree);
    });

    // Apply different layout algorithms
    let simulation: d3.Simulation<Node, undefined>;
    
    if (layout === 'force') {
        // Match static figure layout: spring layout with k=0.5, iterations=50, seed=42
        // Using D3 force simulation with similar parameters
        // Initialize positions deterministically based on node IDs for reproducibility
        filteredNodes.forEach((node, i) => {
          // Use a simple hash of node ID for deterministic initial positions
          const hash = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          (node as Node).x = (hash % width) * 0.8 + width * 0.1;
          (node as Node).y = ((hash * 7) % height) * 0.8 + height * 0.1;
        });
        
        simulation = d3.forceSimulation(filteredNodes as Node[])
          .force('link', d3.forceLink(filteredLinks).id((d: any) => (d as Node).id).distance(80))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(25))
          .alphaDecay(0.02) // Slower decay for more iterations
          .alpha(1) // Start with full alpha
          .restart();
    } else if (layout === 'circular') {
        const radius = Math.min(width, height) / 2 - 50;
        filteredNodes.forEach((node, i) => {
          const angle = (i / filteredNodes.length) * 2 * Math.PI;
          (node as Node).fx = width / 2 + radius * Math.cos(angle);
          (node as Node).fy = height / 2 + radius * Math.sin(angle);
        });
        simulation = d3.forceSimulation(filteredNodes as Node[])
          .force('link', d3.forceLink(filteredLinks).id((d: any) => (d as Node).id).distance(linkDistance / 2));
    } else if (layout === 'hierarchical') {
        const hierarchy = d3.stratify<Node>()
          .id(d => d.id)
          .parentId(() => null)(filteredNodes as Node[]);
        
        const tree = d3.tree<Node>().size([width - 100, height - 100]);
        tree(hierarchy);
        
        filteredNodes.forEach(node => {
          const treeNode = hierarchy.descendants().find(d => d.id === node.id);
          if (treeNode) {
            (node as Node).fx = (treeNode.x || 0) + 50;
            (node as Node).fy = (treeNode.y || 0) + 50;
          }
        });
        
        simulation = d3.forceSimulation(filteredNodes as Node[])
          .force('link', d3.forceLink(filteredLinks).id((d: any) => (d as Node).id).distance(linkDistance / 3));
    } else { // grid
        const cols = Math.ceil(Math.sqrt(filteredNodes.length));
        const cellWidth = width / cols;
        const cellHeight = height / Math.ceil(filteredNodes.length / cols);
        
        filteredNodes.forEach((node, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          (node as Node).fx = col * cellWidth + cellWidth / 2;
          (node as Node).fy = row * cellHeight + cellHeight / 2;
        });
        
        simulation = d3.forceSimulation(filteredNodes as Node[])
          .force('link', d3.forceLink(filteredLinks).id((d: any) => (d as Node).id).distance(linkDistance / 4));
    }

    const container = svg.append('g');

    // Color function matching static figure
    // Trials: light gray circles
    // Institutions: squares colored by sector (Academia=blue, Funders=purple, Industry=orange, Government=red)
    const getNodeColor = (d: Node): string => {
        if (d.type === 'clinical_trial') {
          return '#E8E8E8'; // Light gray for trials
        }
        
        // For institutions, funders, and companies, use sector
        // Companies default to Industry if no sector specified
        const sector = d.sector || (d.type === 'funder' ? 'Funder' : (d.type === 'company' ? 'Industry' : ''));
        
        switch (sector) {
          case 'Academia':
            return '#2E86AB'; // Blue
          case 'Funder':
            return '#A23B72'; // Purple
          case 'Industry':
            return '#F18F01'; // Orange
          case 'Government':
            return '#C73E1D'; // Red
          default:
            return '#666666'; // Gray fallback
        }
    };
    
    // Color scales based on colorBy prop (for other modes)
    let colorScale: (d: Node) => string;
    
    if (colorBy === 'year') {
        const minYear = Math.min(...filteredNodes.map(n => n.year));
        const maxYear = Math.max(...filteredNodes.map(n => n.year));
        const yearScale = d3.scaleSequential()
          .domain([minYear, maxYear])
          .interpolator(d3.interpolateViridis);
        colorScale = (d: Node) => yearScale(d.year);
    } else if (colorBy === 'type') {
        // Use sector-based coloring for institutions, default for others
        colorScale = getNodeColor;
    } else if (colorBy === 'country') {
        const countries = [...new Set(filteredNodes.map(n => n.country))];
        const countryScale = d3.scaleOrdinal()
          .domain(countries)
          .range(d3.schemeSet3);
        colorScale = (d: Node) => countryScale(d.country) as string;
    } else { // category
        const categories = [...new Set(filteredNodes.map(n => n.category))];
        const categoryScale = d3.scaleOrdinal()
          .domain(categories)
          .range(d3.schemeCategory10);
        colorScale = (d: Node) => categoryScale(d.category) as string;
    }

    const link = container.append('g')
        .selectAll('line')
        .data(filteredLinks)
        .join('line')
        .attr('stroke', '#999999') // Light gray edges matching static figure
        .attr('stroke-opacity', 0.2) // Low opacity matching static figure
        .attr('stroke-width', 0.5); // Thin edges matching static figure

    // Separate trials (circles) and institutions (squares) - all non-trial types are squares
    const trialNodes = filteredNodes.filter(n => n.type === 'clinical_trial');
    const institutionNodes = filteredNodes.filter(n => 
        n.type === 'institution' || n.type === 'funder' || n.type === 'company'
    );
    
    // Helper function for node size calculation (matching publication: min 200, max 2000, scaled to pixels)
    // Publication uses same base calculation for all nodes, then trials get 0.6x multiplier
    const getNodeSize = (nodeId: string, isTrial: boolean = false): number => {
        const centrality = degreeCentrality.get(nodeId) || 0;
        const MIN_SIZE = 10;  // Screen-appropriate min size (matches publication ratio)
        const MAX_SIZE = 25;  // Screen-appropriate max size (matches publication ratio)
        let size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * centrality;
        
        // Trials slightly smaller (0.6x as per publication figure)
        if (isTrial) {
          size *= 0.6;
        }
        
        return size;
    };

    // Draw trial nodes as circles (gray)
    const trialCircles = container.append('g')
        .selectAll('circle')
        .data(trialNodes)
        .join('circle')
        .attr('r', d => getNodeSize(d.id, true))
        .attr('fill', '#E8E8E8') // Light gray
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.7)
        .style('cursor', 'pointer')
        .call(drag(simulation) as any)
        .on('mouseover', (event, d) => {
          const [x, y] = d3.pointer(event, svg.node());
          setTooltip({ node: d as any, x, y });
        })
        .on('mouseout', () => setTooltip(null))
        .on('click', (event, d) => {
          if (onNodeClick) onNodeClick(d as any);
        });
    
    // Draw institution nodes as squares (colored by sector)
    const institutionSquares = container.append('g')
        .selectAll('rect')
        .data(institutionNodes)
        .join('rect')
        .attr('width', d => getNodeSize(d.id, false))
        .attr('height', d => getNodeSize(d.id, false))
        .attr('x', d => {
          const size = getNodeSize(d.id, false);
          return -size / 2;
        })
        .attr('y', d => {
          const size = getNodeSize(d.id, false);
          return -size / 2;
        })
        .attr('fill', (d: any) => getNodeColor(d as Node))
        .attr('stroke', '#000000')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .call(drag(simulation) as any)
        .on('mouseover', (event, d) => {
          const [x, y] = d3.pointer(event, svg.node());
          setTooltip({ node: d as any, x, y });
        })
        .on('mouseout', () => setTooltip(null))
        .on('click', (event, d) => {
          if (onNodeClick) onNodeClick(d as any);
        });

    // Add labels for institutions with degree > 5 (matching static figure)
    // Labels positioned slightly above nodes (y - offset) as per publication
    const highDegreeInstitutions = institutionNodes.filter(n => 
        (nodeDegrees.get(n.id) || 0) > 5
    );
    
    const labels = container.append('g')
        .selectAll('text')
        .data(highDegreeInstitutions)
        .join('text')
        .text(d => d.title.substring(0, 30)) // Truncate to 30 chars as per publication
        .attr('font-size', '8px')
        .attr('text-anchor', 'middle')
        .attr('dy', d => {
          const size = getNodeSize(d.id, false);
          return -size / 2 - 12; // Position above node (negative offset)
        })
        .attr('pointer-events', 'none')
        .attr('fill', '#000')
        .attr('font-weight', 'bold');

    simulation.on('tick', () => {
        link
          .attr('x1', (d: Link) => (d.source as Node).x || 0)
          .attr('y1', (d: Link) => (d.source as Node).y || 0)
          .attr('x2', (d: Link) => (d.target as Node).x || 0)
          .attr('y2', (d: Link) => (d.target as Node).y || 0);

        trialCircles
          .attr('cx', (d: any) => (d as Node).x || 0)
          .attr('cy', (d: any) => (d as Node).y || 0);

        institutionSquares
          .attr('x', (d: any) => {
            const node = d as Node;
            const size = getNodeSize(node.id, false);
            return (node.x || 0) - size / 2;
          })
          .attr('y', (d: any) => {
            const node = d as Node;
            const size = getNodeSize(node.id, false);
            return (node.y || 0) - size / 2;
          });

        labels
          .attr('x', (d: any) => (d as Node).x || 0)
          .attr('y', (d: any) => (d as Node).y || 0);
    });

    // Add legend matching static figure
    const legend = container.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 200}, 20)`);
    
    const legendItems = [
        { label: 'Clinical Trials', shape: 'circle', color: '#E8E8E8', isCircle: true },
        { label: 'Academia', shape: 'square', color: '#2E86AB', isCircle: false },
        { label: 'Funders', shape: 'square', color: '#A23B72', isCircle: false },
        { label: 'Industry', shape: 'square', color: '#F18F01', isCircle: false },
        { label: 'Government', shape: 'square', color: '#C73E1D', isCircle: false }
    ];
    
    legendItems.forEach((item, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        if (item.isCircle) {
          legendItem.append('circle')
            .attr('r', 8)
            .attr('fill', item.color)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.7);
        } else {
          legendItem.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('x', -6)
            .attr('y', -6)
            .attr('fill', item.color)
            .attr('stroke', '#000000')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8);
        }
        
        legendItem.append('text')
          .attr('x', 15)
          .attr('y', 4)
          .attr('font-size', '11px')
          .attr('fill', '#000')
          .text(`${item.label} (${item.shape}s)`);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          container.attr('transform', event.transform);
        });

    // Apply initial zoom to show entire network
    const initialScale = 0.5; // Start at 50% zoom to show more of the network
    svg.call(zoom.transform, d3.zoomIdentity.scale(initialScale).translate(width * 0.25 / initialScale, height * 0.25 / initialScale));
    
    svg.call(zoom);
  }, [year, searchTerm, selectedTypes, selectedCountries, layout, forceStrength, linkDistance, colorBy, selectedCategories]);

  const drag = (simulation: d3.Simulation<Node, undefined>) => {
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement | SVGRectElement, Node, unknown>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement | SVGRectElement, Node, unknown>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement | SVGRectElement, Node, unknown>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag<SVGCircleElement | SVGRectElement, Node>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }


  return (
    <div className="relative">
      <svg ref={ref} />
      {tooltip && (
        <div
          className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none z-10 max-w-xs"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          <div className="font-semibold text-sm mb-1">{tooltip.node.title}</div>
          <div className="text-xs text-gray-300">
            <div>Type: {tooltip.node.type.replace('_', ' ')}</div>
            <div>Country: {tooltip.node.country}</div>
            {tooltip.node.city && <div>City: {tooltip.node.city}</div>}
            <div>Year: {tooltip.node.year}</div>
            <div>Category: {tooltip.node.category}</div>
            
            {tooltip.node.type === 'institution' && (
              <>
                {tooltip.node.specialization && <div>Specialization: {tooltip.node.specialization}</div>}
                {tooltip.node.size && <div>Size: {tooltip.node.size}</div>}
              </>
            )}
            
            {tooltip.node.type === 'company' && (
              <>
                {tooltip.node.focus && <div>Focus: {tooltip.node.focus}</div>}
                {tooltip.node.technology && <div>Technology: {tooltip.node.technology}</div>}
              </>
            )}
            
            {tooltip.node.type === 'clinical_trial' && (
              <>
                {tooltip.node.status && <div>Status: {tooltip.node.status}</div>}
                {tooltip.node.condition && <div>Condition: {tooltip.node.condition}</div>}
                {tooltip.node.sampleSize && <div>Sample Size: {tooltip.node.sampleSize}</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkDiagram;