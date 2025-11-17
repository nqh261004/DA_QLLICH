// frontend/src/api/taskService.ts
import apiClient from './client';

const TASK_URL = '/cong-viec'; // Định nghĩa URL gốc

// Hàm lấy danh sách công việc (có thể kèm theo filters/search)
export const getTasks = async (params = {}) => {
    try {
        const response = await apiClient.get(TASK_URL, { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Hàm lấy chi tiết công việc
export const getTaskDetail = async (id: string) => {
    try {
        const response = await apiClient.get(`${TASK_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Hàm cập nhật trạng thái công việc (Dùng cho Nhân viên)
export const updateTaskStatus = async (id: string, trang_thai: string) => {
    try {
        // Sử dụng URL chuyên biệt cho Nhân viên (PATCH /cong-viec/:id/trang-thai)
        const response = await apiClient.patch(`${TASK_URL}/${id}/trang-thai`, { trang_thai });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Hàm cập nhật nội dung công việc (Dùng cho Quản lý)
export const updateTaskContent = async (id: string, data: any) => {
    try {
        // Sử dụng URL chung (PATCH /cong-viec/:id)
        const response = await apiClient.patch(`${TASK_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};