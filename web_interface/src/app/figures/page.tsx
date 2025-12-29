'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import MainNetworkFigure from '@/components/figures/MainNetworkFigure';
import CountryNetworkFigure from '@/components/figures/CountryNetworkFigure';
import TechnologyHeatmap from '@/components/figures/TechnologyHeatmap';
import TemporalEvolution from '@/components/figures/TemporalEvolution';
import FundingAnalysis from '@/components/figures/FundingAnalysis';

export default function FiguresPage() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Navbar />
      <header className="bg-gradient-to-r from-white to-blue-50 shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-blue-900 to-indigo-700 bg-clip-text text-transparent">
                Network Analysis Figures
              </h1>
              <p className="mt-3 text-lg text-gray-600 max-w-2xl">
                Interactive visualizations generated from live database - always current and consistent with app theme.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900">Live Figures</div>
                <div className="text-xs text-blue-700 mt-1">
                  Auto-updated from database
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">Current Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            
            {/* Main Network Figure */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">Figure 1: Main Network Overview</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Complete network showing all institutions, companies, and clinical trials with their interconnections.
              </p>
              <MainNetworkFigure width={750} height={500} />
            </div>

            {/* Country-Specific Networks */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">Figure 2: Country-Specific Networks</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Focused view of research networks within specific countries, including international connections.
              </p>
              <CountryNetworkFigure width={650} height={450} />
            </div>

            {/* Technology Specialization */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">Figure 3: Technology Specialization Heatmap</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Distribution of AI technologies across countries, showing specialization patterns and geographic clusters.
              </p>
              <TechnologyHeatmap width={750} height={400} />
            </div>

            {/* Temporal Evolution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">Figure 4: Temporal Network Evolution</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Growth of the research network over time, showing the cumulative addition of entities and connections.
              </p>
              <TemporalEvolution width={750} height={400} />
            </div>

            {/* Funding Analysis */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">Figure 5: Funding Analysis</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Distribution of funding sources and amounts across the AI diagnostic innovation network.
              </p>
              <FundingAnalysis width={750} height={500} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};