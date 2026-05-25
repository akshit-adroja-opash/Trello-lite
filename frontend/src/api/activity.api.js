import API from "./axios";

export const getBoardActivities = async (boardId) => {
    const response = await API.get(`/activities/board/${boardId}`);
    return response.data;
};
