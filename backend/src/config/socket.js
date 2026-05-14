import { Server } from 'socket.io';
import { onConnection } from '../sockets/index.socket.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
            credentials: true
        }
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
