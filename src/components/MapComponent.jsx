import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapClickHandler = ({ onMapClick, allowPinDrop, allowPolygon }) => {
  useMapEvents({
    click: (e) => {
      if (allowPinDrop || allowPolygon) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

const MapComponent = ({ allowPinDrop = false, allowPolygon = false }) => {
  const [markers, setMarkers] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Component mounted
  }, [allowPinDrop, allowPolygon]);

  const handleMapClick = (latlng) => {
    if (allowPinDrop) {
      setMarkers(prev => [...prev, { position: latlng, id: Date.now() }]);
    }
    
    if (allowPolygon) {
      setCurrentPolygon(prev => [...prev, latlng]);
    }
  };

  const handlePolygonComplete = () => {
    if (currentPolygon.length >= 3) {
      setPolygons(prev => [...prev, { positions: [...currentPolygon], id: Date.now() }]);
      setCurrentPolygon([]);
    }
  };

  const handleReset = () => {
    setMarkers([]);
    setPolygons([]);
    setCurrentPolygon([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">
          {allowPinDrop && 'Click on the map to drop pins'}
          {allowPolygon && 'Click on the map to draw polygon (minimum 3 points)'}
          {!allowPinDrop && !allowPolygon && 'Interactive Map'}
        </h3>
        {(allowPinDrop || allowPolygon) && (
          <button
            onClick={handleReset}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Reset
          </button>
        )}
      </div>

      <div className="border overflow-hidden">
        <MapContainer
          center={[40.7128, -74.0060]} // New York coordinates
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          className="leaflet-container"
          whenCreated={() => {
            setMapLoaded(true);
          }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
          
          <MapClickHandler
            onMapClick={handleMapClick}
            allowPinDrop={allowPinDrop}
            allowPolygon={allowPolygon}
          />

          {/* Render markers */}
          {markers.map(marker => (
            <Marker key={marker.id} position={marker.position}>
              <Popup>
                Pin at {marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)}
              </Popup>
            </Marker>
          ))}

          {/* Render completed polygons */}
          {polygons.map(polygon => (
            <Polygon
              key={polygon.id}
              positions={polygon.positions}
              color="blue"
              fillColor="blue"
              fillOpacity={0.2}
            />
          ))}

          {/* Render current polygon being drawn */}
          {currentPolygon.length >= 3 && (
            <Polygon
              positions={currentPolygon}
              color="red"
              fillColor="red"
              fillOpacity={0.2}
            />
          )}
        </MapContainer>
      </div>

      {allowPolygon && currentPolygon.length > 0 && (
        <div className="text-sm text-gray-600">
          Points: {currentPolygon.length}
          {currentPolygon.length >= 3 && (
            <button
              onClick={handlePolygonComplete}
              className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
            >
              Complete Polygon
            </button>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        {allowPinDrop && markers.length > 0 && (
          <div>Pins placed: {markers.length}</div>
        )}
        {allowPolygon && polygons.length > 0 && (
          <div>Polygons drawn: {polygons.length}</div>
        )}
      </div>
    </div>
  );
};

export default MapComponent; 