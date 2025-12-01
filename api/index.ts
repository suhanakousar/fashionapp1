// Vercel serverless function entry point for API routes
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from '../server/routes';
import { connect } from '../server/db';
import { createServer } from 'http';

// Initialize Express app (singleton pattern for serverless)
let app: express.Express | null = null;
let isInitialized = false;

async function getApp(): Promise<express.Express> {
  if (isInitialized && app) {
    return app;
  }

  // Initialize database
  await connect();

  // Create Express app
  app = express();
  const httpServer = createServer(app);

  // Trust proxy for Vercel
  app.set('trust proxy', 1);

  // Body parsing
  app.use(express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }));
  app.use(express.urlencoded({ extended: false }));

  // Register routes
  await registerRoutes(httpServer, app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
  });

  isInitialized = true;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  
  return new Promise<void>((resolve) => {
    expressApp(req as any, res as any, () => {
      resolve();
    });
  });
}
