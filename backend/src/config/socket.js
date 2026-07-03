import { Server } from 'socket.io';
import { onConnection } from '../sockets/index.socket.js';

let io;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isVercelOrigin = (origin) => typeof origin === 'string' && /\.vercel\.app$/.test(origin);

const corsOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isVercelOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        allowEIO3: true,
    });

    io.on('connection', (socket) => {
        onConnection(io, socket);
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }

    return io;
};
