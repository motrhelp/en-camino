import { Add as AddIcon, Close as CloseIcon, Logout as LogoutIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  Drawer,
  Fab,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme
} from '@mui/material';
import { CrosshairOverlay } from './CrosshairOverlay';
import { Timeline } from './Timeline';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import { logout, onAuthChange } from './firebase';
import { useCaminoStore, CAMINO_ID } from './stores/caminoStore';
import { Point } from './types';
import { PointDialog } from './PointDialog';

function App() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [addPointOpen, setAddPointOpen] = useState(false);
  const [editPointOpen, setEditPointOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [positioningMode, setPositioningMode] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [user, setUser] = useState<any>(null);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { points, subscribeToPoints } = useCaminoStore();

  // Authentication state management (only for admin features)
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to points using Zustand store
  useEffect(() => {
    const unsubscribe = subscribeToPoints(CAMINO_ID);
    return () => unsubscribe();
  }, [subscribeToPoints]);

  // Log points when they are loaded
  useEffect(() => {
    if (points.length > 0) {
      console.log('✅ Points loaded from Firestore via Zustand:', points);
    }
  }, [points]);

  const handleLogout = async () => {
    await logout();
  };

  // Initialize map only once
  useEffect(() => {
    if (map.current) return; // initialize map only once

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'cartodb': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© CartoDB'
            }
          },
          layers: [
            {
              id: 'cartodb-tiles',
              type: 'raster',
              source: 'cartodb',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [3.62, 51.25], // Center of the route
        attributionControl: false
      });

      // Add path line when map loads
      map.current.on('load', () => {
        if (!map.current) return;

        // Add path source with empty data initially
        map.current.addSource('path', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [] // Empty initially
            }
          }
        });

        // Add path layer
        map.current.addLayer({
          id: 'path-line',
          type: 'line',
          source: 'path',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#000000',
            'line-width': 3,
            'line-dasharray': [2, 2],
            'line-opacity': 0.7
          }
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map when points change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || points.length === 0) return;

    // Update path
    const pathSource = map.current.getSource('path') as maplibregl.GeoJSONSource;
    if (pathSource) {
      pathSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: points.map(point => [point.coordinates.longitude, point.coordinates.latitude])
        }
      });
    }

    // Update bounds
    const bounds = new maplibregl.LngLatBounds();
    points.forEach(point => {
      bounds.extend([point.coordinates.longitude, point.coordinates.latitude]);
    });
    map.current.fitBounds(bounds, { padding: 180, duration: 800 });

    // Clear existing pins
    points.forEach(point => {
      const pinId = `pin-${point.id}`;
      if (map.current!.getLayer(pinId)) {
        map.current!.removeLayer(pinId);
      }
      if (map.current!.getLayer(`${pinId}-pulse`)) {
        map.current!.removeLayer(`${pinId}-pulse`);
      }
      if (map.current!.getSource(pinId)) {
        map.current!.removeSource(pinId);
      }
    });

    // Add new pins
    points.forEach((point, index) => {
      const pinId = `pin-${point.id}`;
      const isCurrent = index === points.length - 1;
      
      // Add pin source
      map.current!.addSource(pinId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            id: point.id,
            title: point.title,
            isCurrent: isCurrent
          },
          geometry: {
            type: 'Point',
            coordinates: [point.coordinates.longitude, point.coordinates.latitude]
          }
        }
      });

      // Add pin layer
      map.current!.addLayer({
        id: pinId,
        type: 'circle',
        source: pinId,
        paint: {
          'circle-radius': isCurrent ? 12 : 8,
          'circle-color': selectedPost === point.id ? muiTheme.palette.primary.main : (isCurrent ? muiTheme.palette.primary.main : muiTheme.palette.secondary.main),
          'circle-stroke-color': muiTheme.palette.background.default,
          'circle-stroke-width': 3,
          'circle-opacity': 0.9
        }
      });

      // Add pulsing effect for current location
      if (isCurrent) {
        map.current!.addLayer({
          id: `${pinId}-pulse`,
          type: 'circle',
          source: pinId,
          paint: {
            'circle-radius': 5,
            'circle-color': muiTheme.palette.warning.main,
            'circle-opacity': 0.3,
            'circle-stroke-width': 0
          }
        });
      }

      // Add click handler
      map.current!.on('click', pinId, (e) => {
        if (e.features && e.features[0]) {
          const postId = e.features[0].properties?.id;
          if (postId) {
            handlePostClick(postId);
          }
        }
      });

      // Add hover effects
      map.current!.on('mouseenter', pinId, () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });

      map.current!.on('mouseleave', pinId, () => {
        map.current!.getCanvas().style.cursor = '';
      });
    });
  }, [points, muiTheme.palette.primary.main, muiTheme.palette.secondary.main, muiTheme.palette.background.default, muiTheme.palette.warning.main]);

  // Update pin colors when selectedPost changes
  useEffect(() => {
    if (!map.current) return;

    points.forEach((point, index) => {
      const pinId = `pin-${point.id}`;
      const layer = map.current!.getLayer(pinId);
      const isCurrent = index === points.length - 1;
      
      if (layer) {
        map.current!.setPaintProperty(pinId, 'circle-color', 
          selectedPost === point.id ? muiTheme.palette.primary.main : (isCurrent ? muiTheme.palette.primary.main : muiTheme.palette.secondary.main)
        );
        map.current!.setPaintProperty(pinId, 'circle-stroke-color', muiTheme.palette.background.default);
      }
    });
  }, [selectedPost, points, muiTheme.palette.primary.main, muiTheme.palette.secondary.main, muiTheme.palette.background.default]);

  // Pulsing animation for current location
  useEffect(() => {
    if (!map.current || points.length === 0) return;

    const currentPoint = points[points.length - 1];
    const pulseId = `pin-${currentPoint.id}-pulse`;
    const layer = map.current.getLayer(pulseId);
    
    if (!layer) return;

    let animationId: number;
    let radius = 20;

    const animate = () => {
      radius = radius === 20 ? 40 : 20;
      map.current!.setPaintProperty(pulseId, 'circle-radius', radius);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [points]);

  // Update coordinates when map moves during positioning mode
  useEffect(() => {
    if (!map.current || !positioningMode) return;

    const handleMapMove = () => {
      const center = map.current!.getCenter();
      // Force re-render of CrosshairOverlay with new coordinates
      setSelectedCoordinates([center.lat, center.lng]);
    };

    map.current.on('move', handleMapMove);

    return () => {
      if (map.current) {
        map.current.off('move', handleMapMove);
      }
    };
  }, [positioningMode]);

  const handlePostClick = (postId: string) => {
    setSelectedPost(postId);
    if (isMobile) {
      setTimelineOpen(false);
    }

    // Fly to the selected location
    if (map.current) {
      const post = points.find(p => p.id === postId);
      if (post) {
        map.current.flyTo({
          center: [post.coordinates.longitude, post.coordinates.latitude],
          zoom: 10,
          duration: 1000
        });
      }
    }
  };

  const handleAddPost = () => {
    setPositioningMode(true);
    setSelectedCoordinates(null);
  };

  const handleCloseAddPoint = () => {
    setAddPointOpen(false);
    setPositioningMode(false);
    setSelectedCoordinates(null);
  };

  const handleConfirmLocation = () => {
    if (map.current) {
      const center = map.current.getCenter();
      setSelectedCoordinates([center.lat, center.lng]);
    }
    setPositioningMode(false);
    setAddPointOpen(true);
  };

  const handleEditPoint = (point: Point) => {
    setEditingPoint(point);
    setEditPointOpen(true);
  };

  const handleCloseEditPoint = () => {
    setEditPointOpen(false);
    setEditingPoint(null);
  };


  return (
    <Box sx={{ 
      height: '100dvh', // Dynamic viewport height for iOS Safari
      position: 'relative', 
      overflow: 'hidden',
      paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
    }}>
      {/* Add Point Dialog */}
      <PointDialog
        open={addPointOpen}
        mode="add"
        onClose={handleCloseAddPoint}
        coordinates={selectedCoordinates}
      />

      {/* Edit Point Dialog */}
      <PointDialog
        open={editPointOpen}
        mode="edit"
        onClose={handleCloseEditPoint}
        point={editingPoint}
      />
      {positioningMode && (
        <CrosshairOverlay 
          onConfirm={handleConfirmLocation}
          coordinates={map.current ? [map.current.getCenter().lat, map.current.getCenter().lng] : null}
        />
      )}
      {/* Map Container */}
      <Box
        ref={mapContainer}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />
      
      {/* Header Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          left: isMobile ? 24 : 24,
          right: isMobile ? 24 : 'auto',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          px: 3,
          py: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 300,
            color: 'grey.800',
            fontFamily: '"Playfair Display", serif',
            letterSpacing: '0.5px',
          }}
        >
          1.5 million steps · Day 4 ·57 km
        </Typography>
      </Box>

      {/* Timeline */}
      <Timeline
        points={points}
        selectedPost={selectedPost}
        isOpen={timelineOpen}
        isMobile={isMobile}
        onPostClick={handlePostClick}
        onClose={() => setTimelineOpen(false)}
        user={user}
        onEdit={handleEditPoint}
      />

      {/* Floating Action Button - Only for authenticated users */}
      {user && (
        <Fab
          color="primary"
          aria-label="add post"
          sx={{
            position: 'absolute',
            bottom: isMobile ? 'calc(24px + env(safe-area-inset-bottom))' : 24,
            right: isMobile ? 24 : 424, // Adjust for timeline panel on desktop
          }}
          onClick={handleAddPost}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Mobile Controls */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            bottom: isMobile ? 'calc(24px + env(safe-area-inset-bottom))' : 24,
            left: 24,
            zIndex: 1000,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Chip
            label="Timeline"
            onClick={() => setTimelineOpen(true)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
            }}
          />
          {user && (
            <IconButton
              onClick={handleLogout}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );
}

export default App;
