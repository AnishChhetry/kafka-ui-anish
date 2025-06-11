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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Dashboard Overview</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <CardContent>
              <Typography variant="h6" color="primary">Total Topics</Typography>
              <Typography variant="h3">{topics.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
            <CardContent>
              <Typography variant="h6" color="success.main">Active Brokers</Typography>
              <Typography variant="h3">{brokers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.info.main, 0.1) }}>
            <CardContent>
              <Typography variant="h6" color="info.main">Active Consumers</Typography>
              <Typography variant="h3">{consumers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 