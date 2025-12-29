'use client';

import React, { useState } from 'react';

interface DataUploadProps {
  onDataUpload: (data: typeof import('@/data/network-data.json')) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onDataUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.json')) {
      setErrorMessage('Please upload a JSON file');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        // Validate data structure
        if (!jsonData.nodes || !jsonData.links) {
          throw new Error('Invalid data structure. Expected {nodes: [], links: []}');
        }
        
        // Validate node structure
        const requiredNodeFields = ['id', 'title', 'author', 'year'];
        const hasValidNodes = jsonData.nodes.every((node: typeof import('@/data/network-data.json').nodes[0]) =>
          requiredNodeFields.every(field => field in node)
        );
        
        if (!hasValidNodes) {
          throw new Error('Nodes must have id, title, author, and year fields');
        }
        
        // Validate link structure
        const hasValidLinks = jsonData.links.every((link: typeof import('@/data/network-data.json').links[0]) =>
          'source' in link && 'target' in link
        );
        
        if (!hasValidLinks) {
          throw new Error('Links must have source and target fields');
        }
        
        onDataUpload(jsonData);
        setUploadStatus('success');
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Invalid JSON file');
        setUploadStatus('error');
      }
    };
    
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : uploadStatus === 'success'
            ? 'border-green-500 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploadStatus === 'uploading' && (
          <div>
            <div className="text-gray-600 mb-2">Uploading...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse w-1/2"></div>
            </div>
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div>
            <div className="text-green-600 mb-2">✓ Data uploaded successfully!</div>
            <button
              onClick={resetUpload}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Upload another file
            </button>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div>
            <div className="text-red-600 mb-2">✗ Upload failed</div>
            <div className="text-sm text-red-500 mb-3">{errorMessage}</div>
            <button
              onClick={resetUpload}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Try again
            </button>
          </div>
        )}
        
        {uploadStatus === 'idle' && (
          <div>
            <div className="text-gray-600 mb-4">
              <div className="text-lg mb-2">📁 Upload Network Data</div>
              <div className="text-sm">Drag and drop a JSON file here, or click to browse</div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer transition-colors"
            >
              Choose File
            </label>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <div className="mb-2 font-medium">Expected JSON format:</div>
        <code className="text-xs bg-gray-100 p-2 rounded block">
          {`{
  "nodes": [{"id": "A", "title": "...", "author": "...", "year": 2023}],
  "links": [{"source": "A", "target": "B"}]
}`}
        </code>
      </div>
    </div>
  );
};

export default DataUpload;