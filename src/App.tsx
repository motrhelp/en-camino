import { Add as AddIcon, Close as CloseIcon, Logout as LogoutIcon } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Drawer,
  Fab,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme
} from '@mui/material';
import { AddPointDialog } from './AddPointDialog';
import { CrosshairOverlay } from './CrosshairOverlay';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import { logout, onAuthChange } from './firebase';
import { testFirestoreConnection } from './firebase';

// Mock data for the travel journal
const mockPosts = [
  {
    id: 1,
    title: "Vlissingen",
    date: "2025-04-26",
    snippet: "Start by the sea.",
    photo: "/images/vlissingen.png",
    coordinates: [51.4420, 3.5730],
    isCurrent: false
  },
  {
    id: 2,
    title: "Watervliet",
    date: "2025-04-27",
    snippet: "Into Belgium. Fields and canals.",
    photo: "/images/watervliet.png",
    coordinates: [51.2570, 3.6420],
    isCurrent: false
  },
  {
    id: 3,
    title: "Eeklo",
    date: "2025-04-28",
    snippet: "Quiet town, good coffee.",
    photo: "/images/eeklo.png",
    coordinates: [51.1860, 3.5560],
    isCurrent: false
  },
  {
    id: 4,
    title: "Gent",
    date: "2025-04-29",
    snippet: "Arrived in the city.",
    photo: "/images/gent.png",
    coordinates: [51.0540, 3.7170],
    isCurrent: true
  }
];

// Mock path coordinates for the route (ordered by taken_at)
const pathCoordinates = [
  [51.4420, 3.5730], // Vlissingen
  [51.2570, 3.6420], // Watervliet
  [51.1860, 3.5560], // Eeklo
  [51.0540, 3.7170], // Gent (current)
];

function App() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [addPointOpen, setAddPointOpen] = useState(false);
  const [positioningMode, setPositioningMode] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [user, setUser] = useState<any>(null);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // Authentication state management (only for admin features)
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Test Firestore connection
  useEffect(() => {
    const unsubscribe = testFirestoreConnection();
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

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

      // Add path line
      map.current.on('load', () => {
        if (!map.current) return;

        // Add path source
        map.current.addSource('path', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: pathCoordinates.map(coord => [coord[1], coord[0]]) // [lon, lat]
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

        // Fit map to show all points
        const bounds = new maplibregl.LngLatBounds();
        pathCoordinates.forEach(coord => {
          bounds.extend([coord[1], coord[0]]); // [lon, lat]
        });
        map.current.fitBounds(bounds, { padding: 180, duration: 800 });

        // Add pins
        mockPosts.forEach((post, index) => {
          const pinId = `pin-${post.id}`;
          
          // Add pin source
          map.current!.addSource(pinId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {
                id: post.id,
                title: post.title,
                isCurrent: post.isCurrent
              },
              geometry: {
                type: 'Point',
                coordinates: [post.coordinates[1], post.coordinates[0]] // [lon, lat]
              }
            }
          });

          // Add pin layer
          map.current!.addLayer({
            id: pinId,
            type: 'circle',
            source: pinId,
            paint: {
              'circle-radius': post.isCurrent ? 12 : 8,
              'circle-color': selectedPost === post.id ? '#000000' : (post.isCurrent ? '#ff6b6b' : '#666666'),
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 3,
              'circle-opacity': 0.9
            }
          });

          // Add pulsing effect for current location
          if (post.isCurrent) {
            map.current!.addLayer({
              id: `${pinId}-pulse`,
              type: 'circle',
              source: pinId,
              paint: {
                'circle-radius': 20,
                'circle-color': '#ff6b6b',
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
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update pin colors when selectedPost changes
  useEffect(() => {
    if (!map.current) return;

    mockPosts.forEach((post) => {
      const pinId = `pin-${post.id}`;
      const layer = map.current!.getLayer(pinId);
      
      if (layer) {
        map.current!.setPaintProperty(pinId, 'circle-color', 
          selectedPost === post.id ? '#000000' : (post.isCurrent ? '#ff6b6b' : '#666666')
        );
        map.current!.setPaintProperty(pinId, 'circle-stroke-color', '#ffffff');
      }
    });
  }, [selectedPost]);

  // Pulsing animation for current location
  useEffect(() => {
    if (!map.current) return;

    const pulseId = 'pin-4-pulse'; // Current location pin
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
  }, []);

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

  const handlePostClick = (postId: number) => {
    setSelectedPost(postId);
    if (isMobile) {
      setTimelineOpen(false);
    }

    // Fly to the selected location
    if (map.current) {
      const post = mockPosts.find(p => p.id === postId);
      if (post) {
        map.current.flyTo({
          center: [post.coordinates[1], post.coordinates[0]],
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

  const TimelinePanel = () => (
    <Box
      sx={{
        width: isMobile ? '100%' : 400,
        height: isMobile ? '60vh' : '100vh',
        backgroundColor: 'background.paper',
        boxShadow: isMobile ? '0px -4px 20px rgba(0,0,0,0.1)' : '4px 0px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Journey Timeline
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton onClick={() => setTimelineOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {mockPosts.map((post) => (
          <Card
            key={post.id}
            sx={{
              mb: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: selectedPost === post.id ? '2px solid' : '1px solid',
              borderColor: selectedPost === post.id ? 'primary.main' : 'divider',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              },
            }}
            onClick={() => handlePostClick(post.id)}
          >
            <CardMedia
              component="img"
              height="140"
              image={post.photo}
              alt={post.title}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {new Date(post.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
                {post.isCurrent && (
                  <Chip
                    label="Current"
                    size="small"
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {post.snippet}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100dvh', // Dynamic viewport height for iOS Safari
      position: 'relative', 
      overflow: 'hidden',
      paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
    }}>
      <AddPointDialog open={addPointOpen} onClose={handleCloseAddPoint} coordinates={selectedCoordinates} />
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

      {/* Timeline Panel */}
      {!isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            zIndex: 1000,
          }}
        >
          <TimelinePanel />
        </Box>
      )}

      {/* Mobile Timeline Drawer */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh',
            },
          }}
        >
          <TimelinePanel />
        </Drawer>
      )}

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
