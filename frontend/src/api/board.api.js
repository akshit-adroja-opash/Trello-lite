import API from "./axios";

export const createBoard = async (data) => {
  const response = await API.post("/boards", data);
  return response.data;
};

export const getBoardsByWorkspace = async (workspaceId) => {
  const response = await API.get(`/boards/workspace/${workspaceId}`);
  return response.data;
};

export const getSingleBoard = async (boardId) => {
  const response = await API.get(`/boards/${boardId}`);
  return response.data;
};

export const updateBoard = async (boardId, data) => {
  const response = await API.patch(`/boards/${boardId}`, data);
  return response.data;
};

export const deleteBoard = async (boardId) => {
  const response = await API.delete(`/boards/${boardId}`);
  return response.data;
};

export const getBoardMembers = async (boardId) => {
  const response = await API.get(`/boards/${boardId}/members`);
  return response.data;
};

export const addBoardMember = async (boardId, data) => {
  const response = await API.post(`/boards/${boardId}/members`, data);
  return response.data;
};

export const updateBoardMemberRole = async (boardId, memberId, data) => {
  const response = await API.patch(`/boards/${boardId}/members/${memberId}`, data);
  return response.data;
};

export const removeBoardMember = async (boardId, memberId) => {
  const response = await API.delete(`/boards/${boardId}/members/${memberId}`);
  return response.data;
};