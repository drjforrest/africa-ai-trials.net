'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import data from '@/data/network-data.json';

interface TechnologyHeatmapProps {
  width?: number;
  height?: number;
}

const TechnologyHeatmap: React.FC<TechnologyHeatmapProps> = ({ 
  width = 700, 
  height = 500
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMetric, setSelectedMetric] = useState('Technology Present');

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Data structure updated with Ethiopia and corrected countries
    const countries = ['Ethiopia', 'Kenya', 'Nigeria', 'Tanzania', 'Zambia'];
    const technologies = ['Computer-aided diagnostic algorithm', 'Computer Vision', 'Deep Learning', 'Large Language Models', 'Machine Learning'];
    
    // Binary presence data including Ethiopia
    const manuscriptData = {
      'Ethiopia': {
        'Computer-aided diagnostic algorithm': 1,
        'Computer Vision': 0,
        'Deep Learning': 0, 
        'Large Language Models': 0,
        'Machine Learning': 0
      },
      'Kenya': {
        'Computer-aided diagnostic algorithm': 0,
        'Computer Vision': 1,
        'Deep Learning': 1, 
        'Large Language Models': 1,
        'Machine Learning': 0
      },
      'Nigeria': {
        'Computer-aided diagnostic algorithm': 0,
        'Computer Vision': 0,
        'Deep Learning': 1,
        'Large Language Models': 0, 
        'Machine Learning': 1
      },
      'Tanzania': {
        'Computer-aided diagnostic algorithm': 0,
        'Computer Vision': 0,
        'Deep Learning': 0,
        'Large Language Models': 0,
        'Machine Learning': 1
      },
      'Zambia': {
        'Computer-aided diagnostic algorithm': 0,
        'Computer Vision': 0,
        'Deep Learning': 1,
        'Large Language Models': 0,
        'Machine Learning': 0
      }
    };

    // Convert to D3 format
    const heatmapData = [];
    countries.forEach(country => {
      technologies.forEach(tech => {
        const value = manuscriptData[country][tech];
        heatmapData.push({
          country,
          technology: tech,
          value,
          present: value === 1
        });
      });
    });

    // Set up dimensions with more space for legend at bottom
    const margin = { top: 60, right: 50, bottom: 150, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(technologies)
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(countries)
      .range([0, innerHeight])
      .padding(0.05);

    // Binary color scale - red for present (1), blue for absent (0)
    const colorScale = (value) => value === 1 ? '#dc2626' : '#1e40af';

    // Create cells
    container.selectAll('rect')
      .data(heatmapData)
      .join('rect')
      .attr('x', d => xScale(d.technology) || 0)
      .attr('y', d => yScale(d.country) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${event.offsetX}, ${event.offsetY - 10})`);

        tooltip.append('rect')
          .attr('x', -80)
          .attr('y', -30)
          .attr('width', 160)
          .attr('height', 25)
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('rx', 4);

        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -12)
          .attr('fill', 'white')
          .attr('font-size', '11px')
          .text(`${d.country} - ${d.technology}: ${d.present ? 'Present' : 'Absent'}`);
      })
      .on('mouseout', function() {
        svg.selectAll('.tooltip').remove();
      });

    // Add value labels for all cells
    container.selectAll('text.cell-label')
      .data(heatmapData)
      .join('text')
      .attr('class', 'cell-label')
      .attr('x', d => (xScale(d.technology) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => (yScale(d.country) || 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .text(d => d.value);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    container.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('font-size', '11px');

    container.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '11px');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .text('Technological Specialization by Country');

    // Add axis labels
    svg.append('text')
      .attr('transform', `translate(${margin.left + innerWidth / 2}, ${height - 20})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#6b7280')
      .text('AI Algorithm Type');

    svg.append('text')
      .attr('transform', `translate(20, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#6b7280')
      .text('Country');

    // Add legend at bottom center to avoid covering data
    const legend = svg.append('g')
      .attr('transform', `translate(${width / 2 - 100}, ${height - 50})`);

    // Legend for binary scale
    const legendData = [
      { label: 'Technology Present', color: '#dc2626', value: 1 },
      { label: 'Technology Absent', color: '#1e40af', value: 0 }
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(${i * 120}, 0)`);

      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', item.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(item.label)
        .attr('font-size', '12px')
        .attr('fill', '#374151');
    });

  }, [width, height]);

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

export default TechnologyHeatmap;