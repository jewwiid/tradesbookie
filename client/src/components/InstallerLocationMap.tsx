import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Star, CheckCircle } from 'lucide-react';

// Fix for default markers in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Installer {
  id: number;
  businessName: string;
  serviceArea: string;
  address: string;
  contactName: string;
  isAvailable: boolean;
  insurance: string;
  profileImageUrl?: string;
  yearsExperience?: number;
  expertise?: string[];
}

interface InstallerLocationMapProps {
  installers: Installer[];
  onInstallerSelect?: (installer: Installer) => void;
  selectedInstaller?: Installer | null;
  className?: string;
  height?: string;
}

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
  'antrim': [54.7877, -6.0581],
  'armagh': [54.3503, -6.6528],
  'down': [54.3294, -5.8542],
  'fermanagh': [54.4594, -7.6347],
  'londonderry': [54.9958, -7.3086],
  'tyrone': [54.6064, -7.1106]
};

const InstallerLocationMap: React.FC<InstallerLocationMapProps> = ({
  installers,
  onInstallerSelect,
  selectedInstaller,
  className = '',
  height = '500px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Get coordinates for installer based on service area
  const getInstallerCoordinates = (installer: Installer): [number, number] | null => {
    const area = installer.serviceArea?.toLowerCase();
    if (!area) return null;

    // Try to find exact match first
    if (countyCoordinates[area]) {
      return countyCoordinates[area];
    }

    // Try to find partial match
    for (const [county, coords] of Object.entries(countyCoordinates)) {
      if (area.includes(county) || county.includes(area)) {
        return coords;
      }
    }

    return null;
  };

  // Create custom icon for installers
  const createInstallerIcon = (installer: Installer) => {
    const isAvailable = installer.isAvailable;
    const hasInsurance = installer.insurance && installer.insurance.trim() !== '';
    
    // Create a custom HTML icon
    const iconHtml = `
      <div class="installer-marker" style="
        width: 40px;
        height: 40px;
        background: ${isAvailable ? '#10b981' : '#6b7280'};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${isAvailable ? '#10b981' : '#6b7280'}" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        ${hasInsurance ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background: #059669;
            border-radius: 50%;
            border: 2px solid white;
          "></div>
        ` : ''}
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'installer-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
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

    // Add markers for each installer
    installers.forEach(installer => {
      const coords = getInstallerCoordinates(installer);
      if (!coords) return;

      const marker = L.marker(coords, {
        icon: createInstallerIcon(installer)
      });

      // Create popup content
      const popupContent = `
        <div class="installer-popup" style="min-width: 200px; font-family: system-ui;">
          <div style="text-align: center; margin-bottom: 8px;">
            ${installer.profileImageUrl ? `
              <img src="${installer.profileImageUrl}" alt="${installer.businessName}" 
                   style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-bottom: 8px;">
            ` : `
              <div style="
                width: 60px; 
                height: 60px; 
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 18px;
                margin: 0 auto 8px;
              ">
                ${installer.contactName?.split(' ').map(n => n[0]).join('') || 'TV'}
              </div>
            `}
          </div>
          
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
            ${installer.businessName}
          </h3>
          
          <div style="margin-bottom: 8px; color: #6b7280; font-size: 14px;">
            <strong>Service Area:</strong> ${installer.serviceArea}
          </div>
          
          <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            <div style="
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
              background: ${installer.isAvailable ? '#dcfce7' : '#f3f4f6'};
              color: ${installer.isAvailable ? '#166534' : '#6b7280'};
            ">
              ${installer.isAvailable ? '🟢 Available' : '🔴 Offline'}
            </div>
            
            ${installer.insurance && installer.insurance.trim() !== '' ? `
              <div style="
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                background: #dcfce7;
                color: #166534;
              ">
                ✓ Insured
              </div>
            ` : ''}
          </div>
          
          ${installer.yearsExperience ? `
            <div style="margin-bottom: 8px; color: #6b7280; font-size: 14px;">
              <strong>Experience:</strong> ${installer.yearsExperience} years
            </div>
          ` : ''}
          
          <div style="margin-top: 12px; text-align: center;">
            <button onclick="window.location.href='/booking'" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              width: 100%;
            ">
              Book Installation
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        if (onInstallerSelect) {
          onInstallerSelect(installer);
        }
      });

      mapInstanceRef.current!.addLayer(marker);
      markersRef.current.push(marker);

      // Highlight selected installer
      if (selectedInstaller?.id === installer.id) {
        marker.openPopup();
      }
    });
  }, [installers, selectedInstaller, onInstallerSelect]);

  return (
    <div className={`w-full relative overflow-hidden ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg border-2 border-gray-200 shadow-lg" style={{ minHeight: height }} />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg border text-sm">
        <div className="font-semibold text-gray-900 mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border border-white"></div>
            <span className="text-gray-700">Available Installer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full border border-white"></div>
            <span className="text-gray-700">Offline Installer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border border-white relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-600 rounded-full border border-white"></div>
            </div>
            <span className="text-gray-700">Insured</span>
          </div>
        </div>
      </div>
      
      {/* Installer Count */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 p-2 rounded-lg shadow-lg border text-sm font-medium text-gray-700">
        {installers.length} Installer{installers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default InstallerLocationMap;