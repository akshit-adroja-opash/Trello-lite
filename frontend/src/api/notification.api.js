import API from "./axios";

export const fetchNotifications = async () => {
  const res = await API.get("/notifications");
  return res.data.data;
};

export const markAsRead = async (id) => {
  const res = await API.patch(`/notifications/${id}/read`);
  return res.data.data;
};

export const markAllAsRead = async () => {
  const res = await API.patch("/notifications/read-all");
  return res.data;
};
