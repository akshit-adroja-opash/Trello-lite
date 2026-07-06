import API from "./axios";

export const getNotificationPreferences = async () => {
  const res = await API.get("/preferences/notifications");
  return res.data.data;
};

export const updateNotificationPreferences = async (prefs) => {
  const res = await API.put("/preferences/notifications", prefs);
  return res.data;
};
