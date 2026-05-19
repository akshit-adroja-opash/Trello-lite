const boardPresence = new Map();

export const registerBoardHandlers = (io, socket) => {

    socket.on('board:join', ({ boardId, user }) => {
        socket.join(boardId);
        socket.data.boardId = boardId;
        socket.data.user = user;

        if (!boardPresence.has(boardId)) boardPresence.set(boardId, new Map());
        boardPresence.get(boardId).set(socket.id, user);

        io.to(boardId).emit('board:presence', {
            users: Array.from(boardPresence.get(boardId).values())
        });
    });

    socket.on('board:leave', ({ boardId }) => {
        socket.leave(boardId);
        boardPresence.get(boardId)?.delete(socket.id);
        io.to(boardId).emit('board:presence', {
            users: Array.from((boardPresence.get(boardId) || new Map()).values())
        });
    });

    socket.on('card:move', (payload) => {
        const { boardId, cardId, fromColumnId, toColumnId, newOrder, version } = payload;
        socket.to(boardId).emit('card:moved', { cardId, fromColumnId, toColumnId, newOrder, version });
    });

    socket.on('card:update', (payload) => {
        const { boardId, card } = payload;
        socket.to(boardId).emit('card:updated', { card });
    });

    socket.on('column:create', (payload) => {
        socket.to(payload.boardId).emit('column:created', payload);
    });
    socket.on('column:update', (payload) => {
        socket.to(payload.boardId).emit('column:updated', payload);
    });
    socket.on('column:delete', (payload) => {
        socket.to(payload.boardId).emit('column:deleted', payload);
    });

    socket.on('card:create', (payload) => {
        socket.to(payload.boardId).emit('card:created', payload);
    });
    socket.on('card:delete', (payload) => {
        socket.to(payload.boardId).emit('card:deleted', payload);
    });

    socket.on('disconnect', () => {
        const { boardId, user } = socket.data;
        if (boardId && boardPresence.has(boardId)) {
            boardPresence.get(boardId).delete(socket.id);
            io.to(boardId).emit('board:presence', {
                users: Array.from(boardPresence.get(boardId).values())
            });
        }
    });
};
