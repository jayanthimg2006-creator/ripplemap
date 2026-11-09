import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisRouter from './routes/analysis';
import documentsRouter from './routes/documents';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

// CORS configuration: restrict to local development and production FRONTEND_URL
const allowedOrigins: string[] = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim().replace(/\/+$/, ''));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin (e.g. curl, health checks, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);

app.use(express.json({ limit: '10mb' }));

// Health-check endpoint for Phase 1 verification
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'RippleMap backend is running securely',
    timestamp: new Date().toISOString()
  });
});

// AI analysis routes
app.use('/api', analysisRouter);

// Document upload & extraction routes
app.use('/api', documentsRouter);

// Start server
app.listen(PORT, HOST, () => {
  console.log(`[RippleMap Server] Running at http://${HOST}:${PORT}`);
  console.log(`[RippleMap Server] Health check available at http://${HOST}:${PORT}/api/health`);
});
