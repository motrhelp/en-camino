import { Box, Button, Typography } from '@mui/material';

interface CrosshairOverlayProps {
  onConfirm: () => void;
  coordinates: [number, number] | null;
}

export const CrosshairOverlay = ({ onConfirm, coordinates }: CrosshairOverlayProps) => {
  return (
    <>
      {/* Crosshair overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          pointerEvents: 'none',
        }}
      >
        <Box sx={{ width: 40, height: 40, position: 'relative' }}>
          {/* Vertical line */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: 2,
              height: '100%',
              backgroundColor: 'primary.main',
              transform: 'translateX(-50%)',
            }}
          />
          {/* Horizontal line */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: '100%',
              height: 2,
              backgroundColor: 'primary.main',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Center dot */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 8,
              height: 8,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid',
              borderColor: 'background.paper',
            }}
          />
        </Box>
      </Box>

      {/* Instructions and confirm button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Position the crosshair on your desired location
        </Typography>
        {coordinates && (
          <Typography variant="caption" color="text.secondary">
            {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
          </Typography>
        )}
        <Button variant="contained" onClick={onConfirm}>
          Confirm Location
        </Button>
      </Box>
    </>
  );
};
