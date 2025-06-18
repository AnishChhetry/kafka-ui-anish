import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  MailOutline as MailOutlineIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { MessagesTable } from './MessagesTable';
import { ProduceMessageForm } from './ProduceMessageForm';
import { MessageFormProvider } from '../contexts/MessageFormContext';
import { CreateTopicDialog } from './CreateTopicDialog';
import API from '../api';

export const TopicsSection = ({
  topics,
  selectedTopic,
  messages,
  messageLimit,
  sortOrder,
  autoRefresh,
  onTopicChange,
  onMessageLimitChange,
  onSortOrderChange,
  onAutoRefreshChange,
  onRefresh,
  onLoadMessages,
  onDeleteTopic,
  onDeleteMessages,
  onSendMessage,
  onCreateTopic,
  brokerCount
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [partitionCount, setPartitionCount] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPartitionInfo = async () => {
      if (selectedTopic) {
        try {
          const response = await API.get(`/topics/${selectedTopic}/partitions`);
          setPartitionCount(response.data.length);
        } catch (error) {
          console.error('Error fetching partition info:', error);
          setPartitionCount(1); // Default to 1 partition on error
        }
      }
    };

    fetchPartitionInfo();
  }, [selectedTopic]);

  const handleSendMessage = useCallback(async (formData) => {
    if (!selectedTopic) return;
    try {
      await onSendMessage(formData);
    } catch (err) {
      console.error('Error sending message:', err);
      // Show error in a more user-friendly way
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send message';
      setError(errorMessage);
      // You might want to add a snackbar or toast notification here
    }
  }, [selectedTopic, onSendMessage]);

  const handleCreateTopic = async (topicData) => {
    try {
      await onCreateTopic(topicData);
      await onRefresh(); // Refresh the topic list after creating
    } catch {
      console.error('Error creating topic');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Topics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Topic
          </Button>
        </Box>
      </Box>

      <CreateTopicDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateTopic={handleCreateTopic}
        brokerCount={brokerCount}
      />
      
      {/* Topic List - Full Width */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Topic List</Typography>
          {selectedTopic && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDeleteTopic}
            >
              Delete Topic
            </Button>
          )}
        </Box>
        <FormControl fullWidth>
          <InputLabel>Select Topic</InputLabel>
          <Select
            value={selectedTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            label="Select Topic"
          >
            {topics.map((topic) => (
              <MenuItem key={topic.name} value={topic.name}>{topic.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedTopic ? (
        <>
          {/* Messages Section */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Messages</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Message Limit</InputLabel>
                  <Select
                    value={messageLimit}
                    label="Message Limit"
                    onChange={onMessageLimitChange}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value="all">All</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Sort Order"
                    onChange={onSortOrderChange}
                  >
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  color="primary"
                  startIcon={<MailOutlineIcon />}
                  onClick={onLoadMessages}
                >
                  Load Messages
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={onDeleteMessages}
                >
                  Clear Messages
                </Button>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => onAutoRefreshChange(e.target.checked)}
                    />
                  }
                  label="Auto Load Messages"
                />
              </Box>
            </Box>
            
            <Paper sx={{ p: 2, mt: 2, maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
              <MessagesTable messages={messages} />
            </Paper>
          </Paper>

          {/* Produce Message Section */}
          <MessageFormProvider>
            <ProduceMessageForm 
              sendMessage={handleSendMessage}
              partitions={partitionCount}
            />
          </MessageFormProvider>
        </>
      ) : (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Select a topic to view details
          </Typography>
        </Paper>
      )}
    </Box>
  );
}; 