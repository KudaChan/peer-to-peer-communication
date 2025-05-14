import { Request, Response, NextFunction, CookieOptions } from "express";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { sendResponse } from "../utils/response";
import { signup, login, isAuthenticated } from "../services/auth.services";

// Cookie Options for JWT:
const addCookie = (res: Response, req: Request, token: string) => {
  // Get domain from request origin or use default
  const origin = req.headers.origin || '';
  const domain = process.env.NODE_ENV === 'production' 
    ? origin.includes('34.131.4.164') ? '34.131.4.164' : undefined
    : undefined;
  
  console.log(`Setting cookie for domain: ${domain || 'default'}, origin: ${origin}`);
  
  const cookieOps: CookieOptions = {
    expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: domain
  };
  
  console.log("Setting cookie with options:", JSON.stringify(cookieOps));
  res.cookie("jwt", token, cookieOps);
  
  // Also set a non-httpOnly cookie for client-side access
  const clientCookieOps: CookieOptions = {
    ...cookieOps,
    httpOnly: false
  };
  res.cookie("jwt-client", token, clientCookieOps);
};

// login:
export const loginController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw next(new AppError(400, "Please provide all fields"));
    }

    const user = await login({ email, password });

    addCookie(res, req, user.jwttoken);
    
    // Return the token in the response body as well
    sendResponse(res, 200, {
      ...user,
      token: user.jwttoken // Explicitly include token in response
    });
  }
);

// Sign up:
export const signupController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw next(new AppError(400, "Please provide all fields"));
    }

    const user = await signup({ name, email, password });

    addCookie(res, req, user.jwttoken);
    
    // Return the token in the response body as well
    sendResponse(res, 201, {
      ...user,
      token: user.jwttoken // Explicitly include token in response
    });
  }
);

// Is Authenticated:
export const isAuthenticatedController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Check for JWT in cookies
    const jwt = req.cookies?.jwt;
    
    // If no JWT in cookies, check Authorization header
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;
    
    const token = jwt || headerToken;
    
    if (!token) {
      console.log("No authentication token found");
      return next(new AppError(401, "Please login to continue"));
    }

    try {
      const user = await isAuthenticated(token);
      
      // Refresh the cookie with a new token
      addCookie(res, req, user.jwttoken);
      
      sendResponse(res, 200, user);
    } catch (error) {
      console.error("Authentication error:", error);
      return next(new AppError(401, "Authentication failed. Please login again."));
    }
  }
);

// Logout:
export const logoutController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
    });
    sendResponse(res, 200, { message: "Logged out" });
  }
);
