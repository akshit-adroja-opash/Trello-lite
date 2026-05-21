import API from "./axios";

export const generateFullReport = async (boardId) => {
  const res = await API.post(`/reports/full/${boardId}`);
  return res.data;
};
export const generateClientReport = async (boardId) => {
  const res = await API.post(`/reports/client/${boardId}`);
  
  return res.data;
};
