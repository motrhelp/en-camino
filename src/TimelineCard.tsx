import { Box, Card, CardContent, Chip, Typography, Button } from '@mui/material';
import { Point } from './types';
import type { User } from 'firebase/auth';

interface TimelineCardProps {
  point: Point;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: (id: string) => void;
  user: User | null;
  onEdit: (point: Point) => void;
}

export const TimelineCard = ({ point, isSelected, isCurrent, onClick, user, onEdit }: TimelineCardProps) => {
  const date = point.timestamp?.toDate ? point.timestamp.toDate() : new Date();

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      }}
      onClick={() => onClick(point.id)}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {user && (
              <Button
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card click
                  onEdit(point);
                }}
              >
                Edit
              </Button>
            )}
            {isCurrent && (
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
        </Box>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
          {point.title}
        </Typography>
        {point.url && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            <a href={point.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              View details →
            </a>
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
