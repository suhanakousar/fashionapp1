// Vercel serverless function entry point for API routes
import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from '../server/routes';
import { connect } from '../server/db';
import { createServer } from 'http';

// Singleton pattern - initialize once, reuse for all requests
let app: express.Express | null = null;
let isInitialized = false;
let initPromise: Promise<express.Express> | null = null;

async function getApp(): Promise<express.Express> {
  // If already initialized, return cached app
  if (isInitialized && app) {
    return app;
  }

  // If initialization in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    // Initialize database
    await connect();

    // Create Express app
    app = express();
    const httpServer = createServer(app);

    // Trust proxy for Vercel
    app.set('trust proxy', 1);

    // Body parsing
    app.use(express.json({
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
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
  })();

  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  
  return new Promise<void>((resolve) => {
    expressApp(req as any, res as any, () => {
      resolve();
    });
  });
}
