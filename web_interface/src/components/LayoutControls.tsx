'use client';

import React from 'react';

export type LayoutType = 'force' | 'circular' | 'hierarchical' | 'grid';

interface LayoutControlsProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  forceStrength: number;
  onForceStrengthChange: (strength: number) => void;
  linkDistance: number;
  onLinkDistanceChange: (distance: number) => void;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
  currentLayout,
  onLayoutChange,
  forceStrength,
  onForceStrengthChange,
  linkDistance,
  onLinkDistanceChange,
}) => {
  const layouts = [
    { value: 'force', label: 'Force-Directed', description: 'Physics-based layout' },
    { value: 'circular', label: 'Circular', description: 'Nodes in a circle' },
    { value: 'hierarchical', label: 'Hierarchical', description: 'Tree-like structure' },
    { value: 'grid', label: 'Grid', description: 'Regular grid pattern' },
  ] as const;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Layout Controls</h3>
      
      {/* Layout Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Layout Algorithm
        </label>
        <div className="space-y-2">
          {layouts.map((layout) => (
            <label key={layout.value} className="flex items-center">
              <input
                type="radio"
                name="layout"
                value={layout.value}
                checked={currentLayout === layout.value}
                onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
                className="mr-2"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">{layout.label}</span>
                <div className="text-xs text-gray-500">{layout.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Force-Directed Settings */}
      {currentLayout === 'force' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Force Strength: {forceStrength}
            </label>
            <input
              type="range"
              min={-500}
              max={-50}
              value={forceStrength}
              onChange={(e) => onForceStrengthChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Strong Repulsion</span>
              <span>Weak Repulsion</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Distance: {linkDistance}
            </label>
            <input
              type="range"
              min={20}
              max={200}
              value={linkDistance}
              onChange={(e) => onLinkDistanceChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Close</span>
              <span>Far</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="text-xs text-blue-800">
          <strong>Tip:</strong> Different layouts reveal different aspects of your network structure.
        </div>
      </div>
    </div>
  );
};

export default LayoutControls;