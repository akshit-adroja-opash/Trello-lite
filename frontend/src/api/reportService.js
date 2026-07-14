import API from "./axios";

export const generateFullReport = async (boardId) => {
  const res = await API.post(`/reports/full/${boardId}`);
  return res.data;
};
export const generateClientReport = async (boardId) => {
  const res = await API.post(`/reports/client/${boardId}`);
  return res.data;
};
export const shareReportLink = async (reportId) => {
  const res = await API.post(`/reports/share/${reportId}`);
  return res.data;
};
export const getRecentReports = async (boardId = "") => {
  const url = boardId ? `/reports/recent/${boardId}` : "/reports/recent";
  const res = await API.get(url);
  return res.data;
};

export const downloadSharedReport = async (token) => {
  const res = await API.get(`/reports/shared/${token}`);
  return res.data;
};
