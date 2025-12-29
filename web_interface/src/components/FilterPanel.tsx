'use client';

import React from 'react';

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  availableTypes: string[];
  selectedCountries: string[];
  onCountryChange: (countries: string[]) => void;
  availableCountries: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  availableCategories: string[];
  minYear: number;
  maxYear: number;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  colorBy: 'year' | 'category' | 'type' | 'country';
  onColorByChange: (colorBy: 'year' | 'category' | 'type' | 'country') => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  searchTerm,
  onSearchChange,
  selectedTypes,
  onTypeChange,
  availableTypes,
  selectedCountries,
  onCountryChange,
  availableCountries,
  selectedCategories,
  onCategoryChange,
  availableCategories,
  minYear,
  maxYear,
  yearRange,
  onYearRangeChange,
  colorBy,
  onColorByChange,
}) => {
  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const handleCountryToggle = (country: string) => {
    if (selectedCountries.includes(country)) {
      onCountryChange(selectedCountries.filter(c => c !== country));
    } else {
      onCountryChange([...selectedCountries, country]);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
      
      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Network
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, country, type..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Year Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year Range: {yearRange[0]} - {yearRange[1]}
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={yearRange[0]}
            onChange={(e) => onYearRangeChange([Number(e.target.value), yearRange[1]])}
            className="flex-1"
          />
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={yearRange[1]}
            onChange={(e) => onYearRangeChange([yearRange[0], Number(e.target.value)])}
            className="flex-1"
          />
        </div>
      </div>

      {/* Color By */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Nodes By
        </label>
        <select
          value={colorBy}
          onChange={(e) => onColorByChange(e.target.value as 'year' | 'category' | 'type' | 'country')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="type">Entity Type</option>
          <option value="country">Country</option>
          <option value="category">Category</option>
          <option value="year">Year</option>
        </select>
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
                onChange={() => handleTypeToggle(type)}
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
                onChange={() => handleCountryToggle(country)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">{country}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories ({selectedCategories.length} selected)
        </label>
        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
          {availableCategories.map((category) => (
            <label key={category} className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          onSearchChange('');
          onTypeChange([]);
          onCountryChange([]);
          onCategoryChange([]);
          onYearRangeChange([minYear, maxYear]);
        }}
        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterPanel;