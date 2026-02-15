import React, { useEffect, useState } from 'react';
import { Map } from './components/Map';
import { FilterPanel } from './components/FilterPanel';
import { useMapStore } from './store/mapStore';
import { apiClient } from './api/apiClient';
import { MissingPerson, FilterParams } from '@overwatch/shared';
import './index.css';

function App() {
  const { missingPersons, setMissingPersons, setLoading, setError, filters, updateFilters } =
    useMapStore();
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(null);

  // Fetch missing persons on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.getMissingPersons(filters);
        if (response.success && response.data && typeof response.data === 'object') {
          const data = response.data as any;
          setMissingPersons(data.results || []);
        }
      } catch (error) {
        setError(`Failed to fetch data: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, setMissingPersons, setLoading, setError]);

  const handleFilterChange = (newFilters: Partial<FilterParams>) => {
    updateFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Overwatch</h1>
          <p className="text-gray-600">Missing Persons Mapping Platform</p>
          <p className="text-sm text-gray-500 mt-2">
            Data from public police sources | Read-only public system | No signup required
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Filters and Details */}
          <aside className="lg:col-span-1">
            <FilterPanel onFilterChange={handleFilterChange} />

            {/* Selected Person Details */}
            {selectedPerson && (
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-semibold">Name:</span> {selectedPerson.name}
                  </p>
                  <p>
                    <span className="font-semibold">Age:</span> {selectedPerson.age}
                  </p>
                  <p>
                    <span className="font-semibold">Gender:</span> {selectedPerson.gender}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>
                    <span
                      className={
                        selectedPerson.status === 'found'
                          ? 'ml-2 text-green-600 font-bold'
                          : 'ml-2 text-red-600 font-bold'
                      }
                    >
                      {selectedPerson.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Last Seen:</span>{' '}
                    {new Date(selectedPerson.lastSeenDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-semibold">Location:</span>{' '}
                    {selectedPerson.lastKnownLocation}
                  </p>
                  {selectedPerson.description && (
                    <p>
                      <span className="font-semibold">Description:</span>{' '}
                      {selectedPerson.description}
                    </p>
                  )}
                  {selectedPerson.contactPhone && (
                    <p>
                      <span className="font-semibold">Contact:</span>{' '}
                      {selectedPerson.contactPhone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Map Area */}
          <div className="lg:col-span-2">
            <Map
              missingPersons={missingPersons}
              onMarkerClick={(person) => setSelectedPerson(person)}
            />

            {/* Legend */}
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">Legend</h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">Missing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Found</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <footer className="mt-12 text-center text-sm text-gray-600 border-t border-gray-200 pt-6">
          <p>
            Data sourced from public police websites. Information may not be real-time. For
            emergencies, contact local police.
          </p>
          <p className="mt-2">Version 1.0 | Maharashtra & Karnataka</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
