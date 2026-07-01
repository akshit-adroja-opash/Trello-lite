import API from "./axios"

export const getWorkspaceAnalytics = async (workspaceId, timeRange = 'all') => {
    try {
        const response = await API.get(
            `/analytics/workspace/${workspaceId}?timeRange=${timeRange}`
        );

        return response.data;
    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        return error;
    }
};