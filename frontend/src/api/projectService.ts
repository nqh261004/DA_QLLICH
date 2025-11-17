// frontend/src/api/projectService.ts
import apiClient from './client';

const PROJECT_URL = '/du-an'; // Định nghĩa URL gốc

// Hàm lấy danh sách dự án (Chỉ QL thấy phòng ban, NV thấy dự án tham gia)
export const getProjects = async (params = {}) => {
    try {
        const response = await apiClient.get(PROJECT_URL, { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Hàm cập nhật trạng thái hoặc nội dung dự án (Chỉ QL)
export const updateProject = async (id: string, data: any) => {
    try {
        const response = await apiClient.patch(`${PROJECT_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Hàm xóa dự án (Chỉ QL - Kích hoạt Cascading Delete ở Backend)
export const deleteProject = async (id: string) => {
    try {
        const response = await apiClient.delete(`${PROJECT_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};