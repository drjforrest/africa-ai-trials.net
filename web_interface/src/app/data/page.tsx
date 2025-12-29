'use client';

import { useState, useEffect } from 'react';
import DataTables from '@/components/DataTables';
import ExportPanel from '@/components/ExportPanel';
import Navbar from '@/components/Navbar';

export default function DataPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Network Data
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            View and export the current network dataset from live database.
          </p>
          {data.metadata && (
            <div className="mt-2 text-sm text-gray-500">
              Last updated: {new Date(data.metadata.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <ExportPanel
                  filteredNodes={data.nodes}
                  filteredLinks={data.links}
                />
              </div>
              
              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Live Database Content
                    </h2>
                    <div className="text-sm text-gray-500">
                      {data.nodes.length} entities, {data.links.length} relationships
                    </div>
                  </div>
                  
                  <DataTables currentData={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
