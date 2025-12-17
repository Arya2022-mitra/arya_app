import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

interface LocationData {
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  tz_str: string;
}

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: number;
  currentLocation: LocationData;
  onSave: (location: LocationData) => Promise<void>;
}

// Mock geo service - in production, this should call the actual geo service
const mockGeoSearch = async (query: string): Promise<LocationData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!query || query.length < 2) return [];
  
  // Mock results for demonstration
  const mockResults: LocationData[] = [
    {
      city: 'New York',
      state: 'NY',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060,
      tz_str: 'America/New_York',
    },
    {
      city: 'London',
      state: 'England',
      country: 'United Kingdom',
      lat: 51.5074,
      lon: -0.1278,
      tz_str: 'Europe/London',
    },
    {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lat: 19.0760,
      lon: 72.8777,
      tz_str: 'Asia/Kolkata',
    },
  ];
  
  return mockResults.filter(loc => 
    loc.city.toLowerCase().includes(query.toLowerCase()) ||
    loc.country.toLowerCase().includes(query.toLowerCase())
  );
};

export default function EditLocationModal({
  isOpen,
  onClose,
  profileId,
  currentLocation,
  onSave,
}: EditLocationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await mockGeoSearch(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Geo search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (location: LocationData) => {
    setSelectedLocation(location);
    setSearchQuery(`${location.city}, ${location.state}, ${location.country}`);
    setShowResults(false);
  };

  const handleSave = async () => {
    if (!selectedLocation) return;
    
    setIsSaving(true);
    try {
      await onSave(selectedLocation);
      onClose();
    } catch (error) {
      console.error('Failed to save location:', error);
      alert('Failed to update location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedLocation(null);
    setShowResults(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Edit Location"
      footer={
        <>
          <Button onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={!selectedLocation || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search for a location
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type city or country name..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {location.city}, {location.state}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {location.country}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="absolute right-3 top-11 text-gray-400">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Selected Location Preview */}
        {selectedLocation && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Selected Location</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">City:</span>
                <span className="text-gray-900 dark:text-white font-medium">{selectedLocation.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">State:</span>
                <span className="text-gray-900 dark:text-white font-medium">{selectedLocation.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Country:</span>
                <span className="text-gray-900 dark:text-white font-medium">{selectedLocation.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Timezone:</span>
                <span className="text-gray-900 dark:text-white font-medium">{selectedLocation.tz_str}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Coordinates:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
