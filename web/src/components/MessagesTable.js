import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Grid
} from '@mui/material';

export const MessagesTable = React.memo(({ messages }) => {
  const [selectedMessage, setSelectedMessage] = useState(null);

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
  };

  const handleCloseDialog = () => {
    setSelectedMessage(null);
  };

  const totalSize = messages.reduce((sum, message) => sum + (message.size || 0), 0);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="text.secondary">Total Messages</Typography>
              <Typography variant="h6">{messages.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="text.secondary">Total Size</Typography>
              <Typography variant="h6">{totalSize} bytes</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Offset</TableCell>
              <TableCell>Partition</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No messages available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message, index) => (
                <TableRow 
                  key={index}
                  onClick={() => handleMessageClick(message)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell>{message.offset}</TableCell>
                  <TableCell>{message.partition}</TableCell>
                  <TableCell>{message.size}</TableCell>
                  <TableCell>
                    {message.timestamp ? new Date(parseInt(message.timestamp)).toLocaleString() : '<empty>'}
                  </TableCell>
                  <TableCell>{message.key || '<empty>'}</TableCell>
                  <TableCell>{message.value || '<empty>'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={Boolean(selectedMessage)} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Basic Information</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Typography><strong>Offset:</strong> {selectedMessage?.offset}</Typography>
              <Typography><strong>Partition:</strong> {selectedMessage?.partition}</Typography>
              <Typography><strong>Size:</strong> {selectedMessage?.size}</Typography>
              <Typography>
                <strong>Time:</strong> {selectedMessage?.timestamp ? 
                  new Date(parseInt(selectedMessage.timestamp)).toLocaleString() : '<empty>'}
              </Typography>
            </Box>

            <Typography variant="h6">Message Content</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Key:</strong></Typography>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {selectedMessage?.key || '<empty>'}
                </Typography>
              </Paper>
              
              <Typography><strong>Value:</strong></Typography>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {selectedMessage?.value || '<empty>'}
                </Typography>
              </Paper>
            </Box>

            {selectedMessage?.headers && selectedMessage.headers.length > 0 && (
              <>
                <Typography variant="h6">Headers</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedMessage.headers.map((header, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1 }}>
                      <Typography><strong>{header.key || '<empty>'}:</strong></Typography>
                      <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {header.value || '<empty>'}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}); 