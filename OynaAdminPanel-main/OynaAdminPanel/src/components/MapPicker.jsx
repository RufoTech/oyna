import React, { useState, useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Helper component that reactively updates map center/view without remounting the entire Leaflet instance
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const LocationMarker = ({ initialPosition, onChange }) => {
  const [position, setPosition] = useState(initialPosition);

  // Sync internal position state when initialPosition changes (e.g. from parent inputs)
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  useMapEvents({
    click(event) {
      setPosition(event.latlng);
      onChange?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const MapPicker = ({ defaultLat = 40.4093, defaultLng = 49.8671, onChange, readOnly = false }) => {
  const initialPosition = { lat: defaultLat, lng: defaultLng };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={13}
        scrollWheelZoom={!readOnly}
        doubleClickZoom={!readOnly}
        dragging={!readOnly}
        zoomControl={!readOnly}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeMapView center={[defaultLat, defaultLng]} />
        {readOnly ? (
          <Marker position={[defaultLat, defaultLng]} />
        ) : (
          <LocationMarker initialPosition={initialPosition} onChange={onChange} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPicker;
