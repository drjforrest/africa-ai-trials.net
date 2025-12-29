'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import data from '@/data/network-data.json';

interface CountryNetworkFigureProps {
  width?: number;
  height?: number;
  selectedCountry?: string;
}

const CountryNetworkFigure: React.FC<CountryNetworkFigureProps> = ({ 
  width = 600, 
  height = 400,
  selectedCountry 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [country, setCountry] = useState(selectedCountry || 'Kenya');

  // Get available countries
  const countries = [...new Set(data.nodes
    .filter(node => node.type !== 'funder' && node.country !== 'Multiple')
    .map(node => node.country)
  )].sort();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Filter nodes for selected country and their connections
    const countryNodes = data.nodes.filter(node => 
      node.country === country || 
      node.country.includes(country) ||
      (node.type === 'funder' && data.links.some(link => {
        const connectedNode = data.nodes.find(n => 
          n.id === link.target && (n.country === country || n.country.includes(country))
        );
        return link.source === node.id && connectedNode;
      }))
    );

    const countryNodeIds = new Set(countryNodes.map(n => n.id));
    const countryLinks = data.links.filter(link =>
      countryNodeIds.has(link.source as string) && countryNodeIds.has(link.target as string)
    );

    if (countryNodes.length === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#6b7280')
        .text(`No entities found for ${country}`);
      return;
    }

    // Create scales
    const nodeColorScale = d3.scaleOrdinal<string>()
      .domain(['institution', 'company', 'clinical_trial', 'funder'])
      .range(['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']);

    // Create simulation
    const simulation = d3.forceSimulation(countryNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(countryLinks).id((d: any) => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20));

    // Create container
    const container = svg.append('g');

    // Add zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Apply initial zoom to show entire network
    const initialScale = 0.7; // Start at 70% zoom to show more of the network
    svg.call(zoom.transform, d3.zoomIdentity.scale(initialScale).translate(width * 0.15 / initialScale, height * 0.15 / initialScale));
    
    svg.call(zoom);

    // Create links
    const links = container.append('g')
      .selectAll('line')
      .data(countryLinks)
      .join('line')
      .attr('stroke', '#1f2937')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', (d: any) => d.type === 'funding' ? 3 : 2);

    // Create nodes
    const nodes = container.append('g')
      .selectAll('circle')
      .data(countryNodes)
      .join('circle')
      .attr('r', d => {
        if (d.type === 'clinical_trial') {
          return Math.max(8, Math.min(18, 8 + Math.sqrt((d.sampleSize || 0) / 100)));
        } else if (d.type === 'institution') {
          return d.size === 'Large' ? 14 : d.size === 'Medium' ? 11 : 8;
        } else if (d.type === 'funder') {
          return 12;
        } else {
          return 9;
        }
      })
      .attr('fill', d => nodeColorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels for all nodes (since it's country-focused)
    const labels = container.append('g')
      .selectAll('text')
      .data(countryNodes)
      .join('text')
      .text(d => {
        const words = d.title.split(' ');
        return words.length > 3 ? words.slice(0, 3).join(' ') + '...' : d.title;
      })
      .attr('font-size', '9px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('pointer-events', 'none')
      .attr('fill', '#374151')
      .attr('font-weight', '500');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + 25);
    });

    // Add country-specific stats
    const stats = svg.append('g')
      .attr('transform', `translate(30, ${height - 40})`);

    const trials = countryNodes.filter(n => n.type === 'clinical_trial');
    const institutions = countryNodes.filter(n => n.type === 'institution');
    const companies = countryNodes.filter(n => n.type === 'company');

    stats.append('text')
      .attr('y', 0)
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')
      .text(`${country}: ${institutions.length} institutions • ${companies.length} companies • ${trials.length} trials`);

  }, [country, width, height]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Country Network View</h3>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
      />
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Interactive country-specific network • Drag to pan • Scroll to zoom
      </div>
    </div>
  );
};

export default CountryNetworkFigure;