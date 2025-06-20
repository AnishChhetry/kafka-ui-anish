import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Paper,
  Typography
} from '@mui/material';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  Topic as TopicIcon,
  Group as GroupIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import API from './api';
import { TopicsSection } from './components/TopicsSection';
import { OverviewSection } from './components/OverviewSection';
import { BrokersSection } from './components/BrokersSection';
import { ConsumersSection } from './components/ConsumersSection';
import { BootstrapConfig } from './components/BootstrapConfig';
import { ChangePasswordDialog } from './components/ChangePasswordDialog';

const drawerWidth = 240;

function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(true);
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });
  const [messageLimit, setMessageLimit] = useState(5);
  const [sortOrder, setSortOrder] = useState('newest');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({
    name: '',
    partitions: 1,
    replicationFactor: 1
  });
  const [selectedSection, setSelectedSection] = useState('config');
  const [brokers, setBrokers] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loginError, setLoginError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState(null);
  const [currentBootstrapServer, setCurrentBootstrapServer] = useState(null);
  const [mode, setMode] = useState('light');
  const colorMode = {
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  };
  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
    },
  }), [mode]);

  const loadMessages = useCallback(async () => {
    if (!selectedTopic) return;
    try {
      setLoading(true);
      setError(null);
      const limit = messageLimit === 'all' ? 1000 : messageLimit;
      const res = await API.get(`/topics/${selectedTopic}/messages?limit=${limit}&sort=${sortOrder || 'newest'}`);
      
      const formattedMessages = Array.isArray(res.data) ? res.data.map((msg, index) => {
        const messageObj = typeof msg === 'string' ? { value: msg } : msg;
        
        const offset = messageObj.offset ?? index;
        const partition = messageObj.partition ?? 0;
        const key = messageObj.key ?? '';
        const value = messageObj.value ?? msg ?? '';
        const size = value + key ? value.length + key.length : 0;
        const timestamp = messageObj.timestamp ?? Date.now();
        const headers = messageObj.headers ?? [];

        return {
          offset,
          partition,
          size,
          key,
          value,
          timestamp,
          headers
        };
      }) : [];
      
      setMessages(formattedMessages);
    } catch (err) {
      setError('Error fetching messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, messageLimit, sortOrder]);

  useEffect(() => {
    let intervalId;
    if ((autoRefresh) && selectedTopic) {
      intervalId = setInterval(loadMessages, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, selectedTopic, loadMessages]);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/brokers', {
        params: { bootstrapServer: currentBootstrapServer }
      });
      setBrokers(res.data);
    } catch (err) {
      setError('Error fetching brokers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsumers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/consumers', {
        params: { bootstrapServer: currentBootstrapServer }
      });
      setConsumers(res.data || []);
    } catch (err) {
      setError('Error fetching consumers: ' + err.message);
      setConsumers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always start with login screen - no persistent state
    setIsLoggedIn(false);
    setLoginOpen(true);
    setIsConfigured(false);
    setCurrentToken(null);
    setCurrentBootstrapServer(null);
  }, []);

  const handleLogout = () => {
    setCurrentToken(null);
    setCurrentBootstrapServer(null);
    delete API.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setLoginOpen(true);
    setTopics([]);
    setMessages([]);
    setBrokers([]);
    setConsumers([]);
    setAutoRefresh(false);
    setError(null);
    setIsConfigured(false);
    setSelectedSection('config');
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoginError(null);
      const response = await API.post('/login', loginData);
      const token = response.data.token;
      setCurrentToken(token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsLoggedIn(true);
      setLoginOpen(false);
      
      // Always start with configuration section after login
      setIsConfigured(false);
      setSelectedSection('config');
    } catch (err) {
      setLoginError('Invalid username or password');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/topics');
      setTopics(res.data);
    } catch (err) {
      setError('Error fetching topics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (topicData) => {
    try {
      setLoading(true);
      setError(null);
      await API.post('/topics', topicData);
      await fetchTopics();
    } catch (err) {
      setError('Error creating topic: ' + err.message);
      throw err; // Re-throw to let the dialog handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;
    if (!window.confirm(`Are you sure you want to delete topic "${selectedTopic}"?`)) return;
    
    try {
      setLoading(true);
      setError(null);
      await API.delete(`/topics/${selectedTopic}`);
      setSelectedTopic('');
      setMessages([]);
      await fetchTopics();
    } catch (err) {
      setError('Error deleting topic: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessages = async () => {
    if (!selectedTopic) return;
    if (!window.confirm(`Are you sure you want to delete all messages from topic "${selectedTopic}"?`)) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Deleting messages for topic:', selectedTopic);
      console.log('Token:', currentToken);
      const response = await API.delete(`/topics/${selectedTopic}/messages`);
      console.log('Delete response:', response);
      setMessages([]);
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.error || err.message;
      setError(`Error deleting messages: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (formData) => {
    if (!selectedTopic) return;
    try {
      setLoading(true);
      setError(null);
      const messageData = {
        topic: selectedTopic,
        key: formData.key,
        value: formData.value,
        headers: formData.headers,
        partition: formData.partition
      };
      console.log('Sending message:', messageData);
      await API.post('/produce', messageData);
      await loadMessages();
    } catch (err) {
      setError('Error sending message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
    setMessages([]);
  };

  // Load messages when selectedTopic, messageLimit, or sortOrder changes
  useEffect(() => {
    if (selectedTopic) {
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, messageLimit, sortOrder]);

  const handleMessageLimitChange = (event) => {
    setMessageLimit(event.target.value);
  };

  const handleSortOrderChange = (event) => {
    setSortOrder(event.target.value);
  };

  const handleBootstrapChange = async (newBootstrapServer) => {
    // Reset state when bootstrap server changes
    setTopics([]);
    setMessages([]);
    setBrokers([]);
    setConsumers([]);
    setSelectedTopic('');
    setAutoRefresh(false);
    setError(null);
    setCurrentBootstrapServer(newBootstrapServer);
    
    try {
      // Try to connect and fetch initial data
      await Promise.all([
        fetchTopics(),
        fetchBrokers(),
        fetchConsumers()
      ]);
      setIsConfigured(true);
      // Only allow access to other sections after successful configuration
      setSelectedSection('overview');
    } catch (err) {
      setIsConfigured(false);
      setError('Failed to connect to Kafka cluster: ' + err.message);
      // Force back to config section on failure
      setSelectedSection('config');
    }
  };

  const handleSectionChange = (section) => {
    if (section === 'config' || isConfigured) {
      setSelectedSection(section);
    } else {
      setError('Please configure the Kafka connection first');
      setSelectedSection('config');
    }
  };

  const menuItems = [
    { id: 'config', label: 'Configuration', icon: <SettingsIcon /> },
    { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
    { id: 'brokers', label: 'Brokers', icon: <StorageIcon /> },
    { id: 'topics', label: 'Topics', icon: <TopicIcon /> },
    { id: 'consumers', label: 'Consumers', icon: <GroupIcon /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        position: 'relative',
        zIndex: 0,
        '& > *': {
          position: 'relative',
          zIndex: 1
        }
      }}>
        {isLoggedIn ? (
          <>
            <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: drawerWidth,
                  boxSizing: 'border-box',
                  borderRight: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  zIndex: 2
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <img
                  src={mode === 'dark' ? '/logo_white.png' : '/logo_black.png'}
                  alt="Kafka UI Logo"
                  style={{ height: '100px', width: '110px' }}
                />
                <Box>
                  <Tooltip title="Change Password" placement="top">
                    <IconButton onClick={() => setChangePasswordOpen(true)} color="inherit" size="small" sx={{ mr: 1 }}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Logout" placement="top">
                    <IconButton onClick={handleLogout} color="inherit" size="small">
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Divider />
              <List>
                {menuItems.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton
                      selected={selectedSection === item.id}
                      onClick={() => handleSectionChange(item.id)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pb: 3 }}>
                <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} placement="top">
                  <IconButton onClick={colorMode.toggleColorMode} color="inherit" size="large">
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Drawer>
            
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1, 
                bgcolor: 'background.default', 
                minHeight: '100vh',
                position: 'relative',
                zIndex: 1,
                overflow: 'auto'
              }}
            >
              {loading && (
                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 2
                }}>
                  <CircularProgress />
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                  {error}
                </Alert>
              )}
              
              {selectedSection === 'config' && (
                <BootstrapConfig onConfigChange={handleBootstrapChange} />
              )}
              
              {selectedSection === 'overview' && isConfigured && (
                <OverviewSection
                  topics={topics}
                  brokers={brokers}
                  consumers={consumers}
                />
              )}
              
              {selectedSection === 'brokers' && isConfigured && (
                <BrokersSection
                  brokers={brokers}
                  onRefresh={fetchBrokers}
                />
              )}
              
              {selectedSection === 'topics' && isConfigured && (
                <TopicsSection
                  topics={topics}
                  selectedTopic={selectedTopic}
                  messages={messages}
                  messageLimit={messageLimit}
                  sortOrder={sortOrder}
                  autoRefresh={autoRefresh}
                  onTopicChange={handleTopicChange}
                  onMessageLimitChange={handleMessageLimitChange}
                  onSortOrderChange={handleSortOrderChange}
                  onAutoRefreshChange={setAutoRefresh}
                  onRefresh={fetchTopics}
                  onLoadMessages={loadMessages}
                  onDeleteTopic={handleDeleteTopic}
                  onDeleteMessages={handleDeleteMessages}
                  onSendMessage={handleSendMessage}
                  onCreateTopic={handleCreateTopic}
                  brokerCount={brokers.length}
                />
              )}
              
              {selectedSection === 'consumers' && isConfigured && (
                <ConsumersSection
                  consumers={consumers}
                  onRefresh={fetchConsumers}
                />
              )}
            </Box>

            {/* Create Topic Dialog */}
            <Dialog 
              open={createTopicOpen} 
              onClose={() => setCreateTopicOpen(false)}
              disableEnforceFocus
              sx={{ zIndex: 1400 }}
            >
              <DialogTitle>Create New Topic</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Topic Name"
                  fullWidth
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                />
                <TextField
                  margin="dense"
                  label="Partitions"
                  type="number"
                  fullWidth
                  value={newTopic.partitions}
                  onChange={(e) => setNewTopic({ ...newTopic, partitions: parseInt(e.target.value) })}
                />
                <TextField
                  margin="dense"
                  label="Replication Factor"
                  type="number"
                  fullWidth
                  value={newTopic.replicationFactor}
                  onChange={(e) => setNewTopic({ ...newTopic, replicationFactor: parseInt(e.target.value) })}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setCreateTopicOpen(false)}>Cancel</Button>
                <Button onClick={() => handleCreateTopic(newTopic)} variant="contained">Create</Button>
              </DialogActions>
            </Dialog>

            <ChangePasswordDialog 
              open={changePasswordOpen}
              onClose={() => setChangePasswordOpen(false)}
            />
          </>
        ) : (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100vh', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1
            }}
          >
            <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
              <Typography variant="h5" gutterBottom align="center">Kafka UI</Typography>
              <Typography variant="body1" gutterBottom align="center" color="text.secondary">
                Please log in to continue
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Login Dialog */}
        <Dialog 
          open={!isLoggedIn && loginOpen} 
          onClose={() => {}}  // Prevent closing
          disableEnforceFocus
          disableAutoFocus
          disableEscapeKeyDown
          sx={{ zIndex: 1400 }}
        >
          <DialogTitle>Login</DialogTitle>
          <DialogContent>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              value={loginData.username}
              onChange={(e) => {
                setLoginData({ ...loginData, username: e.target.value });
                setLoginError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              error={!!loginError}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={loginData.password}
              onChange={(e) => {
                setLoginData({ ...loginData, password: e.target.value });
                setLoginError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              error={!!loginError}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleLogin} 
              variant="contained"
              disabled={!loginData.username || !loginData.password}
            >
              Login
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default App;
