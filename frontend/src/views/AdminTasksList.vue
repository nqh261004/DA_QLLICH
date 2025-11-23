<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import { getTasks, deleteTask } from '@/api/taskService'; 
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; 
import { useAuthStore } from '@/stores/auth';
import { CheckCircleIcon, ExclamationTriangleIcon, AcademicCapIcon, WrenchScrewdriverIcon, ArchiveBoxXMarkIcon, ClipboardDocumentListIcon, EyeIcon, AdjustmentsHorizontalIcon, ClockIcon, PlusCircleIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'; 

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore(); 

const tasks = ref<any[]>([]);
const users = ref<any[]>([]); 
const isLoading = ref(true);
const error = ref('');

const currentPage = ref(1);
const itemsPerPage = 5; 

const FINAL_TASK_STATUSES = ['phe_duyet', 'bi_huy'];

const isConfirmDeleteModalOpen = ref(false);
const taskToDeleteId = ref('');
const taskToDeleteTitle = ref('');

const STATUS_ICONS: { [key: string]: any } = {
    can_lam: ClipboardDocumentListIcon,
    dang_lam: WrenchScrewdriverIcon,
    cho_duyet: AcademicCapIcon,
    phe_duyet: CheckCircleIcon,
    can_sua: ExclamationTriangleIcon,
    bi_huy: ArchiveBoxXMarkIcon,
};

const taskStatuses = [
    { key: 'tat_ca', label: 'Tất cả', icon: AdjustmentsHorizontalIcon },
    { key: 'can_lam', label: 'Cần làm', color: 'text-gray-500', icon: ClipboardDocumentListIcon },
    { key: 'dang_lam', label: 'Đang làm', color: 'text-blue-500', icon: WrenchScrewdriverIcon },
    { key: 'cho_duyet', label: 'Chờ duyệt', color: 'text-yellow-600', icon: AcademicCapIcon },
    { key: 'phe_duyet', label: 'Phê duyệt', color: 'text-green-600', icon: CheckCircleIcon },
    { key: 'can_sua', label: 'Cần sửa', color: 'text-orange-500', icon: ExclamationTriangleIcon },
    { key: 'bi_huy', label: 'Bị hủy', color: 'text-red-600', icon: ArchiveBoxXMarkIcon }, 
];

const currentFilter = ref('tat_ca'); 

const fetchTasks = async () => {
    isLoading.value = true;
    error.value = '';

    try {
        const params: { trang_thai?: string; page?: number; limit?: number } = {};
        if (currentFilter.value !== 'tat_ca') {
            params.trang_thai = currentFilter.value.toUpperCase();
        }
        params.page = currentPage.value;
        params.limit = itemsPerPage;

        const data = await getTasks(params);

        if (data.length === 0 && currentPage.value > 1) {
            currentPage.value -= 1;
            await fetchTasks();
            return;
        }

        tasks.value = data;
    } catch (err: any) {
        if (!authStore.isManager) {
            error.value = 'Truy cập bị từ chối. Chỉ Quản lý mới có quyền quản lý công việc.';
        } else {
            error.value = err.response?.data?.message || 'Không thể tải danh sách công việc.';
        }
        toast.error(error.value);
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

const handlePageChange = (newPage: number) => {
    currentPage.value = newPage;
    fetchTasks();
}

const viewTaskDetail = (id: string) => {
    router.push({ 
        name: 'task-detail', 
        params: { id } ,
        query: { fromAdmin: 'true' }
    });
}

const handleEditDetail = (task: any) => {
    if (FINAL_TASK_STATUSES.includes(task.trang_thai)) {
        toast.error(`Không thể chỉnh sửa Task "${task.tieu_de}" vì đã ở trạng thái ${getStatusDisplay(task.trang_thai).label}.`, { timeout: 3500 });
        return; 
    }
    router.push({ name: 'admin-edit-task', params: { id: task.id } });
};

const openDeleteModal = (taskId: string, taskTitle: string) => {
    taskToDeleteId.value = taskId;
    taskToDeleteTitle.value = taskTitle;
    isConfirmDeleteModalOpen.value = true;
};

const handleDeleteTask = async () => {
    const id = taskToDeleteId.value;
    const title = taskToDeleteTitle.value;
    
    isConfirmDeleteModalOpen.value = false; 

    try {
        await deleteTask(id);
        toast.success(`Công việc "${title}" đã được xóa thành công.`);
        
        await fetchTasks();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa công việc.');
        error.value = error.response?.data?.message || 'Có lỗi xảy ra khi xóa công việc.';
    }
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

const getStatusDisplay = (statusKey: string) => {
    const status = taskStatuses.find(s => s.key === statusKey) || { label: 'Không xác định', color: 'text-gray-400' };
    
    return {
        label: status.label,
        color: status.color,
        icon: STATUS_ICONS[statusKey],
    }
};

const handleFilterChange = (key: string) => {
    currentFilter.value = key;
    fetchTasks();
}

const handleCreateNewTask = () => {
    router.push({ name: 'admin-new-task' }); 
}

onMounted(fetchTasks);
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">Quản lý Toàn bộ Công việc Phòng Ban</h1>

            <div class="p-4 bg-white rounded-lg shadow-md flex space-x-3 overflow-x-auto">
                <button v-for="status in taskStatuses" :key="status.key"
                    @click="handleFilterChange(status.key)"
                    class="filter-button"
                    :class="{'bg-indigo-600 text-white shadow-lg': currentFilter === status.key, 'bg-gray-200 text-gray-700 hover:bg-gray-300': currentFilter !== status.key}">
                    
                    <component :is="getStatusDisplay(status.key).icon" v-if="getStatusDisplay(status.key).icon" class="w-5 h-5 mr-1" />
                    {{ status.label }}
                </button>
            </div>

            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-medium">Danh sách Task</h3>
                <button @click="handleCreateNewTask" 
                        class="btn-primary bg-indigo-600 hover:bg-indigo-700">
                    <bg-indigo-600 hover:bg-indigo-700/> + Tạo Công việc Mới
                </button>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
                <p v-if="error" class="alert-error">{{ error }}</p>
                <p v-if="isLoading" class="text-center py-8 text-lg">Đang tải danh sách công việc...</p>
                <p v-else-if="tasks.length === 0" class="text-center py-8 text-lg text-gray-500">
                    Không có công việc nào theo bộ lọc hiện tại.
                </p>
                
                <table v-else class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Tên Công Việc</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người thực hiện</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dự án</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn chót</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="task in tasks" :key="task.id" 
                            :class="{'bg-red-50 hover:bg-red-100': new Date(task.han_chot) < new Date() && task.trang_thai !== 'phe_duyet', 'hover:bg-gray-50': true}">
                            
                            <td class="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">{{ task.tieu_de }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ task.nguoi_thuc_hien?.ho_ten || 'N/A' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ task.du_an?.ten_du_an || 'N/A' }}</td>
                            
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                                :class="{'text-red-500': new Date(task.han_chot) < new Date() && task.trang_thai !== 'phe_duyet'}">
                                {{ formatDate(task.han_chot) }}
                            </td>
                            
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="getStatusDisplay(task.trang_thai).color"
                                      class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-opacity-20 capitalize">
                                    
                                    <component :is="getStatusDisplay(task.trang_thai).icon" v-if="getStatusDisplay(task.trang_thai).icon" class="w-4 h-4 mr-1" />
                                    {{ getStatusDisplay(task.trang_thai).label }}
                                </span>
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                                <button @click="handleEditDetail(task)"
                                    class="action-icon-btn text-blue-600 hover:text-blue-800" title="Chỉnh sửa công việc">
                                    <PencilSquareIcon class="w-5 h-5 inline" />
                                </button>

                                <button @click="viewTaskDetail(task.id)"
                                    class="action-icon-btn text-indigo-600 hover:text-indigo-900" title="Xem chi tiết">
                                    <EyeIcon class="w-5 h-5 inline" />
                                </button>

                                <button @click="openDeleteModal(task.id, task.tieu_de)"
                                    class="action-icon-btn text-red-600 hover:text-red-800" title="Xóa công việc">
                                    <TrashIcon class="w-5 h-5 inline" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="flex justify-between items-center mt-6 p-4 bg-white rounded-lg shadow">
            <p class="text-sm text-gray-600">
                Hiển thị {{ tasks.length }} công việc (trang {{ currentPage }})
            </p>
            <div class="flex space-x-3">
                <button 
                    @click="handlePageChange(currentPage - 1)" 
                    :disabled="currentPage === 1"
                    class="btn-secondary">
                    ← Trang trước
                </button>
                <button 
                    @click="handlePageChange(currentPage + 1)" 
                    :disabled="tasks.length < itemsPerPage" 
                    class="btn-secondary">
                    Trang sau →
                </button>
            </div>
        </div>
        </div>

        <div v-if="isConfirmDeleteModalOpen && taskToDeleteTitle" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 class="text-xl font-bold text-red-600">Xác nhận</h3>
                    <button @click="isConfirmDeleteModalOpen = false" class="text-gray-500 hover:text-gray-700">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>
                
                <p class="text-gray-700 mb-6">
                    Bạn có chắc chắn muốn xóa công việc {{ taskToDeleteTitle }} không? 
                </p>
                
                <div class="flex justify-end space-x-3">
                    <button @click="isConfirmDeleteModalOpen = false" class="btn-secondary">
                        Hủy bỏ
                    </button>
                    <button @click="handleDeleteTask" class="btn-primary bg-red-600 hover:bg-red-700">
                        Xoá
                    </button>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.filter-button {
    @apply flex items-center px-4 py-2 border rounded-lg font-semibold text-sm transition duration-150;
}
.action-icon-btn {
    @apply transition duration-150 p-1 rounded hover:bg-gray-200;
}
.btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-lg text-sm;
}
.btn-secondary {
    @apply bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm;
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}
.alert-success {
    @apply text-green-700 p-3 bg-green-100 rounded-lg border border-green-300 font-medium;
}
</style>