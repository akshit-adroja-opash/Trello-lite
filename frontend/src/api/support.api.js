import API from './axios';

export const submitSupportRequest = async (data) => {
    const response = await API.post('/support', data);
    return response.data;
};
