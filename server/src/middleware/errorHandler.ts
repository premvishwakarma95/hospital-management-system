import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
