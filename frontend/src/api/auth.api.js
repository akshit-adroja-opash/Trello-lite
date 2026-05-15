import API from './axios';

export const registerUser = async (data) => {
    const response = await API.post('/auth/register', data);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await API.post('/auth/login', data);
    return response.data;
};

export const getMe = async () => {
    const response = await API.get('/auth/me');
    return response.data;
};

export const logoutUser = async () => {
    const response = await API.post('/auth/logout');
    return response.data;
};