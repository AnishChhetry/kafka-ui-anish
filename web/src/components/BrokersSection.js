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
  TableRow,
  Tooltip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export const BrokersSection = ({ brokers, onRefresh }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Brokers</Typography>
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
              <TableCell>ID</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              {/* <TableCell>Segment Size</TableCell> */}
              <TableCell>Segment Count</TableCell>
              <TableCell>Replicas</TableCell>
              <TableCell>Leaders</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brokers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">No brokers available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              brokers.map((broker) => (
                <TableRow key={broker.id}>
                  <TableCell>{broker.id}</TableCell>
                  <TableCell>{broker.address}</TableCell>
                  <TableCell>{broker.status}</TableCell>
                  {/* <TableCell>{formatBytes(broker.segmentSize)}</TableCell> */}
                  <TableCell>{broker.segmentCount}</TableCell>
                  <TableCell>
                    <Tooltip title={broker.replicas.join(', ')}>
                      <Typography>{broker.replicas.length}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={broker.leaders.join(', ')}>
                      <Typography>{broker.leaders.length}</Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 