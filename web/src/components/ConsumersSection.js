import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export const ConsumersSection = ({ consumers, onRefresh }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Consumers</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Group ID</TableCell>
              <TableCell>Member ID</TableCell>
              <TableCell>Topics</TableCell>
              <TableCell>Partitions</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consumers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No consumers available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              consumers.map((consumer, idx) => (
                <TableRow key={`${consumer.groupId}-${consumer.memberId || idx}`}> 
                  <TableCell>{consumer.groupId}</TableCell>
                  <TableCell>{consumer.memberId || 'N/A'}</TableCell>
                  <TableCell>{consumer.topics && consumer.topics.length > 0 ? consumer.topics.join(', ') : 'N/A'}</TableCell>
                  <TableCell>{consumer.partitions && consumer.partitions.length > 0 ? consumer.partitions.join(', ') : 'N/A'}</TableCell>
                  <TableCell>{consumer.error || ''}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 