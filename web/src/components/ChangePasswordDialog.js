import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert
} from '@mui/material';
import API from '../api';

export const ChangePasswordDialog = ({ open, onClose }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (event) => {
    setPasswords({
      ...passwords,
      [field]: event.target.value
    });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    // Validate passwords
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    try {
      await API.post('/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      setSuccess(true);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password changed successfully!
          </Alert>
        )}
        <TextField
          margin="dense"
          label="Current Password"
          type="password"
          fullWidth
          value={passwords.currentPassword}
          onChange={handleChange('currentPassword')}
          error={!!error}
        />
        <TextField
          margin="dense"
          label="New Password"
          type="password"
          fullWidth
          value={passwords.newPassword}
          onChange={handleChange('newPassword')}
          error={!!error}
        />
        <TextField
          margin="dense"
          label="Confirm New Password"
          type="password"
          fullWidth
          value={passwords.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={!!error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
        >
          Change Password
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 