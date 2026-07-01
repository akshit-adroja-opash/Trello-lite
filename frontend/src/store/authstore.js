import { create } from "zustand";
import { loginUser, registerUser, getMe, logoutUser, updateProfile as apiUpdateProfile, deleteAccount as apiDeleteAccount } from "../api/auth.api";
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