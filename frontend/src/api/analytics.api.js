import API from "./axios"

export const getWorkspaceAnalytics = async (workspaceId) => {
    try {
        const response = await API.get(
            `/analytics/workspace/${workspaceId}`
        );

        return response.data;
    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        return error;
    }
};