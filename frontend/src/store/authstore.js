import { create } from "zustand";
import { loginUser, registerUser, getMe, logoutUser } from "../api/auth.api";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,

  register: async (data) => {
    set({ loading: true });

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
    } catch (err) {
      localStorage.removeItem("token");

      set({
        user: null,
        token: null,
      });
    }
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch (err) {
    }

    localStorage.removeItem("token");

    set({
      user: null,
      token: null,
    });
  },
}));

export default useAuthStore;