import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';

export const CreateTopicDialog = ({ open, onClose, onCreateTopic, brokerCount }) => {
  const [topicName, setTopicName] = useState('');
  const [partitions, setPartitions] = useState(1);
  const [replicationFactor, setReplicationFactor] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCreateTopic({
        name: topicName,
        partitions: parseInt(partitions),
        replicationFactor: parseInt(replicationFactor)
      });
      onClose();
      // Reset form
      setTopicName('');
      setPartitions(1);
      setReplicationFactor(1);
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Topic</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Topic Name"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              required
              fullWidth
              helperText="Enter a unique topic name"
            />
            <TextField
              label="Number of Partitions"
              type="number"
              value={partitions}
              onChange={(e) => setPartitions(e.target.value)}
              inputProps={{ 
                min: 1,
                step: 1
              }}
              fullWidth
              helperText="Enter number of partitions"
            />
            <TextField
              label="Replication Factor"
              type="number"
              value={replicationFactor}
              onChange={(e) => setReplicationFactor(e.target.value)}
              inputProps={{ 
                min: 1,
                max: brokerCount || 1,
                step: 1
              }}
              fullWidth
              helperText={`Enter replication factor (1-${brokerCount || 1})`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 