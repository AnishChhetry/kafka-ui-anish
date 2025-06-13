import React, { useCallback, useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { MessageFormContext } from '../contexts/MessageFormContext';

export const ProduceMessageForm = React.memo(({
  sendMessage,
  partitions
}) => {
  const [showHeaders, setShowHeaders] = useState(false);
  const {
    formData,
    handleKeyChange,
    handlePartitionChange,
    handleValueChange,
    handleHeaderChange,
    removeHeader,
    setFormData
  } = React.useContext(MessageFormContext);

  // Initialize headers as empty when component mounts
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      headers: []
    }));
  }, [setFormData]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(formData);
    }
  }, [sendMessage, formData]);

  const handleAddHeader = useCallback(() => {
    setShowHeaders(true);
    setFormData(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }));
  }, [setFormData]);

  const handleHideHeaders = useCallback(() => {
    setShowHeaders(false);
    setFormData(prev => ({
      ...prev,
      headers: []
    }));
  }, [setFormData]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Produce Message</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Message Key"
              value={formData.key}
              onChange={handleKeyChange}
              size="small"
              placeholder="Optional"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Partition</InputLabel>
              <Select
                value={formData.partition}
                label="Partition"
                onChange={handlePartitionChange}
              >
                <MenuItem value={-1}>Auto</MenuItem>
                {Array.from({ length: partitions }, (_, i) => (
                  <MenuItem key={i} value={i}>Partition {i}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Message Value"
          value={formData.value}
          onChange={handleValueChange}
          onKeyDown={handleKeyDown}
          multiline
          rows={3}
          placeholder="Optional"
        />

        {showHeaders && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Headers</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddHeader}
                >
                  Add Header
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={handleHideHeaders}
                >
                  Remove Headers
                </Button>
              </Box>
            </Box>
            {formData.headers.map((header, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  label="Header Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  sx={{ flex: 1 }}
                  placeholder="Optional"
                />
                <TextField
                  size="small"
                  label="Header Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  sx={{ flex: 1 }}
                  placeholder="Optional"
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    removeHeader(index);
                    if (formData.headers.length === 1) {
                      handleHideHeaders();
                    }
                  }}
                  sx={{ alignSelf: 'center' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {!showHeaders && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddHeader}
            >
              Add Header
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => sendMessage(formData)}
            startIcon={<SendIcon />}
          >
            Send Message
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}); 