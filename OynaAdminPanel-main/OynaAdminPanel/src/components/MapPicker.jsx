import React, { useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
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

const LocationMarker = ({ initialPosition, onChange }) => {
  const [position, setPosition] = useState(initialPosition);

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
        {readOnly ? <Marker position={[defaultLat, defaultLng]} /> : <LocationMarker initialPosition={initialPosition} onChange={onChange} />}
      </MapContainer>
    </div>
  );
};

export default MapPicker;
