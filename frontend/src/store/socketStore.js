import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const isProduction = import.meta.env.PROD;

const useSocketStore = create((set, get) => ({
    socket: null,
    connected: false,

    connect: () => {
        if (get().socket?.connected) return;

        // Skip socket connection on Vercel (serverless doesn't support WebSockets)
        if (isProduction && SOCKET_URL.includes('vercel.app')) {
            console.info('[Socket] Skipped: WebSockets not supported on Vercel serverless.');
            return;
        }

        const token = localStorage.getItem('token');
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['polling', 'websocket'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
            timeout: 10000,
        });

        socket.on('connect', () => set({ connected: true }));
        socket.on('disconnect', () => set({ connected: false }));
        socket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        set({ socket });
    },

    disconnect: () => {
        get().socket?.disconnect();
        set({ socket: null, connected: false });
    },
}));

export default useSocketStore;
