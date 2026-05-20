import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchNotifications as apiFetch, markAsRead as apiMarkRead, markAllAsRead as apiMarkAll } from '../api/notification.api';
import useSocketStore from './socketStore';
import useAuthStore from './authstore';

const useNotificationStore = create(devtools((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  // Fetch from server
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch();
      set({
        notifications: data.notifications,
        unreadCount: data.notifications.filter((n) => !n.isRead).length,
      });
    } finally {
      set({ loading: false });
    }
  },

  // Add a notification received via socket
  addNotification: (notification) => {
    set((state) => {
      const newList = [notification, ...state.notifications];
      const newUnread = state.unreadCount + (notification.isRead ? 0 : 1);
      return { notifications: newList, unreadCount: newUnread };
    });
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    await apiMarkRead(id);
    set((state) => {
      const newList = state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      );
      const newUnread = state.unreadCount - 1;
      return { notifications: newList, unreadCount: Math.max(newUnread, 0) };
    });
  },

  // Mark all as read
  markAllAsRead: async () => {
    await apiMarkAll();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  // Set up socket listeners (call once after app loads)
  initSocketListeners: () => {
    const { socket } = useSocketStore.getState();
    const auth = useAuthStore.getState();
    if (!socket) return;

    // Register current user for direct notifications
    if (auth.user && auth.user._id) {
      socket.emit('register_user', auth.user._id);
    }

    socket.on('new_notification', (payload) => {
      get().addNotification(payload);
    });
  },
})),
);

export default useNotificationStore;
