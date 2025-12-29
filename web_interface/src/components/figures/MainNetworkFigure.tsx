'use client';

import data from '@/data/network-data.json';
import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  originalId: string;
  title: string;
  type: string;
  country: string;
  city?: string;
  year?: number;
  foundingYear?: number;
  category?: string;
  specialization?: string;
  size?: string;
  focus?: string;
  technology?: string;
  sampleSize?: number;
  status?: string;
  diseaseArea?: string;
  phase?: string;
  startDate?: string;
  endDate?: string;
  x?: number;
  y?: number;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
  type: string;
  strength: string;
  fundingAmount: number;
  fundingType: string;
  hasPersonnelExchange: boolean;
  hasTechTransfer: boolean;
  startDate: string;
  endDate: string;
}

interface MainNetworkFigureProps {
  width?: number;
  height?: number;
  title?: string;
}

const MainNetworkFigure: React.FC<MainNetworkFigureProps> = ({ 
  width = 800, 
  height = 600,
  title = "African AI Healthcare Research Network"
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Filter to core network entities (excluding funders for cleaner visualization)
    const coreNodes = data.nodes.filter(node => node.type !== 'funder') as NetworkNode[];
    const coreLinks = data.links.filter(link => {
      const sourceInCore = coreNodes.some(n => n.id === link.source);
      const targetInCore = coreNodes.some(n => n.id === link.target);
      return sourceInCore && targetInCore;
    }) as unknown as NetworkLink[];

    // Create scales
    const nodeColorScale = d3.scaleOrdinal<string>()
      .domain(['institution', 'company', 'clinical_trial'])
      .range(['#10b981', '#f59e0b', '#3b82f6']);

    const nodeSizeScale = d3.scaleLinear()
      .domain([0, d3.max(coreNodes, d => d.sampleSize || 10) || 10])
      .range([6, 20]);

    // Create simulation
    const simulation = d3.forceSimulation<NetworkNode>(coreNodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(coreLinks).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    // Create container
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Apply initial zoom to show entire network
    const initialScale = 0.6; // Start at 60% zoom to show more of the network
    svg.call(zoom.transform, d3.zoomIdentity.scale(initialScale).translate(width * 0.2 / initialScale, height * 0.2 / initialScale));
    
    svg.call(zoom);

    // Create links
    const links = container.append('g')
      .selectAll('line')
      .data(coreLinks)
      .join('line')
      .attr('stroke', '#1f2937')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', (d: NetworkLink) => (d.fundingAmount || 0) > 500000 ? 3 : 2);

    // Create nodes
    const nodes = container.append('g')
      .selectAll('circle')
      .data(coreNodes)
      .join('circle')
      .attr('r', d => {
        if (d.type === 'clinical_trial') {
          return nodeSizeScale(d.sampleSize || 0);
        } else if (d.type === 'institution') {
          return d.size === 'Large' ? 15 : d.size === 'Medium' ? 12 : 9;
        } else {
          return 10;
        }
      })
      .attr('fill', d => nodeColorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels for important nodes (high degree centrality)
    const nodeDegrees = new Map();
    coreNodes.forEach(node => nodeDegrees.set(node.id, 0));
    coreLinks.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      nodeDegrees.set(sourceId, (nodeDegrees.get(sourceId) || 0) + 1);
      nodeDegrees.set(targetId, (nodeDegrees.get(targetId) || 0) + 1);
    });

    const topNodes = coreNodes
      .map(node => ({ ...node, degree: nodeDegrees.get(node.id) || 0 }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 8) as (NetworkNode & { degree: number })[];

    const labels = container.append('g')
      .selectAll('text')
      .data(topNodes)
      .join('text')
      .text(d => d.title.split(' ').slice(0, 3).join(' '))
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('pointer-events', 'none')
      .attr('fill', '#374151')
      .attr('font-weight', '500');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: NetworkLink) => (d.source as NetworkNode).x || 0)
        .attr('y1', (d: NetworkLink) => (d.source as NetworkNode).y || 0)
        .attr('x2', (d: NetworkLink) => (d.target as NetworkNode).x || 0)
        .attr('y2', (d: NetworkLink) => (d.target as NetworkNode).y || 0);

      nodes
        .attr('cx', (d: NetworkNode) => d.x || 0)
        .attr('cy', (d: NetworkNode) => d.y || 0);

      labels
        .attr('x', (d: NetworkNode & { degree: number }) => d.x || 0)
        .attr('y', (d: NetworkNode & { degree: number }) => (d.y || 0) - 25);
    });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 200}, 30)`);

    const legendData = [
      { type: 'institution', label: 'Institutions', color: '#10b981' },
      { type: 'company', label: 'Companies', color: '#f59e0b' },
      { type: 'clinical_trial', label: 'Clinical Trials', color: '#3b82f6' }
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendItem.append('circle')
        .attr('r', 8)
        .attr('fill', item.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      legendItem.append('text')
        .attr('x', 15)
        .attr('y', 5)
        .text(item.label)
        .attr('font-size', '12px')
        .attr('fill', '#374151');
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .text(title);

    // Add network stats
    const stats = svg.append('g')
      .attr('transform', `translate(30, ${height - 60})`);

    stats.append('text')
      .attr('y', 0)
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text(`${coreNodes.length} entities • ${coreLinks.length} connections`);

    stats.append('text')
      .attr('y', 15)
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')
      .text(`Generated: ${new Date().toLocaleDateString()}`);

  }, [width, height, title]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
      />
    </div>
  );
};

export default MainNetworkFigure;