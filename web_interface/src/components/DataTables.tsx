import data from '@/data/network-data.json';
import React, { useState } from 'react';

interface DataTablesProps {
  currentData?: typeof data;
}

const DataTables: React.FC<DataTablesProps> = ({ currentData = data }) => {
  const { nodes, links } = currentData;
  const [selectedEntityType, setSelectedEntityType] = useState<'core' | 'institution' | 'company' | 'clinical_trial' | 'funder'>('core');

  // Core network analysis (45-entity methodology): excludes funders
  const coreNodes = nodes.filter(node => node.type !== 'funder');
  const coreLinks = links.filter(link => {
    const sourceInCore = coreNodes.some(n => n.id === link.source);
    const targetInCore = coreNodes.some(n => n.id === link.target);
    return sourceInCore && targetInCore;
  });

  // const filteredNodes = selectedEntityType === 'core' 
  //   ? coreNodes 
  //   : nodes.filter(node => node.type === selectedEntityType);

  const institutions = nodes.filter(node => node.type === 'institution');
  const companies = nodes.filter(node => node.type === 'company');  
  const clinicalTrials = nodes.filter(node => node.type === 'clinical_trial');
  const funders = nodes.filter(node => node.type === 'funder');

  return (
    <div className="space-y-8">
      {/* Entity Type Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Entity Type
        </label>
        <select
          value={selectedEntityType}
          onChange={(e) => setSelectedEntityType(e.target.value as 'core' | 'institution' | 'company' | 'clinical_trial' | 'funder')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="core">Core Network Entities ({coreNodes.length}) - Analysis Methodology</option>
          <option value="institution">Institutions ({institutions.length})</option>
          <option value="company">Companies ({companies.length})</option>
          <option value="clinical_trial">Clinical Trials ({clinicalTrials.length})</option>
          <option value="funder">Funding Organizations ({funders.length})</option>
        </select>
      </div>

      {/* Core Network Overview */}
      {selectedEntityType === 'core' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Core Network Entities (45-Entity Analysis Methodology)</h3>
            <p className="text-sm text-gray-600 mt-1">Institutions, Companies, and Clinical Trials - Excludes funding organizations for centrality calculations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Network Entry</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Founding Year</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Specialization/Focus</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coreNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{node.originalId}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{node.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        node.type === 'institution' ? 'bg-green-100 text-green-800' :
                        node.type === 'company' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {node.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.country}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-medium">{node.year}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{node.foundingYear || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {node.specialization || ('focus' in node && node.focus) || ('condition' in node && node.condition) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Institutions Table */}
      {(selectedEntityType === 'institution') && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Institutions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Founded</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {institutions.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{node.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.category}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.country}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.city}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.year}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        node.size === 'Large' ? 'bg-green-100 text-green-800' :
                        node.size === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {node.size}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.specialization}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Companies Table */}
      {selectedEntityType === 'company' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Companies</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Founded</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Focus</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Technology</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{node.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        node.category === 'Startup' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {node.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.country}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.year}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.focus}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.technology}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clinical Trials Table */}
      {selectedEntityType === 'clinical_trial' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Clinical Trials</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Start Year</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Sample Size</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Technology</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clinicalTrials.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{node.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                        {node.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        node.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        node.status === 'Recruiting' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.country}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.year}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.condition}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.sampleSize?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{node.technology}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Funders Table */}
      {selectedEntityType === 'funder' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Funding Organizations</h3>
            <p className="text-sm text-gray-600 mt-1">External funding entities - Not included in core network centrality calculations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">First Participation</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Focus</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Total Funding</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funders.map((node) => {
                  const funderLinks = links.filter(link => link.source === node.id && link.type === 'funding');
                  const totalFunding = funderLinks.reduce((sum, link) => sum + (link.fundingAmount || 0), 0);
                  
                  return (
                    <tr key={node.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{node.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          {node.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{node.year}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{node.focus}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-medium">
                        ${totalFunding.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Relationships Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedEntityType === 'core' ? 'Core Network Relationships' : 'All Relationships'}
          </h3>
          {selectedEntityType === 'core' && (
            <p className="text-sm text-gray-600 mt-1">
              Relationships between core entities only - Used for centrality and density calculations
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Strength</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Funding</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Personnel Exchange</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Tech Transfer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(selectedEntityType === 'core' ? coreLinks : links).map((link, index) => {
                const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
                const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
                const sourceNode = nodes.find(n => n.id === sourceId);
                const targetNode = nodes.find(n => n.id === targetId);
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="font-medium">{sourceNode?.title}</div>
                      <div className="text-xs text-gray-500 capitalize">{sourceNode?.type.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="font-medium">{targetNode?.title}</div>
                      <div className="text-xs text-gray-500 capitalize">{targetNode?.type.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {link.type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        link.strength === 'Strong' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {link.strength}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {link.fundingAmount ? (
                        <div>
                          <div className="font-medium">${link.fundingAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{link.fundingType}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        link.hasPersonnelExchange ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {link.hasPersonnelExchange ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        link.hasTechTransfer ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {link.hasTechTransfer ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTables;
