import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Handle response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
