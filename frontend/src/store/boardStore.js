import { create } from "zustand";

const useBoardStore = create((set, get) => ({
  board: null,
  boardRole: 'Viewer', // client by default until board loads
  columns: [],
  cards: {},
  presence: [],
  history: [],
  future: [],

  setBoard: (board) => set({ board }),
  setBoardRole: (boardRole) => set({ boardRole }),
  setColumns: (columns) => set({ columns }),

  setCardsForColumn: (columnId, cards) =>
    set((s) => ({ cards: { ...s.cards, [columnId]: cards } })),

  addColumn: (column) =>
    set((s) => ({
      columns: [...s.columns, column].sort((a, b) =>
        a.order > b.order ? 1 : -1,
      ),
    })),

  updateColumn: (updated) =>
    set((s) => ({
      columns: s.columns.map((c) => (c._id === updated._id ? updated : c)),
    })),

  removeColumn: (columnId) =>
    set((s) => {
      const historyState = {
        board: structuredClone(s.board),
        columns: structuredClone(s.columns),
        cards: structuredClone(s.cards),
      };

      const cards = { ...s.cards };

      delete cards[columnId];

      return {
        history: [...s.history, historyState],
        future: [],

        columns: s.columns.filter((c) => c._id !== columnId),

        cards,
      };
    }),

  addCard: (card) =>
    set((s) => {
      const col = s.cards[card.column] || [];
      return {
        cards: {
          ...s.cards,
          [card.column]: [...col, card].sort((a, b) =>
            a.order > b.order ? 1 : -1,
          ),
        },
      };
    }),

  updateCard: (updated) =>
    set((s) => {
      const historyState = {
        board: structuredClone(s.board),
        columns: structuredClone(s.columns),
        cards: structuredClone(s.cards),
      };

      const col = s.cards[updated.column] || [];

      return {
        history: [...s.history, historyState],
        future: [],

        cards: {
          ...s.cards,
          [updated.column]: col.map((c) =>
            c._id === updated._id ? updated : c,
          ),
        },
      };
    }),

  moveCardOptimistic: (cardId, fromColumnId, toColumnId, newOrder) =>
    set((s) => {
      const historyState = {
        board: structuredClone(s.board),
        columns: structuredClone(s.columns),
        cards: structuredClone(s.cards),
      };

      const fromCards = (s.cards[fromColumnId] || []).filter(
        (c) => c._id !== cardId,
      );

      const card = (s.cards[fromColumnId] || []).find((c) => c._id === cardId);

      if (!card) return s;

      const movedCard = {
        ...card,
        column: toColumnId,
        order: newOrder,
      };

      const toCards = [
        ...(s.cards[toColumnId] || []).filter((c) => c._id !== cardId),
        movedCard,
      ].sort((a, b) => (a.order > b.order ? 1 : -1));

      return {
        history: [...s.history, historyState],
        future: [],

        cards: {
          ...s.cards,
          [fromColumnId]: fromCards,
          [toColumnId]: toCards,
        },
      };
    }),

  removeCard: (cardId, columnId) =>
    set((s) => {
      const historyState = {
        board: structuredClone(s.board),
        columns: structuredClone(s.columns),
        cards: structuredClone(s.cards),
      };

      return {
        history: [...s.history, historyState],
        future: [],

        cards: {
          ...s.cards,
          [columnId]: (s.cards[columnId] || []).filter((c) => c._id !== cardId),
        },
      };
    }),

  setPresence: (users) => set({ presence: users }),

  saveHistory: () => {
    const { board, columns, cards } = get();

    set((state) => ({
      history: [
        ...state.history,
        {
          board: structuredClone(board),
          columns: structuredClone(columns),
          cards: structuredClone(cards),
        },
      ],

      future: [],
    }));
  },

  undo: () =>
    set((state) => {
      if (state.history.length === 0) {
        return {};
      }

      const previous = state.history[state.history.length - 1];

      const newHistory = state.history.slice(0, -1);

      return {
        board: previous.board,
        columns: previous.columns,
        cards: previous.cards,

        history: newHistory,

        future: [
          {
            board: state.board,
            columns: state.columns,
            cards: state.cards,
          },
          ...state.future,
        ],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) {
        return {};
      }

      const next = state.future[0];

      const remainingFuture = state.future.slice(1);

      return {
        board: next.board,
        columns: next.columns,
        cards: next.cards,

        future: remainingFuture,

        history: [
          ...state.history,
          {
            board: state.board,
            columns: state.columns,
            cards: state.cards,
          },
        ],
      };
    }),
}));

export default useBoardStore;
