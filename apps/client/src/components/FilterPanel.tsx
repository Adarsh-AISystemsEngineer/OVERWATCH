import React, { useState } from 'react';
import { FilterParams, Gender, MissingPersonStatus } from '@overwatch/shared';

interface FilterProps {
  onFilterChange: (filters: Partial<FilterParams>) => void;
  loading?: boolean;
}

export const FilterPanel: React.FC<FilterProps> = ({ onFilterChange, loading = false }) => {
  const [gender, setGender] = useState<string>('');
  const [ageMin, setAgeMin] = useState<number | ''>('');
  const [ageMax, setAgeMax] = useState<number | ''>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleApplyFilters = () => {
    const filters: Partial<FilterParams> = {
      limit: 20,
      offset: 0,
    };

    if (gender) filters.gender = gender as Gender;
    if (ageMin !== '') filters.ageMin = ageMin as number;
    if (ageMax !== '') filters.ageMax = ageMax as number;
    if (status) filters.status = status as MissingPersonStatus;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    onFilterChange(filters);
  };

  const handleReset = () => {
    setGender('');
    setAgeMin('');
    setAgeMax('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="missing">Missing</option>
            <option value="found">Found</option>
          </select>
        </div>

        {/* Age Min */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Min
          </label>
          <input
            type="number"
            min="0"
            max="150"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Age Max */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Max
          </label>
          <input
            type="number"
            min="0"
            max="150"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
