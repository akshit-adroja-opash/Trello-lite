import API from './axios';

export const createCard = async (data) => {
    const response = await API.post('/cards', data);
    return response.data;
};

export const getCardsByColumn = async (columnId) => {
    const response = await API.get(`/cards/column/${columnId}`);
    return response.data;
};

export const updateCard = async (cardId, data) => {
    const response = await API.patch(`/cards/${cardId}`, data);
    return response.data;
};

export const getSingleCard = async (cardId) => {
    const response = await API.get(`/cards/${cardId}`);
    return response.data;
};

export const deleteCard = async (cardId) => {
    const response = await API.delete(`/cards/${cardId}`);
    return response.data;
};

export const moveCard = async (cardId, data) => {
    const response = await API.patch(`/cards/${cardId}/move`, data);
    return response.data;
};

export const getCardActivities = async (cardId) => {
    const response = await API.get(`/cards/${cardId}/activities`);
    return response.data;
};

export const addComment = async (cardId, data) => {
    const response = await API.post(`/cards/${cardId}/comments`, data);
    return response.data;
};

export const getMyTasks = async (params) => {
    const response = await API.get('/cards/my-tasks', { params });
    return response.data;
};

export const saveCardAsTemplate = async (cardId) => {
    const response = await API.post(`/cards/${cardId}/save-template`);
    return response.data;
};

export const getBoardTemplates = async (boardId) => {
    const response = await API.get(`/cards/board/${boardId}/templates`);
    return response.data;
};

export const toggleCommentReaction = async (cardId, commentId, emoji) => {
    const response = await API.post(`/cards/${cardId}/comments/${commentId}/react`, { emoji });
    return response.data;
};

export const uploadAttachment = async (cardId, file, targetAttachmentId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = targetAttachmentId
        ? `/cards/${cardId}/attachments?targetAttachmentId=${targetAttachmentId}`
        : `/cards/${cardId}/attachments`;
    const response = await API.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteAttachment = async (cardId, attachmentId, versionNumber = null) => {
    const url = versionNumber
        ? `/cards/${cardId}/attachments/${attachmentId}?versionNumber=${versionNumber}`
        : `/cards/${cardId}/attachments/${attachmentId}`;
    const response = await API.delete(url);
    return response.data;
};
