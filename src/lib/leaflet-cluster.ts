import L from 'leaflet';

// leaflet.markercluster requires global window.L
if (typeof window !== 'undefined') {
  (window as unknown as { L: typeof L }).L = L;
}

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

export default L;
