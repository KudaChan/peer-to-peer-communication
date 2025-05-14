import axios from "axios";
import { store } from "@/redux/store";

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

// Add request interceptor to include token in Authorization header
api.interceptors.request.use(
  config => {
    // Try to get token from multiple sources
    let token: string | null | undefined = store.getState().user.token;
    
    // If no token in Redux, try localStorage
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('authToken');
    }
    
    // If no token in localStorage, try cookies
    if (!token && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['jwt-client'];
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Adding token to request:", token.substring(0, 10) + "...");
    } else {
      console.log("No token available for request");
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log("Authentication error, redirecting to login");
      // Optionally redirect to login page
      // window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
