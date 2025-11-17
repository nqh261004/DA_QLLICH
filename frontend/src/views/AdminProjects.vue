// frontend/src/views/AdminProjects.vue (Đã sửa lỗi TypeScript)
<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import { getProjects, updateProject, deleteProject } from '@/api/projectService';
import { useAuthStore } from '@/stores/auth';
import { ArchiveBoxIcon, CheckCircleIcon, PlayIcon } from '@heroicons/vue/24/outline';


const authStore = useAuthStore();
const projects = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

// Logic để tải danh sách dự án
const fetchProjects = async () => {
    try {
        const data = await getProjects();
        projects.value = data;
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Không thể tải danh sách dự án.';
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

// Hàm định dạng trạng thái
const getStatusDisplay = (statusKey: string) => {
    const statuses: { [key: string]: any } = {
        sap_bat_dau: { label: 'Sắp bắt đầu', bg: 'bg-indigo-100', text: 'text-indigo-800', icon: PlayIcon },
        dang_tien_hanh: { label: 'Đang tiến hành', bg: 'bg-blue-100', text: 'text-blue-800', icon: PlayIcon },
        hoan_thanh: { label: 'Hoàn thành', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
        huy: { label: 'Đã hủy', bg: 'bg-red-100', text: 'text-red-800', icon: ArchiveBoxIcon },
    };
    return statuses[statusKey] || statuses['sap_bat_dau'];
};

// Hàm xử lý các hành động QUẢN TRỊ (Hoàn thành, Hủy, Xóa)
const handleAdminAction = async (project: any, action: 'HOAN_THANH' | 'HUY' | 'DELETE') => {
    // FIX LỖI: Sử dụng window.confirm
    if (!window.confirm(`Bạn có chắc chắn muốn thực hiện hành động ${action} với dự án ${project.ten_du_an}?`)) {
        return;
    }
    
    error.value = '';
    
    try {
        if (action === 'DELETE') {
            // Trường hợp XÓA HOÀN TOÀN (Gửi email cho tất cả người tham gia)
            await deleteProject(project.id);
            // FIX LỖI: Sử dụng window.alert
            window.alert(`Dự án "${project.ten_du_an}" đã bị xóa hoàn toàn. Email thông báo đã được gửi.`);
        } else {
            // Trường hợp CẬP NHẬT TRẠNG THÁI (Gửi email nếu HUY)
            await updateProject(project.id, { trang_thai: action });
            window.alert(`Trạng thái dự án đã được cập nhật thành ${getStatusDisplay(action).label}.`);
        }
        
        // Tải lại dữ liệu sau khi hành động thành công
        await fetchProjects();
    } catch (err: any) {
        // FIX LỖI: Sử dụng window.alert
        window.alert(err.response?.data?.message || 'Thực hiện hành động thất bại.');
        error.value = err.response?.data?.message || 'Thực hiện hành động thất bại.';
        console.error(err);
    }
};

// FIX LỖI: Sửa lại hàm alert trong template
const showFormAlert = (msg: string) => {
    window.alert(msg);
}

onMounted(() => {
    if (authStore.isManager) {
        fetchProjects();
    } else {
        error.value = 'Truy cập bị từ chối. Chỉ Quản lý mới có quyền quản lý dự án.';
    }
});
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">Quản lý Dự án</h1>
            
            <p v-if="error" class="alert-error">{{ error }}</p>

            <div v-if="!authStore.isManager">
                <p class="text-xl text-red-600 p-6 bg-red-100 rounded-lg">
                    Truy cập bị từ chối. Chỉ Quản lý mới có quyền quản lý dự án.
                </p>
            </div>
            
            <div v-else>
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-medium">Danh sách Dự án Phòng Ban</h3>
                    <button @click="showFormAlert('Mở form tạo dự án mới...')" 
                            class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-lg text-sm">
                        + Tạo Dự án Mới
                    </button>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-xl">
                    <p v-if="isLoading">Đang tải danh sách dự án...</p>
                    
                    <table v-else class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Dự án</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="project in projects" :key="project.id">
                                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{{ project.ten_du_an }}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="[getStatusDisplay(project.trang_thai).bg, getStatusDisplay(project.trang_thai).text, 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full']">
                                        {{ getStatusDisplay(project.trang_thai).label }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ new Date(project.ngay_tao).toLocaleDateString('vi-VN') }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                    
                                    <button v-if="project.trang_thai !== 'hoan_thanh' && project.trang_thai !== 'huy'"
                                        @click="handleAdminAction(project, 'HOAN_THANH')"
                                        class="action-btn text-green-600 hover:text-green-900">
                                        Hoàn thành
                                    </button>
                                    
                                    <button v-if="project.trang_thai !== 'hoan_thanh' && project.trang_thai !== 'huy'"
                                        @click="handleAdminAction(project, 'HUY')"
                                        class="action-btn text-yellow-600 hover:text-yellow-800">
                                        Hủy
                                    </button>

                                    <button @click="handleAdminAction(project, 'DELETE')"
                                        class="action-btn text-red-600 hover:text-red-900">
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.action-btn {
    @apply font-medium transition duration-150 p-1 rounded hover:bg-gray-100;
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}
</style>