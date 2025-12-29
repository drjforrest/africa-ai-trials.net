'use client';

import Navbar from '@/components/Navbar';

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            About the Project
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Network - Research Network Analysis Platform
          </p>
        </div>
      </header>
      
      <main>
        <div className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  This is a network analysis of AI diagnostic trials in Africa to monitor and investigate the innovation ecosystem of AI and health in the region.
                </p>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">Methodology</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We conducted a systematic search of AI diagnostic trials completed or registered on ClinicalTrials.gov and the Pan African Clinical Trials Registry (PACTR) to present. New trials registered and completed are automated to be added to this living systematic review upon their public record change to either ClinicalTrials.gov or PACTR.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We extract data into predefined network structures capturing relationships between institutions, researchers, countries, clinical sites, and disease areas. Network analyses were conducted using Python 3.12, with centrality measures and clustering algorithms applied to identify key nodes and collaboration patterns.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">JF</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Jamie Forrest, PhD</h3>
                      <p className="text-blue-700 mb-2">Postdoctoral Research Fellow, University of British Columbia</p>
                      <div className="space-y-1 text-sm text-blue-600">
                        <p className="flex items-center">
                          <span className="mr-2">📧</span>
                          <a href="mailto:james.forrest@ubc.ca" className="text-blue-600 hover:text-blue-800 underline">
                            james.forrest@ubc.ca
                          </a>
                        </p>
                        <p>For more information, or if you have data you wish to contribute to the project, please contact Jamie Forrest.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technology</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Built with modern web technologies for optimal performance and user experience:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Next.js 15</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">React 19</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">D3.js</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">TypeScript</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">Tailwind CSS</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Python 3.12</span>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}