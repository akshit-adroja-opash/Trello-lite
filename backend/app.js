import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorMiddleware } from './src/middleware/error.middleware.js';

// Import Routes
import authRoutes from './src/routes/auth.routes.js';
import workspaceRoutes from './src/routes/workspace.routes.js';
import boardRoutes from './src/routes/board.routes.js';
import columnRoutes from './src/routes/column.routes.js';
import cardRoutes from './src/routes/card.routes.js';

const app = express();

// Global Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/boards', boardRoutes);
app.use('/api/v1/columns', columnRoutes);
app.use('/api/v1/cards', cardRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
