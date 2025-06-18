import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import API from '../api';

export const BootstrapConfig = ({ onConfigChange }) => {
  const [bootstrapServer, setBootstrapServer] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    try {
      setIsChecking(true);
      setError(null);
      setSuccess(false);

      // Validate the address format
      if (!bootstrapServer.includes(':')) {
        setError('Invalid address format. Please use host:port format (e.g., localhost:9092)');
        return false;
      }

      console.log('Checking connection for:', bootstrapServer);

      // Update API base URL with the new bootstrap server
      API.defaults.baseURL = `http://localhost:8080/api`;

      // Test connection using the dedicated endpoint
      const response = await API.get('/check-connection', {
        params: { bootstrapServer }
      });
      
      if (response.data.status === 'connected') {
        setSuccess(true);
        
        if (onConfigChange) {
          onConfigChange(bootstrapServer);
        }
        return true;
      } else {
        setError('Failed to connect to Kafka cluster');
        return false;
      }
    } catch (err) {
      console.error('Connection check error:', err);
      // Handle specific error cases
      if (err.response?.status === 503) {
        // Service Unavailable - Connection refused or timeout
        setError(err.response.data.error || 'Failed to connect to Kafka broker. Please check if Kafka is running and the address is correct.');
      } else if (err.response?.status === 400) {
        // Bad Request - Invalid format
        setError(err.response.data.error || 'Invalid broker address format');
      } else {
        // Other errors
        setError('Failed to connect to Kafka cluster: ' + (err.response?.data?.error || err.message));
      }
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    const isConnected = await checkConnection();
    if (isConnected) {
      // The connection was successful and onConfigChange was called
      // Additional success handling can be done here if needed
    }
  };

  const handleBootstrapServerChange = (e) => {
    const newValue = e.target.value;
    setBootstrapServer(newValue);
    // Reset states when bootstrap server changes
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Kafka Bootstrap Server Configuration
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Bootstrap Server"
            value={bootstrapServer}
            onChange={handleBootstrapServerChange}
            placeholder="e.g., localhost:9092"
            fullWidth
            helperText="Enter the bootstrap server address (host:port)"
            disabled={isChecking}
          />
          <Button
            variant="contained"
            startIcon={isChecking ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            sx={{ minWidth: 120 }}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Save'}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Successfully connected to Kafka cluster
          </Alert>
        )}
      </Paper>
    </Box>
  );
}; 