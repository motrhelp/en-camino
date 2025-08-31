import { Close as CloseIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useCaminoStore } from './stores/caminoStore';
import { Point } from './types';

interface PointDialogProps {
  open: boolean;
  mode: 'add' | 'edit';
  onClose: () => void;
  coordinates?: [number, number]; // Only needed for add mode
  point?: Point; // Only needed for edit mode
}

export const PointDialog = ({ open, mode, onClose, coordinates, point }: PointDialogProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [image, setImage] = useState<File | null>(null);
  
  const { addPoint, updatePoint, loading, error } = useCaminoStore();

  // Pre-populate form when editing
  useEffect(() => {
    if (mode === 'edit' && point) {
      setTitle(point.title || '');
      setUrl(point.url || '');
      if (point.timestamp?.toDate) {
        const date = point.timestamp.toDate();
        setTimestamp(date.toISOString().slice(0, 16)); // Format for datetime-local input
      } else if (point.timestamp instanceof Date) {
        setTimestamp(point.timestamp.toISOString().slice(0, 16));
      }
      // Note: image handling would need to be implemented for edit mode
    } else if (mode === 'add') {
      // Reset form for add mode
      setTitle('');
      setUrl('');
      setTimestamp('');
      setImage(null);
    }
  }, [mode, point, open]);

  const handleSubmit = async () => {
    if (mode === 'add') {
      if (!coordinates || !timestamp) {
        return; // Don't add if no coordinates or timestamp
      }

      const pointData = {
        ...(title.trim() && { title: title.trim() }),
        coordinates: {
          latitude: coordinates[0],
          longitude: coordinates[1],
        },
        ...(image && { cover: URL.createObjectURL(image) }),
        timestamp: new Date(timestamp),
        ...(url.trim() && { url: url.trim() }),
      };

      const result = await addPoint(pointData);
      
      if (result.success) {
        onClose();
      }
    } else if (mode === 'edit') {
      if (!point?.id || !timestamp) {
        return; // Don't update if no point ID or timestamp
      }

      const updateData = {
        ...(title.trim() ? { title: title.trim() } : { title: '' }), // Allow clearing title
        ...(url.trim() ? { url: url.trim() } : { url: '' }), // Allow clearing URL
        timestamp: new Date(timestamp),
      };

      const result = await updatePoint(point.id, updateData);
      
      if (result.success) {
        onClose();
      }
    }
  };

  const isFormValid = mode === 'add' ? (coordinates && timestamp) : (timestamp);

  const getDialogTitle = () => mode === 'add' ? 'Add New Point' : 'Edit Point';
  const getSubmitButtonText = () => {
    if (loading) return mode === 'add' ? 'Adding Point...' : 'Updating Point...';
    return mode === 'add' ? 'Add Point' : 'Update Point';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{getDialogTitle()}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Time"
            type="datetime-local"
            fullWidth
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
                mt: 1,
            }}
            required
          />
          <TextField
            label="Title"
            fullWidth
            placeholder="Enter point title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="URL"
            fullWidth
            placeholder="Enter URL (optional)"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {mode === 'add' && coordinates && (
            <TextField
              label="Location"
              fullWidth
              value={`${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`}
              InputProps={{
                readOnly: true,
              }}
            />
          )}
          {mode === 'edit' && point && (
            <TextField
              label="Location"
              fullWidth
              value={`${point.coordinates?.latitude?.toFixed(6) || 'N/A'}, ${point.coordinates?.longitude?.toFixed(6) || 'N/A'}`}
              InputProps={{
                readOnly: true,
              }}
            />
          )}
          {/* <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Image
            </Typography>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Click to upload image
              </Typography>
            </Box>
          </Box> */}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!isFormValid || loading}
          fullWidth
          size="large"
        >
          {getSubmitButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
