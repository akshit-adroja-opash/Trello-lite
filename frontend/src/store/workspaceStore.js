import { create } from 'zustand';
import { getWorkspaces } from '../api/workspace.api';
import { getBoardsByWorkspace } from '../api/board.api';

const useWorkspaceStore = create((set, get) => ({
    workspaces: [],
    boardsByWorkspace: {},
    loading: false,
    fetched: false,
    error: null,

    reset: () => set({ workspaces: [], boardsByWorkspace: {}, loading: false, fetched: false, error: null }),

    fetchWorkspacesAndBoards: async (force = false) => {
        if (get().fetched && !force) return;
        
        set({ loading: true, error: null });
        try {
            const wsRes = await getWorkspaces();
            const wsList = wsRes.data?.workspaces || [];
            
            const map = {};
            await Promise.all(
                wsList.map(async (ws) => {
                    try {
                        const bRes = await getBoardsByWorkspace(ws._id);
                        map[ws._id] = bRes.data?.boards || [];
                    } catch (err) {
                        console.error(`Failed to fetch boards for workspace ${ws._id}`, err);
                        map[ws._id] = [];
                    }
                })
            );

            set({
                workspaces: wsList,
                boardsByWorkspace: map,
                fetched: true,
                loading: false,
            });
        } catch (error) {
            console.error('Failed to fetch workspaces', error);
            set({ error: error.message, loading: false });
        }
    },

    addWorkspace: (ws) =>
        set((s) => ({
            workspaces: [ws, ...s.workspaces],
            boardsByWorkspace: { ...s.boardsByWorkspace, [ws._id]: [] },
        })),

    removeWorkspace: (wsId) =>
        set((s) => {
            const newWs = s.workspaces.filter((w) => w._id !== wsId);
            const newMap = { ...s.boardsByWorkspace };
            delete newMap[wsId];
            return { workspaces: newWs, boardsByWorkspace: newMap };
        }),

    updateWorkspace: (wsId, updates) =>
        set((s) => ({
            workspaces: s.workspaces.map((w) =>
                w._id === wsId ? { ...w, ...updates } : w
            ),
        })),

    addBoard: (wsId, board) =>
        set((s) => ({
            boardsByWorkspace: {
                ...s.boardsByWorkspace,
                [wsId]: [...(s.boardsByWorkspace[wsId] || []), board],
            },
        })),

    removeBoard: (wsId, boardId) =>
        set((s) => ({
            boardsByWorkspace: {
                ...s.boardsByWorkspace,
                [wsId]: (s.boardsByWorkspace[wsId] || []).filter(
                    (b) => b._id !== boardId
                ),
            },
        })),

    updateBoard: (wsId, boardId, updates) =>
        set((s) => ({
            boardsByWorkspace: {
                ...s.boardsByWorkspace,
                [wsId]: (s.boardsByWorkspace[wsId] || []).map((b) =>
                    b._id === boardId ? { ...b, ...updates } : b
                ),
            },
        })),
}));

export default useWorkspaceStore;
