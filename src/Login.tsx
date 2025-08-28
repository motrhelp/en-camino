import { Lock as LockIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail } from './firebase';


interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await loginWithEmail(email, password);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onLoginSuccess();
      navigate('/');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 4
    }}>
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              mb: 2,
            }}
          >
            <LockIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            Admin Login
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            Sign in to access the admin panel
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            variant="outlined"
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0,0,0,0.02)',
                '& fieldset': {
                  borderColor: 'rgba(0,0,0,0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0,0,0,0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
              },
            }}
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0,0,0,0.02)',
                '& fieldset': {
                  borderColor: 'rgba(0,0,0,0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0,0,0,0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
              },
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              '&:disabled': {
                background: 'rgba(0,0,0,0.1)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.8rem',
            }}
          >
            This is an admin-only login
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;


