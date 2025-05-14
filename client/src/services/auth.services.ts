"use client";
import api from "@/utils/axios.util";
import { store } from "@/redux/store";
import { addUser, removeUser } from "@/redux/features/user/user.slice";
import { IFormCallbackResponse } from "@/types/general";

// Sign up:
export const signup = async (
  data: FormData
): Promise<IFormCallbackResponse> => {
  const body = {
    name: data.get("name"),
    email: data.get("email"),
    password: data.get("password"),
  };
  try {
    const res = await api.post("/auth/signup", body);
    console.log("Signup response:", res.data);

    if (res.data.status === "success") {
      const { data } = res.data;
      
      // Get token from response data or data.jwttoken
      const token = data.token || data.jwttoken;
      
      if (!token) {
        console.error("No token found in response");
        return { status: "error", message: "Authentication failed - no token" };
      }
      
      console.log("Token received:", token.substring(0, 10) + "...");
      
      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: data.createdAt,
        token: token,
      };

      // Set user in redux store:
      store.dispatch(addUser(user));
      
      // Also store token in localStorage as backup
      localStorage.setItem('authToken', token);
      
      return {
        status: res.data.status,
        message: "Signed up successfully",
        redirect: "/",
      };
    }
    return { status: res.data.status, message: "Something went wrong" };
  } catch (err: any) {
    console.error("Signup error:", err);
    return {
      status: err.response?.data.status || "error",
      message: err.response?.data.message || "Signup failed",
    };
  }
};

// login:
export const login = async (data: FormData): Promise<IFormCallbackResponse> => {
  const body = {
    email: data.get("email"),
    password: data.get("password"),
  };
  try {
    const res = await api.post("/auth/login", body);
    console.log("Login response:", res.data);
    
    if (res.data.status === "success") {
      const { data } = res.data;
      
      // Get token from response data or data.jwttoken
      const token = data.token || data.jwttoken;
      
      if (!token) {
        console.error("No token found in response");
        return { status: "error", message: "Authentication failed - no token" };
      }
      
      console.log("Token received:", token.substring(0, 10) + "...");
      
      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: data.createdAt,
        token: token,
      };

      // Set user in redux store:
      store.dispatch(addUser(user));
      
      // Also store token in localStorage as backup
      localStorage.setItem('authToken', token);
      
      // Update socket authentication
      if (typeof window !== 'undefined') {
        const { updateSocketAuth } = require('./socket/socket.services');
        updateSocketAuth();
      }
      
      return { status: res.data.status, message: "Logged In", redirect: "/" };
    }
    return { status: res.data.status, message: "Something went wrong" };
  } catch (err: any) {
    console.error("Login error:", err);
    return {
      status: "error",
      message: err.response?.data.message || "Login failed",
    };
  }
};

// Is Authenticated:
export const isAuthenticated = async (): Promise<IFormCallbackResponse> => {
  try {
    console.log("Checking authentication...");
    const res = await api.get("/auth/is-authenticated");
    console.log("Authentication response:", res.data);
    
    if (res.data.status === "success") {
      const { data } = res.data;
      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: data.createdAt,
        token: res.data.data.jwttoken,
      };

      // Set user in redux store:
      store.dispatch(addUser(user));
      return { status: res.data.status, message: "Authenticated" };
    }
    return { status: res.data.status, message: "Not authenticated" };
  } catch (err: any) {
    console.error("Authentication error:", err);
    return {
      status: err.response?.data.status || "error",
      message: err.response?.data.message || "Authentication failed",
    };
  }
};

// logout:
export const logout = async (): Promise<IFormCallbackResponse> => {
  try {
    const res = await api.get("/auth/logout");
    if (res.data.status === "success") {
      store.dispatch(removeUser());
    }
    return { status: "success", message: "Logged Out", redirect: "/" };
  } catch (err: any) {
    return {
      status: err.response?.data.status,
      message: err.response?.data.message,
    };
  }
};
