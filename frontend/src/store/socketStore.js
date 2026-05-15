import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocketStore = create((set, get) => ({
    socket: null,
    connected: false,

    connect: () => {
        if (get().socket?.connected) return;

        const token = localStorage.getItem('token');
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
        });

        socket.on('connect', () => set({ connected: true }));
        socket.on('disconnect', () => set({ connected: false }));

        set({ socket });
    },

    disconnect: () => {
        get().socket?.disconnect();
        set({ socket: null, connected: false });
    },
}));

export default useSocketStore;
