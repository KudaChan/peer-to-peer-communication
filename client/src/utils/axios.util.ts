import axios from "axios";

// Log the API URL to debug
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  withCredentials: true,
});

export default api;
