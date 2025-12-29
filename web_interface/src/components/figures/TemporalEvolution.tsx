'use client';

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

interface TemporalEvolutionProps {
  width?: number;
  height?: number;
}

const TemporalEvolution: React.FC<TemporalEvolutionProps> = ({ 
  width = 800, 
  height = 500
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Cumulative data based on actual trials (matches publication Figure 3)
    const cumulativeData = [
      { year: 2019, cumulative: 2, newTrials: 2 },
      { year: 2020, cumulative: 3, newTrials: 1 },
      { year: 2021, cumulative: 5, newTrials: 2 },
      { year: 2022, cumulative: 7, newTrials: 2 },
      { year: 2023, cumulative: 9, newTrials: 2 },
      { year: 2024, cumulative: 10, newTrials: 1 },
      { year: 2025, cumulative: 11, newTrials: 1 }
    ];

    // Set up dimensions with proper margins
    const margin = { top: 50, right: 80, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(cumulativeData, d => d.year) as [number, number])
      .range([0, innerWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(cumulativeData, d => d.cumulative) || 11])
      .range([innerHeight, 0])
      .nice();

    // Add grid lines
    container.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#e0e0e0')
      .style('stroke-width', 0.5)
      .style('stroke-dasharray', '2,2');

    container.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#e0e0e0')
      .style('stroke-width', 0.5)
      .style('stroke-dasharray', '2,2');

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('d'))
      .ticks(cumulativeData.length);

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d3.format('d'));

    container.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-family', 'Arial');

    container.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-family', 'Arial');

    // Create line generator - single cumulative line (matches publication)
    const line = d3.line<{year: number; cumulative: number}>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.cumulative))
      .curve(d3.curveLinear);

    // Draw the single cumulative line (blue, matching publication #2E86AB)
    container.append('path')
      .datum(cumulativeData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#2E86AB') // Blue color matching publication
      .attr('stroke-width', 2.5) // Line width matching publication
      .attr('opacity', 1);

    // Add markers (circles) at each data point
    container.selectAll('.marker')
      .data(cumulativeData)
      .join('circle')
      .attr('class', 'marker')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.cumulative))
      .attr('r', 6)
      .attr('fill', '#2E86AB')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Add data labels above each point (showing cumulative count)
    container.selectAll('.label')
      .data(cumulativeData)
      .join('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.year))
      .attr('y', d => yScale(d.cumulative) - 15)
      .attr('text-anchor', 'middle')
      .text(d => d.cumulative.toString())
      .style('font-size', '11px')
      .style('font-family', 'Arial')
      .style('font-weight', 'bold')
      .attr('fill', '#374151');

    // Add axis labels
    svg.append('text')
      .attr('transform', `translate(${margin.left + innerWidth / 2}, ${height - 15})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-family', 'Arial')
      .style('font-weight', 'bold')
      .attr('fill', '#374151')
      .text('Year');

    svg.append('text')
      .attr('transform', `translate(15, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-family', 'Arial')
      .style('font-weight', 'bold')
      .attr('fill', '#374151')
      .text('Cumulative Number of Registered Trials');

  }, [width, height]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        Cumulative growth of registered trials over time (matches publication Figure 3)
      </div>
    </div>
  );
};

export default TemporalEvolution;