import { registerBoardHandlers } from './board.socket.js';
import { registerUserHandlers } from './user.socket.js';

export const onConnection = (io, socket) => {
    console.log('User connected:', socket.id);
    registerBoardHandlers(io, socket);
    registerUserHandlers(io, socket);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
};
