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
} from '@mui/material';
import { useState } from 'react';
import { useCaminoStore } from './stores/caminoStore';

interface AddPointDialogProps {
  open: boolean;
  onClose: () => void;
  coordinates?: [number, number];
}

export const AddPointDialog = ({ open, onClose, coordinates }: AddPointDialogProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [image, setImage] = useState<File | null>(null);
  
  const { points, setPoints } = useCaminoStore();

  const handleConfirm = () => {
    if (!coordinates || !title.trim()) {
      return; // Don't add if no coordinates or title
    }

    const newPoint = {
      id: Date.now().toString(), // Simple ID generation for now
      title: title.trim(),
      coordinates: {
        latitude: coordinates[0],
        longitude: coordinates[1],
      },
      cover: image ? URL.createObjectURL(image) : '/images/default.png', // Default image or uploaded image
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    // Add to Zustand store
    setPoints([...points, newPoint]);

    // Reset form and close dialog
    setTitle('');
    setUrl('');
    setTimestamp('');
    setImage(null);
    onClose();
  };

  const isFormValid = coordinates && timestamp;

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
          <Typography variant="h6">Add New Point</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
          {coordinates && (
            <TextField
              label="Location"
              fullWidth
              value={`${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`}
              InputProps={{
                readOnly: true,
              }}
            />
          )}
          <Box>
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
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!isFormValid}
          fullWidth
          size="large"
        >
          Add Point
        </Button>
      </DialogActions>
    </Dialog>
  );
};
