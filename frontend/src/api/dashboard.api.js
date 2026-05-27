import API from './axios';

export const getAdminDashboardData = async () => {
  const response = await API.get('/dashboard/admin');
  return response.data;
};

export const getProjectManagerDashboardData = async () => {
  const response = await API.get('/dashboard/project-manager');
  return response.data;
};

export const getDeveloperDashboardData = async () => {
  const response = await API.get('/dashboard/developer');
  return response.data;
};

export const getClientDashboardData = async () => {
  const response = await API.get('/dashboard/client');
  return response.data;
};
