import API from "./axios";

export const createWorkspace = async (data) => {
  const response = await API.post("/workspaces", data);
  return response.data;
};

export const getWorkspaces = async () => {
  const response = await API.get("/workspaces");
  return response.data;
};

export const inviteMember = async (workspaceId, data) => {
  const response = await API.post(`/workspaces/${workspaceId}/invite`, data);
  return response.data;
};

export const getMembers = async (workspaceId) => {
  const response = await API.get(`/workspaces/${workspaceId}/members`);
  return response.data;
};

export const updateMemberRole = async (workspaceId, memberId, data) => {
  const response = await API.patch(`/workspaces/${workspaceId}/members/${memberId}`, data);
  return response.data;
};

export const removeMember = async (workspaceId, memberId) => {
  const response = await API.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  return response.data;
};

export const updateWorkspace = async (workspaceId, data) => {
  const response = await API.patch(`/workspaces/${workspaceId}`, data);
  return response.data;
};

export const deleteWorkspace = async (workspaceId) => {
  const response = await API.delete(`/workspaces/${workspaceId}`);
  return response.data;
};

// Fetch total overdue tasks count for the dashboard
// Note: endpoint requires workspaceId
export const getOverdueCount = async (workspaceId) => {
  const response = await API.get(`/workspaces/${workspaceId}/overdue-count`);
  return response.data;
};

