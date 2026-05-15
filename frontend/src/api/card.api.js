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
