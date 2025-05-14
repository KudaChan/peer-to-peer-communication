import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import hpp from "hpp";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import AppError from "./utils/appError";
import { JwtPayload } from "jsonwebtoken";
import { verifyJWT } from "./utils/jwt.utils";
import { initiateSocket } from "./socket/socketConfig";
import { globalErrorHandler } from "./controllers/error.controller";
import environment from "./configs/environment.json";
import { getUser } from "./services/user.services";

import authRoutes from "./routes/auth.routes";

import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "./types/socket.types";

// Express setup:
const app = express();

app.use(
  express.json({
    limit: "10kb",
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Security setup:
// app.enable("trust proxy");

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

app.use(hpp());

app.use(compression());

// CORS setup with environment-based configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = [
  clientUrl,
  // Add Google Cloud VM IP
  'http://34.131.4.164',
  'https://34.131.4.164',
  'http://34.131.4.164',
  'https://34.131.4.164',
  // Local development URLs
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

console.log('CORS allowed origins:', allowedOrigins);
console.log('Client URL:', clientUrl);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Configure CORS middleware with proper options
app.use(
  cors({
    origin: function(origin, callback) {
      console.log('Request origin:', origin);
      
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      // Allow all origins in development
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in production for now
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cookie"]
  })
);

// Add preflight OPTIONS handler
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// Routes:
app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res, next) => {
  res.send("<h1>This is the server for peer to peer video communication</h1>");
});

// 404 error handler:
app.all("*", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Socket setup:
export const httpServer = createServer(app);

// Use the same clientUrl and allowedOrigins variables defined above
console.log('Socket.io allowed origins:', allowedOrigins);

const io = new Server<ServerToClientEvents, ClientToServerEvents>(httpServer, {
  cors: {
    origin: function(origin, callback) {
      console.log('Socket.io request origin:', origin);
      
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Allow all origins in development
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      console.log(`Socket.io CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in production for now
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Socket Auth:
io.use(async (socket, next) => {
  try {
    // Try to get token from cookie
    const cookieHeader = socket.handshake.headers.cookie;
    let token = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies.jwt;
    }
    
    // If no token in cookie, try auth header
    if (!token && socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
      console.log("Using token from socket auth:", token.substring(0, 10) + "...");
    }
    
    if (!token) {
      console.log("No authentication token found in socket connection");
      return next(new Error("Authentication error"));
    }

    // Verify token:
    const { id } = verifyJWT(token as string) as JwtPayload;
    if (!id) {
      console.log("Invalid token in socket connection");
      return next(new Error("Authentication error"));
    }

    // Get user from db:
    const user = await getUser(id);
    if (!user) {
      console.log("User not found in socket connection");
      return next(new Error("Authentication error"));
    }

    // Add user to socket:
    socket.data.user = user;
    next();
  } catch (err: any) {
    console.error("Socket authentication error:", err);
    return next(new AppError(401, err.message));
  }
});

// Set io to app instead of global:
app.set("io", io);

// Initialize the socket connection:
initiateSocket(io);

// Error handling middleware:
app.use(globalErrorHandler);

export default app;
