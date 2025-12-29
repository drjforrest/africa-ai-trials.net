'use client';

import React from 'react';

interface ExportPanelProps {
  filteredNodes: typeof import('@/data/network-data.json').nodes;
  filteredLinks: typeof import('@/data/network-data.json').links;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ filteredNodes, filteredLinks }) => {
  const exportAsCSV = () => {
    const nodesCSV = [
      ['ID', 'Title', 'Author', 'Year'],
      ...filteredNodes.map(node => [node.id, node.title, ('author' in node ? node.author : '') || '', node.year])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const linksCSV = [
      ['Source', 'Target'],
      ...filteredLinks.map(link => [link.source, link.target])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    downloadFile(`nodes_${new Date().toISOString().split('T')[0]}.csv`, nodesCSV);
    downloadFile(`links_${new Date().toISOString().split('T')[0]}.csv`, linksCSV);
  };

  const exportAsJSON = () => {
    const exportData = {
      nodes: filteredNodes,
      links: filteredLinks,
      exportDate: new Date().toISOString(),
      stats: {
        nodeCount: filteredNodes.length,
        linkCount: filteredLinks.length,
        authorCount: new Set(filteredNodes.map(n => ('author' in n && n.author ? n.author : null)).filter(Boolean)).size
      }
    };
    
    downloadFile(
      `network_data_${new Date().toISOString().split('T')[0]}.json`, 
      JSON.stringify(exportData, null, 2)
    );
  };

  const exportAsSVG = () => {
    const svgElement = document.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `network_diagram_${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  const generateReport = () => {
    const authorCounts = filteredNodes.reduce((acc, node) => {
      const author: string = ('author' in node && node.author) ? String(node.author) : 'Unknown';
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const yearCounts = filteredNodes.reduce((acc, node) => {
      acc[node.year] = (acc[node.year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const report = `
# Network Analysis Report
Generated: ${new Date().toLocaleString()}

## Summary
- Total Papers: ${filteredNodes.length}
- Total Connections: ${filteredLinks.length}
- Unique Authors: ${Object.keys(authorCounts).length}
- Year Range: ${Math.min(...filteredNodes.map(n => n.year))} - ${Math.max(...filteredNodes.map(n => n.year))}

## Publications by Author
${Object.entries(authorCounts)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .map(([author, count]) => `- ${author}: ${count} papers`)
  .join('\n')}

## Publications by Year
${Object.entries(yearCounts)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([year, count]) => `- ${year}: ${count} papers`)
  .join('\n')}

## Papers
${filteredNodes.map(node => `- ${node.id}: "${node.title}" by ${('author' in node && node.author ? node.author : 'Unknown')} (${node.year})`).join('\n')}

## Connections
${filteredLinks.map(link => `- ${link.source} → ${link.target}`).join('\n')}
    `.trim();

    downloadFile(`network_report_${new Date().toISOString().split('T')[0]}.md`, report);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Data</h3>
      
      <div className="space-y-3">
        <button
          onClick={exportAsJSON}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Export as JSON
        </button>
        
        <button
          onClick={exportAsCSV}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Export as CSV
        </button>
        
        <button
          onClick={exportAsSVG}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Export Diagram (SVG)
        </button>
        
        <button
          onClick={generateReport}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          Generate Report
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Exports include only currently filtered data ({filteredNodes.length} papers)
      </div>
    </div>
  );
};

export default ExportPanel;