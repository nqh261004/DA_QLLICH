import apiClient from './client';

const TASK_URL = '/cong-viec'; 

export const getTasks = async (params = {}) => {
    try {
        const response = await apiClient.get(TASK_URL, { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getTaskDetail = async (id: string) => {
    try {
        const response = await apiClient.get(`${TASK_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateTaskStatus = async (id: string, trang_thai: string) => {
    try {
        const response = await apiClient.patch(`${TASK_URL}/${id}/trang-thai`, { trang_thai });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateTaskContent = async (id: string, data: any) => {
    try {
        const response = await apiClient.patch(`${TASK_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteTask = async (id: string) => {
    try {
        const response = await apiClient.delete(`${TASK_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const submitTaskWork = async (id: string, formData: FormData) => {
    try {
        const response = await apiClient.post(`/cong-viec/${id}/nop-bai`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};