'use client';

import React from 'react';

interface StatsPanelProps {
  filteredNodes: typeof import('@/data/network-data.json').nodes;
  filteredLinks: typeof import('@/data/network-data.json').links;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ filteredNodes, filteredLinks }) => {
  const typeCounts = filteredNodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryCounts = filteredNodes.reduce((acc, node) => {
    acc[node.country] = (acc[node.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const yearCounts = filteredNodes.reduce((acc, node) => {
    acc[node.year] = (acc[node.year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const nodeDegrees = new Map<string, number>();
  filteredNodes.forEach(node => nodeDegrees.set(node.id, 0));
  filteredLinks.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    nodeDegrees.set(sourceId, (nodeDegrees.get(sourceId) || 0) + 1);
    nodeDegrees.set(targetId, (nodeDegrees.get(targetId) || 0) + 1);
  });

  const maxDegree = Math.max(...Array.from(nodeDegrees.values()));
  const avgDegree = Array.from(nodeDegrees.values()).reduce((a, b) => a + b, 0) / nodeDegrees.size;

  const mostConnectedNode = filteredNodes.find(node => 
    nodeDegrees.get(node.id) === maxDegree
  );

  const topCountries = Object.entries(countryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Network Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{filteredNodes.length}</div>
          <div className="text-sm text-gray-600">Entities</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{filteredLinks.length}</div>
          <div className="text-sm text-gray-600">Connections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{Object.keys(countryCounts).filter(country => country !== 'Multiple' && !country.includes('United') && !country.includes('Netherlands') && !country.includes('Switzerland') && !country.includes('Israel')).length}</div>
          <div className="text-sm text-gray-600">Sub-Saharan Countries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{avgDegree.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Connections</div>
        </div>
      </div>

      {mostConnectedNode && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-700">Most Connected Entity:</div>
          <div className="text-sm text-gray-600">{mostConnectedNode.title}</div>
          <div className="text-xs text-gray-500">{maxDegree} connections</div>
        </div>
      )}

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Entity Types:</div>
        {Object.entries(typeCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm text-gray-600 mb-1">
              <span className="capitalize">{type.replace('_', ' ')}</span>
              <span>{count} entities</span>
            </div>
          ))}
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Top Countries:</div>
        {topCountries.map(([country, count]) => (
          <div key={country} className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{country}</span>
            <span>{count} entities</span>
          </div>
        ))}
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Entities by Year:</div>
        {Object.entries(yearCounts)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([year, count]) => (
            <div key={year} className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{year}</span>
              <span>{count} entities</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default StatsPanel;