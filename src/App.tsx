import { Add as AddIcon, Close as CloseIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
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
import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import { useTheme } from './ThemeContext';

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
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

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
            'line-color': isDarkMode ? '#ffffff' : '#000000',
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
            'circle-color': selectedPost === post.id ? (isDarkMode ? '#ffffff' : '#000000') : (post.isCurrent ? '#ff6b6b' : (isDarkMode ? '#cccccc' : '#666666')),
            'circle-stroke-color': isDarkMode ? '#000000' : '#ffffff',
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
          selectedPost === post.id ? (isDarkMode ? '#ffffff' : '#000000') : (post.isCurrent ? '#ff6b6b' : (isDarkMode ? '#cccccc' : '#666666'))
        );
        map.current!.setPaintProperty(pinId, 'circle-stroke-color', 
          isDarkMode ? '#000000' : '#ffffff'
        );
      }
    });
  }, [selectedPost, isDarkMode]);

  // Update path line color when theme changes
  useEffect(() => {
    if (!map.current) return;

    const pathLayer = map.current.getLayer('path-line');
    if (pathLayer) {
      map.current.setPaintProperty('path-line', 'line-color', 
        isDarkMode ? '#ffffff' : '#000000'
      );
    }
  }, [isDarkMode]);

  // Pulsing animation for current location
  useEffect(() => {
    if (!map.current) return;

    const currentPost = mockPosts.find(post => post.isCurrent);
    if (!currentPost) return;

    const pulseId = `pin-${currentPost.id}-pulse`;
    const layer = map.current.getLayer(pulseId);
    if (!layer) return;

    let animationId: number;
    let phase = 0;

    const animate = () => {
      phase += 0.1;
      const opacity = 0.3 * (1 + Math.sin(phase) * 0.5);
      const radius = 20 + Math.sin(phase) * 5;

      map.current!.setPaintProperty(pulseId, 'circle-opacity', opacity);
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
    // TODO: Implement add post functionality
    console.log('Add post clicked');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    
    if (map.current) {
      const newTiles = isDarkMode ? [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      ] : [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ];
      
      const source = map.current.getSource('cartodb') as maplibregl.RasterTileSource;
      if (source) {
        source.setTiles(newTiles);
      }
    }
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
          <IconButton
            onClick={handleThemeToggle}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
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
          gap: 2,
          ...(isDarkMode && {
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
          }),
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 300,
            color: isDarkMode ? 'white' : 'grey.800',
            fontFamily: '"Playfair Display", serif',
            letterSpacing: '0.5px',
          }}
        >
          1.5 million steps · Day 4 ·57 km
        </Typography>
        {!isMobile && (
          <IconButton
            onClick={handleThemeToggle}
            sx={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
              color: isDarkMode ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        )}
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

      {/* Floating Action Button */}
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
              backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              color: isDarkMode ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 1)' : 'rgba(255, 255, 255, 1)',
              },
            }}
          />
          <IconButton
            onClick={handleThemeToggle}
            sx={{
              backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              color: isDarkMode ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 1)' : 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default App;
