'use client';

import { useState, useMemo } from 'react';
import NetworkDiagram from '@/components/NetworkDiagram';
import TimeSlider from '@/components/TimeSlider';
import FilterPanel from '@/components/FilterPanel';
import StatsPanel from '@/components/StatsPanel';
import ExportPanel from '@/components/ExportPanel';
import LayoutControls, { LayoutType } from '@/components/LayoutControls';
import NetworkMetrics from '@/components/NetworkMetrics';
import Navbar from '@/components/Navbar';
import data from '@/data/network-data.json';

export default function Home() {
  const years = data.nodes.map(node => node.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const availableTypes = [...new Set(data.nodes.map(node => node.type))].sort();
  const availableCountries = [...new Set(data.nodes.map(node => node.country))].sort();
  const availableCategories = [...new Set(data.nodes.map(node => node.category))].sort();

  const [year, setYear] = useState(maxYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedNode, setSelectedNode] = useState<typeof data.nodes[0] | null>(null);
  const [layout, setLayout] = useState<LayoutType>('force');
  const [forceStrength, setForceStrength] = useState(-200);
  const [linkDistance, setLinkDistance] = useState(80);
  const [colorBy, setColorBy] = useState<'year' | 'category' | 'type' | 'country'>('type');

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYear(Number(event.target.value));
  };

  // Calculate filtered data for statistics
  const filteredData = useMemo(() => {
    // First filter by time progression (time slider)
    let filteredNodes = data.nodes.filter(node => node.year <= year);
    
    // Apply year filter if specific years are selected
    if (selectedYears.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        selectedYears.includes(node.year)
      );
    }
    
    if (searchTerm) {
      filteredNodes = filteredNodes.filter(node =>
        node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedTypes.includes(node.type)
      );
    }
    
    if (selectedCountries.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedCountries.some(country => node.country.includes(country))
      );
    }
    
    if (selectedCategories.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedCategories.includes(node.category)
      );
    }
    
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredLinks = data.links.filter(link =>
      filteredNodeIds.has(link.source as string) && filteredNodeIds.has(link.target as string)
    );
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [year, searchTerm, selectedTypes, selectedCountries, selectedCategories, selectedYears]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Navbar />
      <header className="bg-gradient-to-r from-white to-blue-50 shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-blue-900 to-indigo-700 bg-clip-text text-transparent">
                Living Systematic Review & Network Analysis
              </h1>
              <p className="mt-3 text-lg text-gray-600 max-w-2xl">
                Network analysis of AI diagnostic trials in Africa to monitor and investigate the innovation ecosystem of AI and health in the region.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900">Network Status</div>
                <div className="text-xs text-blue-700 mt-1">
                  {data.nodes.length} entities • {data.links.length} connections
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Secondary Horizontal Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-4 gap-4">
            {/* Layout Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Layout:</label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as LayoutType)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="force">Force-directed</option>
                  <option value="circular">Circular</option>
                  <option value="hierarchical">Hierarchical</option>
                  <option value="grid">Grid</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Color by:</label>
                <select
                  value={colorBy}
                  onChange={(e) => setColorBy(e.target.value as 'year' | 'category' | 'type' | 'country')}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="type">Entity Type</option>
                  <option value="country">Country</option>
                  <option value="category">Category</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>
            
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search network..."
                  className="text-sm border border-gray-300 rounded px-3 py-1 w-48"
                />
              </div>
              
              {/* Quick Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1">
                <span className="text-xs font-medium text-blue-900">
                  {filteredData.nodes.length} entities • {filteredData.links.length} connections
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
              {/* Left Sidebar - Simplified Filters */}
              <div className="xl:col-span-1 lg:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
                  
                  {/* Year Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years ({selectedYears.length} selected)
                    </label>
                    <div className="max-h-24 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {[...new Set(years)].sort((a, b) => a - b).map((yearOption) => (
                        <label key={yearOption} className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            checked={selectedYears.includes(yearOption)}
                            onChange={() => {
                              if (selectedYears.includes(yearOption)) {
                                setSelectedYears(selectedYears.filter(y => y !== yearOption));
                              } else {
                                setSelectedYears([...selectedYears, yearOption]);
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">{yearOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Entity Type Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entity Types ({selectedTypes.length} selected)
                    </label>
                    <div className="space-y-2">
                      {availableTypes.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={() => {
                              if (selectedTypes.includes(type)) {
                                setSelectedTypes(selectedTypes.filter(t => t !== type));
                              } else {
                                setSelectedTypes([...selectedTypes, type]);
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600 capitalize">
                            {type.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Country Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Countries ({selectedCountries.length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {availableCountries.map((country) => (
                        <label key={country} className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            checked={selectedCountries.includes(country)}
                            onChange={() => {
                              if (selectedCountries.includes(country)) {
                                setSelectedCountries(selectedCountries.filter(c => c !== country));
                              } else {
                                setSelectedCountries([...selectedCountries, country]);
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">{country}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedTypes([]);
                      setSelectedCountries([]);
                      setSelectedCategories([]);
                      setSelectedYears([]);
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>

                <StatsPanel
                  filteredNodes={filteredData.nodes}
                  filteredLinks={filteredData.links}
                />
                
                <ExportPanel
                  filteredNodes={filteredData.nodes}
                  filteredLinks={filteredData.links}
                />
              </div>

              {/* Main Content - Network Visualization */}
              <div className="xl:col-span-3 lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        Network Visualization
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Interactive network of African healthcare research</p>
                    </div>
                  </div>
                  
                  <div className="mb-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Time Progression: <span className="font-bold text-blue-600 ml-1">{year}</span>
                    </label>
                    <TimeSlider
                      min={minYear}
                      max={maxYear}
                      value={year}
                      onChange={handleYearChange}
                    />
                  </div>
                  
                  <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-gradient-to-br from-white to-blue-50/30 min-h-[600px]">
                    <NetworkDiagram 
                      year={year}
                      searchTerm={searchTerm}
                      selectedTypes={selectedTypes}
                      selectedCountries={selectedCountries}
                      selectedCategories={selectedCategories}
                      onNodeClick={setSelectedNode}
                      layout={layout}
                      forceStrength={forceStrength}
                      linkDistance={linkDistance}
                      colorBy={colorBy}
                    />
                  </div>
                  
                  {/* Network Metrics Table */}
                  <div className="mt-6">
                    <NetworkMetrics 
                      filteredNodes={filteredData.nodes}
                      filteredLinks={filteredData.links}
                    />
                  </div>
                </div>

                {/* Selected Node Details */}
                {selectedNode && (
                  <div className="mt-6 bg-white rounded-xl shadow-lg border border-blue-100 p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <h3 className="text-xl font-bold text-gray-800">Entity Details</h3>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entity Name</div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">{selectedNode.title}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</div>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium mt-1 ${
                              selectedNode.type === 'institution' ? 'bg-green-100 text-green-800' :
                              selectedNode.type === 'company' ? 'bg-orange-100 text-orange-800' :
                              selectedNode.type === 'clinical_trial' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {selectedNode.type?.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</div>
                            <div className="text-sm text-gray-900 mt-1">{selectedNode.category}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-4 border border-gray-200">
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">{selectedNode.country}</div>
                          {selectedNode.city && (
                            <div className="text-sm text-gray-600">{selectedNode.city}</div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Network Entry</div>
                            <div className="text-sm font-semibold text-blue-600 mt-1">{selectedNode.year}</div>
                          </div>
                          {selectedNode.foundingYear && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Founded</div>
                              <div className="text-sm text-gray-900 mt-1">{selectedNode.foundingYear}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {(selectedNode.specialization || selectedNode.focus || selectedNode.condition || selectedNode.technology) && (
                        <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            {selectedNode.type === 'clinical_trial' ? 'Medical Condition & Technology' : 'Specialization & Focus'}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedNode.specialization && (
                              <div>
                                <div className="text-xs text-gray-500">Specialization</div>
                                <div className="text-sm font-medium text-gray-900">{selectedNode.specialization}</div>
                              </div>
                            )}
                            {selectedNode.focus && (
                              <div>
                                <div className="text-xs text-gray-500">Focus Area</div>
                                <div className="text-sm font-medium text-gray-900">{selectedNode.focus}</div>
                              </div>
                            )}
                            {selectedNode.condition && (
                              <div>
                                <div className="text-xs text-gray-500">Medical Condition</div>
                                <div className="text-sm font-medium text-gray-900">{selectedNode.condition}</div>
                              </div>
                            )}
                            {selectedNode.technology && (
                              <div>
                                <div className="text-xs text-gray-500">Technology</div>
                                <div className="text-sm font-medium text-gray-900">{selectedNode.technology}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {(selectedNode.status || selectedNode.sampleSize) && (
                        <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-yellow-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Trial Information</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {selectedNode.status && (
                              <div>
                                <div className="text-xs text-gray-500">Status</div>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium mt-1 ${
                                  selectedNode.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  selectedNode.status === 'Recruiting' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {selectedNode.status}
                                </span>
                              </div>
                            )}
                            {selectedNode.sampleSize && (
                              <div>
                                <div className="text-xs text-gray-500">Sample Size</div>
                                <div className="text-sm font-bold text-gray-900 mt-1">{selectedNode.sampleSize.toLocaleString()}</div>
                              </div>
                            )}
                            {selectedNode.originalId && (
                              <div>
                                <div className="text-xs text-gray-500">Registry ID</div>
                                <div className="text-sm font-mono text-gray-700 mt-1">{selectedNode.originalId}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
