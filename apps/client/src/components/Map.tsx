import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MissingPerson } from '@overwatch/shared';

interface MapProps {
  missingPersons: MissingPerson[];
  onMarkerClick?: (person: MissingPerson) => void;
}

export const Map: React.FC<MapProps> = ({ missingPersons, onMarkerClick }) => {
  const defaultCenter = [20.5937, 78.9629] as [number, number]; // India center

  return (
    <div className="map-container rounded-lg shadow-lg overflow-hidden">
      <MapContainer center={defaultCenter} zoom={4} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Render missing persons as markers */}
        {missingPersons.map((person) => {
          const [lng, lat] = person.geolocation.coordinates;
          const isFound = person.status === 'found';
          const markerColor = isFound ? '#22c55e' : '#ef4444';

          return (
            <CircleMarker
              key={person._id}
              center={[lat, lng]}
              radius={8}
              fillColor={markerColor}
              color={markerColor}
              weight={2}
              opacity={0.8}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => onMarkerClick?.(person),
              }}
            >
              <Popup>
                <div className="p-2 text-sm">
                  <p className="font-bold">{person.name}</p>
                  <p>Age: {person.age}</p>
                  <p>Status: {person.status}</p>
                  <p>{person.lastKnownLocation}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
