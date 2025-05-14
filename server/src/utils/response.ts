import { Response } from "express";

export const sendResponse = (
  res: Response,
  statusCode: number,
  data: any,
  message?: string
) => {
  // If data contains jwttoken, include it directly in the response
  const token = data.jwttoken || null;
  
  res.status(statusCode).json({
    status: statusCode >= 200 && statusCode < 300 ? "success" : "fail",
    message: message || "",
    data,
    ...(token && { token }) // Include token at the top level if it exists
  });
};
