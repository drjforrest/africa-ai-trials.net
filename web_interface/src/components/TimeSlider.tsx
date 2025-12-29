'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimeSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ min, max, value, onChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500); // milliseconds between steps
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlay = () => {
    if (isPlaying) {
      // Stop animation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Start animation
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        onChange({
          target: { value: String(Math.min(value + 1, max)) }
        } as React.ChangeEvent<HTMLInputElement>);
        
        // Stop when reaching the end
        if (value >= max) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsPlaying(false);
        }
      }, speed);
    }
  };

  const handleReset = () => {
    // Stop animation if playing
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    
    // Reset to minimum year
    onChange({
      target: { value: String(min) }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Stop animation when reaching max
  useEffect(() => {
    if (value >= max && isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    }
  }, [value, max, isPlaying]);

  return (
    <div className="space-y-3 w-full">
      {/* Time Slider Row */}
      <div className="flex items-center space-x-2 w-full">
        <span className="text-xs text-gray-600 shrink-0">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className="flex-1 min-w-0"
        />
        <span className="text-xs text-gray-600 shrink-0">{max}</span>
        <span className="font-bold text-indigo-600 text-sm shrink-0 min-w-[2.5rem] text-right">{value}</span>
      </div>
      
      {/* Controls Row */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlay}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              isPlaying 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
            title={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Reset to beginning"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <label className="text-xs text-gray-500 shrink-0">Speed:</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-1 py-0.5 min-w-0"
          >
            <option value={1000}>Slow</option>
            <option value={500}>Normal</option>
            <option value={250}>Fast</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TimeSlider;
