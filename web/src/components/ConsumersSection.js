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
              <TableCell>Topic</TableCell>
              <TableCell>Partition</TableCell>
              <TableCell>Current Offset</TableCell>
              <TableCell>Log End Offset</TableCell>
              <TableCell>Lag</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consumers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No consumers available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              consumers.map((consumer) => (
                <TableRow key={`${consumer.groupId}-${consumer.topic}-${consumer.partition}`}>
                  <TableCell>{consumer.groupId}</TableCell>
                  <TableCell>{consumer.topic}</TableCell>
                  <TableCell>{consumer.partition}</TableCell>
                  <TableCell>{consumer.currentOffset}</TableCell>
                  <TableCell>{consumer.logEndOffset}</TableCell>
                  <TableCell>{consumer.lag}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 