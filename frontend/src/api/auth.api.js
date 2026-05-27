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

export const updateProfile = async (formData) => {
    const response = await API.patch('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getDevelopers = async () => {
    const response = await API.get('/auth/developers');
    return response.data;
};

export const deleteAccount = async () => {
    const response = await API.delete('/auth/account');
    return response.data;
};

export const getAllUsers = async () => {
    const response = await API.get('/auth/users');
    return response.data;
};

export const updateUserRole = async (userId, role) => {
    const response = await API.patch(`/auth/users/${userId}/role`, { role });
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await API.delete(`/auth/users/${userId}`);
    return response.data;
};

export const createUserByAdmin = async (userData) => {
    const response = await API.post('/auth/users', userData);
    return response.data;
};

export const get2FAStatus = async () => {
    const response = await API.get('/auth/2fa');
    return response.data;
};

export const toggle2FA = async (enabled) => {
    const response = await API.post('/auth/2fa', { enabled });
    return response.data;
};

export const getSessions = async () => {
    const response = await API.get('/auth/sessions');
    return response.data;
};

export const revokeSession = async (sessionId) => {
    const response = await API.delete(`/auth/sessions/${sessionId}`);
    return response.data;
};