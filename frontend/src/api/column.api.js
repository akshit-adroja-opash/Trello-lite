import API from './axios';

export const createColumn = async (data) => {
    const response = await API.post('/columns', data);
    return response.data;
};

export const getColumnsByBoard = async (boardId) => {
    const response = await API.get(`/columns/board/${boardId}`);
    return response.data;
};

export const updateColumn = async (columnId, data) => {
    const response = await API.patch(`/columns/${columnId}`, data);
    return response.data;
};

export const deleteColumn = async (columnId) => {
    const response = await API.delete(`/columns/${columnId}`);
    return response.data;
};

export const reorderColumn = async (data) => {
    const response = await API.patch('/columns/reorder', data);
    return response.data;
};
