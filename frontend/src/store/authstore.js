import { create } from "zustand";
import { loginUser, registerUser, getMe, logoutUser, updateProfile as apiUpdateProfile, deleteAccount as apiDeleteAccount, updateUserPreferences as apiUpdatePreferences } from "../api/auth.api";
import useWorkspaceStore from "./workspaceStore";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,

  register: async (data) => {
    set({ loading: true });
    useWorkspaceStore.getState().reset();

    try {
      const res = await registerUser(data);

      localStorage.setItem("token", res.data.token);

      set({
        user: res.data.user,
        token: res.data.token,
      });
    } finally {
      set({ loading: false });
    }
  },

  login: async (data) => {
    set({ loading: true });
    useWorkspaceStore.getState().reset();

    try {
      const res = await loginUser(data);

      localStorage.setItem("token", res.data.token);

      set({
        user: res.data.user,
        token: res.data.token,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchMe: async () => {
    try {
      const res = await getMe();

      set({
        user: res.data.user,
      });
    } catch {
      localStorage.removeItem("token");
      useWorkspaceStore.getState().reset();

      set({
        user: null,
        token: null,
      });
    }
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch {
    }

    localStorage.removeItem("token");
    useWorkspaceStore.getState().reset();

    set({
      user: null,
      token: null,
    });
  },

  updateProfile: async (formData) => {
    const res = await apiUpdateProfile(formData);
    set({ user: res.data.user });
  },

  updatePreferences: async (preferences) => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      const updatedPrefs = {
        ...(currentUser.preferences || {}),
        ...preferences,
        dashboardWidgets: {
          ...((currentUser.preferences && currentUser.preferences.dashboardWidgets) || {}),
          ...((preferences && preferences.dashboardWidgets) || {})
        }
      };
      set({ user: { ...currentUser, preferences: updatedPrefs } });
      try {
        const res = await apiUpdatePreferences(preferences);
        if (res?.data?.user) {
          const latestUser = useAuthStore.getState().user;
          const mergedUser = {
            ...res.data.user,
            preferences: {
              ...(res.data.user.preferences || {}),
              ...((latestUser?.preferences) || {}),
              dashboardWidgets: {
                ...((res.data.user.preferences && res.data.user.preferences.dashboardWidgets) || {}),
                ...((latestUser?.preferences && latestUser.preferences.dashboardWidgets) || {})
              }
            }
          };
          set({ user: mergedUser });
        }
      } catch (err) {
        console.error('Failed to sync preferences:', err);
      }
    }
  },

  deleteAccountAction: async () => {
    try {
      await apiDeleteAccount();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));

export default useAuthStore;