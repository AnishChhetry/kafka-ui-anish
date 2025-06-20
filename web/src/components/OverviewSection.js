import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha
} from '@mui/material';

export const OverviewSection = ({ topics, brokers, consumers }) => {
  const theme = useTheme();
  // Defensive: default to empty arrays if null/undefined
  const safeTopics = topics || [];
  const safeBrokers = brokers || [];
  const safeConsumers = consumers || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Dashboard Overview</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <CardContent>
              <Typography variant="h6" color="primary">Total Topics</Typography>
              <Typography variant="h3">{safeTopics.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
            <CardContent>
              <Typography variant="h6" color="success.main">Active Brokers</Typography>
              <Typography variant="h3">{safeBrokers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.info.main, 0.1) }}>
            <CardContent>
              <Typography variant="h6" color="info.main">Active Consumers</Typography>
              <Typography variant="h3">{safeConsumers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 