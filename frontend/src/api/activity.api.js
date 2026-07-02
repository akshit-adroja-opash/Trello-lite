import API from "./axios";

export const getBoardActivities = async (boardId) => {
    const response = await API.get(`/activities/board/${boardId}`);
    return response.data;
};

export const getWorkspaceActivities = async (workspaceId) => {
    const response = await API.get(`/activities/workspace/${workspaceId}`);
    return response.data;
};

export const getUserActivities = async (userId) => {
    const response = await API.get(`/activities/user/${userId}`);
    return response.data;
};
