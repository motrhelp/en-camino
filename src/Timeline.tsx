import { Close as CloseIcon } from '@mui/icons-material';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
import { TimelineCard } from './TimelineCard';
import { Point } from './types';

interface TimelineProps {
  points: Point[];
  selectedPost: string | null;
  isOpen: boolean;
  isMobile: boolean;
  onPostClick: (id: string) => void;
  onClose: () => void;
}

export const Timeline = ({ 
  points, 
  selectedPost, 
  isOpen, 
  isMobile, 
  onPostClick, 
  onClose 
}: TimelineProps) => {
  const filteredPoints = points.filter(point => point.title || point.url);

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={isOpen}
      onClose={onClose}
      variant={isMobile ? 'temporary' : 'persistent'}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? '100%' : 400,
          height: isMobile ? '60vh' : '100vh',
          backgroundColor: 'background.paper',
          boxShadow: isMobile ? '0px -4px 20px rgba(0,0,0,0.1)' : '4px 0px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
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
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {filteredPoints.map((point, index) => {
          const isCurrent = index === filteredPoints.length - 1;
          
          return (
            <TimelineCard
              key={point.id}
              point={point}
              isSelected={selectedPost === point.id}
              isCurrent={isCurrent}
              onClick={onPostClick}
            />
          );
        })}
      </Box>
    </Drawer>
  );
};
