import { create } from 'zustand';

const useBoardStore = create((set, get) => ({
    board: null,
    columns: [],
    cards: {},        // columnId -> Card[]
    presence: [],     // [{ userId, username, avatar }]

    setBoard: (board) => set({ board }),
    setColumns: (columns) => set({ columns }),

    setCardsForColumn: (columnId, cards) =>
        set(s => ({ cards: { ...s.cards, [columnId]: cards } })),

    addColumn: (column) =>
        set(s => ({ columns: [...s.columns, column].sort((a, b) => a.order > b.order ? 1 : -1) })),

    updateColumn: (updated) =>
        set(s => ({ columns: s.columns.map(c => c._id === updated._id ? updated : c) })),

    removeColumn: (columnId) =>
        set(s => {
            const cards = { ...s.cards };
            delete cards[columnId];
            return { columns: s.columns.filter(c => c._id !== columnId), cards };
        }),

    addCard: (card) =>
        set(s => {
            const col = s.cards[card.column] || [];
            return { cards: { ...s.cards, [card.column]: [...col, card].sort((a, b) => a.order > b.order ? 1 : -1) } };
        }),

    updateCard: (updated) =>
        set(s => {
            const col = s.cards[updated.column] || [];
            return { cards: { ...s.cards, [updated.column]: col.map(c => c._id === updated._id ? updated : c) } };
        }),

    moveCardOptimistic: (cardId, fromColumnId, toColumnId, newOrder) =>
        set(s => {
            const fromCards = (s.cards[fromColumnId] || []).filter(c => c._id !== cardId);
            const card = (s.cards[fromColumnId] || []).find(c => c._id === cardId);
            if (!card) return s;
            const movedCard = { ...card, column: toColumnId, order: newOrder };
            const toCards = [...(s.cards[toColumnId] || []).filter(c => c._id !== cardId), movedCard]
                .sort((a, b) => a.order > b.order ? 1 : -1);
            return { cards: { ...s.cards, [fromColumnId]: fromCards, [toColumnId]: toCards } };
        }),

    removeCard: (cardId, columnId) =>
        set(s => ({ cards: { ...s.cards, [columnId]: (s.cards[columnId] || []).filter(c => c._id !== cardId) } })),

    setPresence: (users) => set({ presence: users }),
}));

export default useBoardStore;
