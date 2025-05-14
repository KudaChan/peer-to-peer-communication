import axios from "axios";

// Log the API URL to debug
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Add request interceptor to handle CORS preflight
api.interceptors.request.use(
  config => {
    // You can add any custom headers here if needed
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;
