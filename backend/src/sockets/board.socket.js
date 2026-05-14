export const registerBoardHandlers = (io, socket) => {
    
    socket.on('join_board', (boardId) => {
        socket.join(boardId);
        console.log(`User ${socket.id} joined board ${boardId}`);
    });

    socket.on('leave_board', (boardId) => {
        socket.leave(boardId);
        console.log(`User ${socket.id} left board ${boardId}`);
    });

    socket.on('card_move', (data) => {
        const { boardId, cardId, fromColumnId, toColumnId, newOrder } = data;
        // Broadcast to everyone in the room except sender
        socket.to(boardId).emit('card_moved', { cardId, fromColumnId, toColumnId, newOrder });
    });

    socket.on('presence_update', (data) => {
        const { boardId, user } = data;
        socket.to(boardId).emit('user_presence', { user, status: 'online' });
    });
};
