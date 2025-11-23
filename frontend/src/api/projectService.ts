import apiClient from './client';

const PROJECT_URL = '/du-an'; 

export const getProjects = async (params = {}) => {
    try {
        const response = await apiClient.get(PROJECT_URL, { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateProject = async (id: string, data: any) => {
    try {
        const response = await apiClient.patch(`${PROJECT_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteProject = async (id: string) => {
    try {
        const response = await apiClient.delete(`${PROJECT_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};