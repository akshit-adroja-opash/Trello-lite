import { registerBoardHandlers } from './board.socket.js';

export const onConnection = (io, socket) => {
    console.log('User connected:', socket.id);

    // Register all room-based handlers here
    registerBoardHandlers(io, socket);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
};
