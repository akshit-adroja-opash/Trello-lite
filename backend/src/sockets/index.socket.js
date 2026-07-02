import { registerBoardHandlers } from './board.socket.js';
import { registerUserHandlers } from './user.socket.js';

export const onConnection = (io, socket) => {
    registerBoardHandlers(io, socket);
    registerUserHandlers(io, socket);

    socket.on('disconnect', () => {
    });
};
