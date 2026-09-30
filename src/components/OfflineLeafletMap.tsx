import React, { useEffect, useRef, useState } from 'react';
import L from '../lib/leaflet-cluster';
import { 
  MapPin, 
  Layers, 
  Navigation, 
  Phone, 
  ExternalLink, 
  RotateCcw,
  WifiOff,
  Flame,
  ShieldAlert,
  Boxes,
  ZoomIn,
  Eye,
  EyeOff
} from 'lucide-react';
import { IncidentReport, LocationInfo, NearbyEmergencyService } from '../types';
import { NEARBY_SERVICES_SAMPLE } from '../data/initialData';

interface OfflineLeafletMapProps {
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  reports: IncidentReport[];
  shelters?: NearbyEmergencyService[];
  onSelectReport?: (report: IncidentReport) => void;
}

export const OfflineLeafletMap: React.FC<OfflineLeafletMapProps> = ({
  location,
  onRequestLocation,
  reports,
  shelters = NEARBY_SERVICES_SAMPLE,
  onSelectReport,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const rawMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const sheltersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.LayerGroup | null>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isClusteringEnabled, setIsClusteringEnabled] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'report' | 'shelter';
    data: IncidentReport | NearbyEmergencyService;
  } | null>(null);
  const [clusterNotice, setClusterNotice] = useState<{
    count: number;
    hasCritical: boolean;
    criticalCount: number;
    typesSummary: string;
  } | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Map and Layers
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: User location or Central Delhi
    const defaultCenter: [number, number] = location 
      ? [location.lat, location.lng]
      : [28.6139, 77.2090];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark-friendly OpenStreetMap tile layer
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    });
    tileLayer.addTo(map);

    // 1. Cluster Group for Incident Reports
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: (zoom: number) => {
        // Dynamic urban density clustering: tighter clusters when zoomed in
        if (zoom >= 16) return 30;
        if (zoom >= 14) return 50;
        return 75;
      },
      spiderfyOnMaxZoom: true,
      spiderfyDistanceMultiplier: 1.6,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      chunkedLoading: true,
      polygonOptions: {
        fillColor: '#ef4444',
        color: '#f87171',
        weight: 2,
        opacity: 0.85,
        fillOpacity: 0.16,
        dashArray: '5, 5',
      },
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        const markers = cluster.getAllChildMarkers();

        let criticalCount = 0;
        let floodCount = 0;
        let crimeCount = 0;
        let garbageCount = 0;

        markers.forEach((m: L.Marker & { options: { incidentData?: IncidentReport } }) => {
          const inc = m.options.incidentData;
          if (inc?.severity === 'critical') criticalCount++;
          if (inc?.type === 'flood') floodCount++;
          if (inc?.type === 'crime') crimeCount++;
          if (inc?.type === 'garbage') garbageCount++;
        });

        const hasCritical = criticalCount > 0;

        // Visual cluster styling:
        // Critical alerts get high-visibility crimson pulse; flood-heavy get oceanic cyan; else tactical amber
        let bgGradient = 'from-amber-500 via-amber-600 to-amber-700';
        let ringColor = 'border-amber-300';
        let glowShadow = 'shadow-amber-500/50';
        let primaryIcon = '⚠️';
        let label = 'Hazards';

        if (hasCritical) {
          bgGradient = 'from-red-600 via-rose-600 to-red-800';
          ringColor = 'border-red-400';
          glowShadow = 'shadow-red-600/70';
          primaryIcon = '🚨';
          label = 'Critical';
        } else if (floodCount >= Math.ceil(markers.length / 2)) {
          bgGradient = 'from-cyan-500 via-blue-600 to-blue-800';
          ringColor = 'border-cyan-300';
          glowShadow = 'shadow-cyan-500/60';
          primaryIcon = '🌊';
          label = 'Floods';
        }

        // Scale cluster diameter with count
        let size = 42;
        if (count >= 10) size = 52;
        else if (count >= 5) size = 46;

        return L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group" style="width:${size}px; height:${size}px;">
              ${hasCritical ? '<span class="absolute -inset-1 rounded-full bg-red-500/50 animate-ping"></span>' : ''}
              <div class="w-full h-full rounded-2xl bg-gradient-to-br ${bgGradient} text-white flex flex-col items-center justify-center shadow-xl ${glowShadow} border-2 ${ringColor} transition-transform group-hover:scale-110">
                <div class="flex items-center gap-0.5 leading-none">
                  <span class="text-[11px] drop-shadow">${primaryIcon}</span>
                  <span class="font-mono font-black text-xs text-white drop-shadow">${count}</span>
                </div>
                <span class="text-[7.5px] font-black uppercase tracking-wider text-white/90 leading-tight">
                  ${label}
                </span>
              </div>
            </div>
          `,
          className: 'safe-bharat-cluster-marker',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    // Notify user when inspecting an urban cluster
    clusterGroup.on('clusterclick', (e: { layer: L.MarkerCluster }) => {
      const cluster = e.layer;
      const count = cluster.getChildCount();
      const markers = cluster.getAllChildMarkers();
      let critCount = 0;
      const typesSet = new Set<string>();

      markers.forEach((m: L.Marker & { options: { incidentData?: IncidentReport } }) => {
        const inc = m.options.incidentData;
        if (inc?.severity === 'critical') critCount++;
        if (inc?.type) typesSet.add(inc.type);
      });

      setClusterNotice({
        count,
        hasCritical: critCount > 0,
        criticalCount: critCount,
        typesSummary: Array.from(typesSet).join(' · '),
      });
    });

    // 2. Fallback layer for raw unclustered view
    const rawMarkersLayer = L.layerGroup();

    // 3. Dedicated layer for Safe Shelters & Hospitals
    const sheltersLayer = L.layerGroup().addTo(map);

    // 4. User GPS Layer
    const userLayer = L.layerGroup().addTo(map);

    // Add cluster group to map by default
    clusterGroup.addTo(map);

    clusterGroupRef.current = clusterGroup;
    rawMarkersLayerRef.current = rawMarkersLayer;
    sheltersLayerRef.current = sheltersLayer;
    userMarkerRef.current = userLayer;
    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location pin
  useEffect(() => {
    if (!mapInstanceRef.current || !userMarkerRef.current) return;
    userMarkerRef.current.clearLayers();

    if (location) {
      const userLatLng: [number, number] = [location.lat, location.lng];

      // Accuracy circle
      const accCircle = L.circle(userLatLng, {
        radius: Math.max(location.accuracy || 40, 30),
        color: '#38bdf8',
        fillColor: '#0284c7',
        fillOpacity: 0.15,
        weight: 1.5,
      });

      // Custom pulsing user icon
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping"></span>
            <span class="relative w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker(userLatLng, { icon: userIcon });
      userMarker.bindPopup(`
        <div class="p-2 text-xs space-y-1">
          <strong class="text-blue-400 block font-bold">📍 Your Live GPS Position</strong>
          <div>Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}</div>
          <div class="text-[10px] text-slate-400">Accuracy: ±${Math.round(location.accuracy)} meters</div>
        </div>
      `);

      userMarkerRef.current.addLayer(accCircle);
      userMarkerRef.current.addLayer(userMarker);
    }
  }, [location]);

  // Update incident and shelter markers whenever reports, filter, or clustering mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;
    const rawLayer = rawMarkersLayerRef.current;
    const sheltersLayer = sheltersLayerRef.current;

    if (!map || !clusterGroup || !rawLayer || !sheltersLayer) return;

    // Reset both incident layers
    clusterGroup.clearLayers();
    rawLayer.clearLayers();

    // Toggle layer attachment based on isClusteringEnabled
    if (isClusteringEnabled) {
      if (map.hasLayer(rawLayer)) map.removeLayer(rawLayer);
      if (!map.hasLayer(clusterGroup)) map.addLayer(clusterGroup);
    } else {
      if (map.hasLayer(clusterGroup)) map.removeLayer(clusterGroup);
      if (!map.hasLayer(rawLayer)) map.addLayer(rawLayer);
    }

    const activeTargetGroup = isClusteringEnabled ? clusterGroup : rawLayer;

    // 1. Render Reported Incidents into the active target layer
    reports.forEach((rep) => {
      // Check filter
      if (activeCategoryFilter !== 'all' && activeCategoryFilter !== 'incidents' && activeCategoryFilter !== rep.type) {
        return;
      }

      const lat = rep.location?.lat;
      const lng = rep.location?.lng;
      if (!lat || !lng) return;

      const isCritical = rep.severity === 'critical';

      let markerBg = 'bg-amber-500';
      let iconEmoji = '⚠️';
      if (rep.type === 'flood') {
        markerBg = 'bg-cyan-500';
        iconEmoji = '🌊';
      } else if (rep.type === 'crime') {
        markerBg = 'bg-red-500';
        iconEmoji = '🚨';
      } else if (rep.type === 'garbage') {
        markerBg = 'bg-orange-500';
        iconEmoji = '🗑️';
      } else if (rep.type === 'environment') {
        markerBg = 'bg-emerald-500';
        iconEmoji = '🌳';
      }

      const repIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer group">
            ${isCritical ? '<span class="absolute w-10 h-10 rounded-full bg-red-500/50 animate-ping"></span>' : ''}
            <div class="w-8 h-8 rounded-2xl ${markerBg} text-white flex items-center justify-center shadow-xl border-2 border-slate-900 group-hover:scale-110 transition-transform text-xs font-bold">
              ${iconEmoji}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Attach custom options for cluster analysis
      const marker = L.marker([lat, lng], { 
        icon: repIcon,
        // @ts-expect-error Custom option attached for cluster icon calculation
        incidentData: rep,
      });

      marker.on('click', () => {
        setSelectedItem({ type: 'report', data: rep });
        if (onSelectReport) onSelectReport(rep);
      });

      marker.bindPopup(`
        <div class="p-2.5 max-w-xs space-y-1.5 text-xs text-slate-100">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
              rep.severity === 'critical' ? 'bg-red-500/30 text-red-300' : 'bg-amber-500/30 text-amber-300'
            }">${rep.severity}</span>
            <span class="text-[10px] text-slate-400 font-mono">${rep.id}</span>
          </div>
          <strong class="font-bold text-white block text-sm">${rep.title}</strong>
          <p class="text-slate-300 line-clamp-2">${rep.description}</p>
          <div class="text-[10px] text-slate-400">📍 ${rep.location.address}</div>
          <div class="pt-1 flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
            <span>Status: ${rep.status}</span>
            <span>Upvotes: ${rep.upvotes || 1} 👍</span>
          </div>
        </div>
      `);

      activeTargetGroup.addLayer(marker);
    });

    // 2. Render Nearby Emergency Shelters & Hospitals (Always distinct, unclustered safe havens)
    sheltersLayer.clearLayers();
    shelters.forEach((shelter) => {
      // Check filter
      if (activeCategoryFilter !== 'all' && activeCategoryFilter !== 'shelters' && activeCategoryFilter !== shelter.type) {
        return;
      }

      if (!shelter.lat || !shelter.lng) return;

      const isHospital = shelter.type === 'hospital';
      const isPolice = shelter.type === 'police';
      const isShelter = shelter.type === 'shelter';

      let bg = 'bg-blue-600';
      let symbol = '🛡️';
      if (isHospital) {
        bg = 'bg-rose-600';
        symbol = '🏥';
      } else if (isPolice) {
        bg = 'bg-indigo-600';
        symbol = '👮';
      } else if (isShelter) {
        bg = 'bg-emerald-600';
        symbol = '🏠';
      }

      const shelterIcon = L.divIcon({
        className: 'custom-shelter-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer group">
            <div class="w-8 h-8 rounded-2xl ${bg} text-white flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform text-xs font-bold">
              ${symbol}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon });

      marker.on('click', () => {
        setSelectedItem({ type: 'shelter', data: shelter });
      });

      marker.bindPopup(`
        <div class="p-2.5 max-w-xs space-y-1.5 text-xs text-slate-100">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/20 text-blue-300">
              ${shelter.type}
            </span>
            <span class="text-[10px] text-emerald-400 font-mono">24x7 Active</span>
          </div>
          <strong class="font-bold text-white block text-sm">${shelter.name}</strong>
          <p class="text-slate-300">${shelter.address}</p>
          ${shelter.capacity ? `<div class="text-[11px] text-emerald-300 font-semibold">Capacity: ~${shelter.capacity} Beds / evacuees</div>` : ''}
          ${shelter.facilities ? `<div class="text-[10px] text-slate-400">Facilities: ${shelter.facilities.join(', ')}</div>` : ''}
          <div class="pt-1.5">
            <a href="tel:${shelter.phone}" class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs">
              📞 Direct Call (${shelter.phone})
            </a>
          </div>
        </div>
      `);

      sheltersLayer.addLayer(marker);
    });
  }, [reports, shelters, activeCategoryFilter, isClusteringEnabled]);

  const handleCenterOnLocation = async () => {
    setIsLocating(true);
    let target = location;
    if (!target) {
      target = await onRequestLocation();
    }
    setIsLocating(false);

    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 15, { duration: 1.2 });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      if (location) {
        mapInstanceRef.current.flyTo([location.lat, location.lng], 14, { duration: 1 });
      } else {
        mapInstanceRef.current.flyTo([28.6139, 77.2090], 14, { duration: 1 });
      }
    }
  };

  const totalShelters = shelters.length;
  const criticalReports = reports.filter(r => r.severity === 'critical').length;

  return (
    <section className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                Disaster &amp; Incident Geospatial Map
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isOfflineMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {isOfflineMode ? 'Offline Resilient' : 'Live Map'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive GIS visualization with automatic density clustering for incident reports across dense urban sectors.
            </p>
          </div>
        </div>

        {/* Tactical Stats Badge with Clustering Status */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-2xl border border-slate-800 text-xs self-start sm:self-auto font-mono">
          <span className="text-emerald-400 font-bold">{totalShelters} Safe Shelters</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400 font-bold">{reports.length} Incidents</span>
          <span className="text-slate-600">·</span>
          <span className="text-red-400 font-bold">{criticalReports} Critical</span>
        </div>
      </div>

      {/* Filter and Layer Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          {[
            { id: 'all', label: 'All Markers' },
            { id: 'shelters', label: '🏠 Safe Shelters & Hospitals' },
            { id: 'flood', label: '🌊 Flood & Waterlogging' },
            { id: 'crime', label: '🚨 Public Safety' },
            { id: 'garbage', label: '🗑️ Waste Dumps' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveCategoryFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategoryFilter === f.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Map View Controls & Cluster Engine Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Density Clustering Toggle Button */}
          <button
            onClick={() => setIsClusteringEnabled(!isClusteringEnabled)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
              isClusteringEnabled
                ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/60'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isClusteringEnabled ? 'Marker Clustering Active: Click to show all raw markers' : 'Click to enable marker clustering for dense urban areas'}
          >
            <Boxes className={`w-3.5 h-3.5 ${isClusteringEnabled ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden xs:inline">Clustering:</span>
            <span className={`font-mono ${isClusteringEnabled ? 'text-indigo-300' : 'text-slate-500'}`}>
              {isClusteringEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={handleCenterOnLocation}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            title="Recenter on My GPS Position"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">My Location</span>
          </button>

          <button
            onClick={handleResetView}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graphical Leaflet Map Viewport Container */}
      <div className="relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden border border-slate-800 shadow-inner">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Tactical HUD Overlay Elements */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1.5 max-w-[80%]">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 font-mono shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEO-RADAR: ACTIVE (LEAFLET CLUSTER ENGINE)</span>
          </div>

          {isClusteringEnabled && (
            <div className="px-2.5 py-1 rounded-lg bg-indigo-950/85 backdrop-blur-md border border-indigo-600/40 text-[10px] text-indigo-200 font-mono shadow-md flex items-center gap-1.5">
              <Boxes className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>DENSE URBAN CLUSTERING ACTIVE (SPIDERFY AT MAX ZOOM)</span>
            </div>
          )}

          {location && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 font-mono shadow-md hidden sm:block">
              GPS: {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E (±${Math.round(location.accuracy)}m)
            </div>
          )}
        </div>

        {/* Dynamic Cluster Inspection Toast / Banner */}
        {clusterNotice && (
          <div className="absolute top-3 right-3 z-10 max-w-xs p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-indigo-500/50 text-xs text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-indigo-400 shrink-0" />
                <strong className="text-indigo-300 font-bold">Urban Cluster Inspected</strong>
              </div>
              <button
                onClick={() => setClusterNotice(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-slate-300 text-[11px] leading-tight">
              Found <strong className="text-white font-mono">{clusterNotice.count} incidents</strong> clustered in this sector ({clusterNotice.typesSummary}).
            </p>
            {clusterNotice.hasCritical && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-300 font-bold bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-700/50">
                <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                <span>Includes {clusterNotice.criticalCount} Critical Emergency Hazard(s)</span>
              </div>
            )}
            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
              <ZoomIn className="w-3 h-3 text-cyan-400" />
              <span>Zoom in to view street-level spiderfied pins</span>
            </div>
          </div>
        )}

        {/* Offline notice stamp if offline */}
        {isOfflineMode && (
          <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-amber-950/90 backdrop-blur-md border border-amber-600/60 text-xs text-amber-200 flex items-center gap-2 shadow-lg">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>Offline Map Mode: Incident coordinates loaded from local device storage.</span>
          </div>
        )}

        {/* Map Legend (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-10 p-2.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 space-y-1 shadow-lg hidden xs:block">
          <div className="font-bold text-white uppercase tracking-wider text-[9px] border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>Map Legend</span>
            <span className="text-indigo-400 font-mono">v2.1</span>
          </div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Your GPS Location</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Clustered Sector Badge</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Safe Evacuation Shelter</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Trauma Hospital</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Flooded Road / Underpass</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical Public Hazard</div>
        </div>
      </div>

      {/* Selected Marker Detail Card (Thumb-Friendly Drawer) */}
      {selectedItem && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                selectedItem.type === 'shelter'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {selectedItem.type === 'shelter' ? 'EMERGENCY SHELTER' : 'CITIZEN INCIDENT'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedItem.type === 'shelter' ? (selectedItem.data as NearbyEmergencyService).type : (selectedItem.data as IncidentReport).id}
              </span>
            </div>

            <h3 className="font-bold text-base text-white">
              {selectedItem.type === 'shelter' 
                ? (selectedItem.data as NearbyEmergencyService).name 
                : (selectedItem.data as IncidentReport).title}
            </h3>

            <p className="text-xs text-slate-300">
              {selectedItem.type === 'shelter'
                ? (selectedItem.data as NearbyEmergencyService).address
                : (selectedItem.data as IncidentReport).description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedItem.type === 'shelter' ? (
              <a
                href={`tel:${(selectedItem.data as NearbyEmergencyService).phone}`}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call ${(selectedItem.data as NearbyEmergencyService).phone}</span>
              </a>
            ) : (
              <a
                href={`https://www.google.com/maps?q=${(selectedItem.data as IncidentReport).location.lat},${(selectedItem.data as IncidentReport).location.lng}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Maps</span>
              </a>
            )}

            <button
              onClick={() => setSelectedItem(null)}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
