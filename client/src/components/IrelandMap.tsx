import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InstallationRequest {
  id: number;
  address: string;
  status: string;
  leadFee: number;
  serviceType: string;
  tvSize: string;
}

interface IrelandMapProps {
  requests: InstallationRequest[];
  onRequestSelect?: (request: InstallationRequest) => void;
  selectedRequest?: InstallationRequest | null;
  className?: string;
}

const IrelandMap: React.FC<IrelandMapProps> = ({
  requests,
  onRequestSelect,
  selectedRequest,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // County coordinate mapping for Ireland
  const countyCoordinates: { [key: string]: [number, number] } = {
    'dublin': [53.3498, -6.2603],
    'cork': [51.8985, -8.4756],
    'galway': [53.2707, -9.0568],
    'limerick': [52.6638, -8.6267],
    'waterford': [52.2583, -7.1119],
    'kilkenny': [52.6541, -7.2448],
    'wexford': [52.3369, -6.4633],
    'carlow': [52.8406, -6.9267],
    'laois': [53.0344, -7.3019],
    'offaly': [53.2734, -7.7940],
    'kildare': [53.1639, -6.9111],
    'wicklow': [52.9810, -6.0448],
    'meath': [53.6055, -6.6802],
    'louth': [53.9474, -6.5372],
    'monaghan': [54.2497, -6.9681],
    'cavan': [53.9901, -7.3601],
    'longford': [53.7244, -7.7956],
    'westmeath': [53.5362, -7.3386],
    'roscommon': [53.6279, -8.1951],
    'sligo': [54.2766, -8.4761],
    'leitrim': [54.0239, -8.0658],
    'donegal': [54.9896, -8.1306],
    'mayo': [53.8580, -9.2957],
    'clare': [52.8466, -8.9860],
    'tipperary': [52.4731, -8.1600],
    'kerry': [52.1662, -9.7024],
    'antrim': [54.7877, -6.0621],
    'armagh': [54.3503, -6.6528],
    'down': [54.3290, -5.8900],
    'fermanagh': [54.3576, -7.6346],
    'tyrone': [54.5973, -7.3111],
    'derry': [54.7877, -7.3074]
  };

  const getCountyFromAddress = (address: string): string => {
    const lowerAddress = address.toLowerCase();
    for (const county of Object.keys(countyCoordinates)) {
      if (lowerAddress.includes(county)) {
        return county;
      }
    }
    return 'dublin'; // Default fallback
  };

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'urgent': return '#ef4444';
      case 'emergency': return '#dc2626';
      case 'standard': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Ireland
    const map = L.map(mapRef.current, {
      center: [53.1424, -7.6921], // Center of Ireland
      zoom: 7,
      minZoom: 6,
      maxZoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Set bounds to Ireland
    const irelandBounds = L.latLngBounds(
      L.latLng(51.222, -10.669), // Southwest corner
      L.latLng(55.636, -5.452)   // Northeast corner
    );
    map.setMaxBounds(irelandBounds);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for each request
    requests.forEach(request => {
      const county = getCountyFromAddress(request.address);
      const coordinates = countyCoordinates[county];
      
      if (coordinates) {
        // Create custom icon
        const customIcon = L.divIcon({
          html: `<div style="
            background-color: ${getMarkerColor(request.status)};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
          ">€${request.leadFee}</div>`,
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker(coordinates, { icon: customIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(`
            <div style="font-size: 14px; line-height: 1.4;">
              <strong>${request.address}</strong><br>
              <span style="color: #666;">€${request.leadFee} lead fee</span><br>
              <span style="color: #666;">${request.tvSize}" ${request.serviceType}</span><br>
              <span style="color: ${getMarkerColor(request.status)}; font-weight: bold; text-transform: uppercase;">${request.status}</span>
            </div>
          `)
          .on('click', () => {
            if (onRequestSelect) {
              onRequestSelect(request);
            }
          });

        markersRef.current.push(marker);

        // Highlight selected request
        if (selectedRequest?.id === request.id) {
          marker.openPopup();
        }
      }
    });
  }, [requests, selectedRequest, onRequestSelect]);

  return (
    <div className={`w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg border-2 border-green-300" />
    </div>
  );
};

export default IrelandMap;