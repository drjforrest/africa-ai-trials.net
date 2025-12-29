'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

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

    // Updated data based on actual trials in database (including Ethiopia)
    const yearlyData = [
      { year: 2018, Kenya: 0, Nigeria: 0, Tanzania: 0, Zambia: 1, Ethiopia: 0 },
      { year: 2019, Kenya: 0, Nigeria: 0, Tanzania: 1, Zambia: 0, Ethiopia: 0 },
      { year: 2020, Kenya: 1, Nigeria: 0, Tanzania: 0, Zambia: 0, Ethiopia: 0 },
      { year: 2021, Kenya: 0, Nigeria: 1, Tanzania: 0, Zambia: 0, Ethiopia: 0 },
      { year: 2022, Kenya: 0, Nigeria: 1, Tanzania: 0, Zambia: 0, Ethiopia: 0 },
      { year: 2024, Kenya: 0, Nigeria: 0, Tanzania: 0, Zambia: 0, Ethiopia: 1 },
      { year: 2025, Kenya: 2, Nigeria: 0, Tanzania: 0, Zambia: 0, Ethiopia: 0 }
    ];

    // Set up dimensions with proper margins
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(yearlyData, d => d.year) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yearlyData, d => Math.max(d.Kenya, d.Nigeria, d.Tanzania, d.Zambia, d.Ethiopia)) || 1])
      .range([innerHeight, 0]);

    // Professional color palette matching manuscript
    const countryColors = {
      Kenya: '#1f77b4',    // Blue
      Nigeria: '#ff7f0e',  // Orange
      Tanzania: '#2ca02c', // Green
      Zambia: '#d62728',   // Red
      Ethiopia: '#9467bd'  // Purple
    };

    const countries = ['Kenya', 'Nigeria', 'Tanzania', 'Zambia', 'Ethiopia'];


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
      .ticks(6);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5);

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

    // Add lines and markers for each country
    countries.forEach(country => {
      const color = countryColors[country as keyof typeof countryColors];
      
      // Create line
      const countryLine = d3.line<any>()
        .x(d => xScale(d.year))
        .y(d => yScale(d[country]))
        .curve(d3.curveLinear);

      container.append('path')
        .datum(yearlyData)
        .attr('d', countryLine)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('opacity', 0.8);

      // Add markers
      container.selectAll(`.marker-${country}`)
        .data(yearlyData)
        .join('circle')
        .attr('class', `marker-${country}`)
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d[country as keyof typeof d]))
        .attr('r', 5)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top + 20})`);

    countries.forEach((country, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', countryColors[country as keyof typeof countryColors])
        .attr('stroke-width', 3);

      legendItem.append('circle')
        .attr('cx', 7.5)
        .attr('cy', 0)
        .attr('r', 3)
        .attr('fill', countryColors[country as keyof typeof countryColors])
        .attr('stroke', 'white')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 4)
        .text(country)
        .style('font-size', '11px')
        .style('font-family', 'Arial')
        .attr('fill', '#374151');
    });

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
      .text('Number of New Trials');

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
        Cumulative growth of network entities and connections over time
      </div>
    </div>
  );
};

export default TemporalEvolution;