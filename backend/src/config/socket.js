import { Server } from 'socket.io';
import { onConnection } from '../sockets/index.socket.js';

let io;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        allowEIO3: true,
    });

    io.on('connection', (socket) => {
        console.log('User Connected:', socket.id);
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
