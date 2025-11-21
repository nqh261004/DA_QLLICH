<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import { getProjects, updateProject, deleteProject } from '@/api/projectService';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; 
import { ArchiveBoxIcon, CheckCircleIcon, PlayIcon, TrashIcon, XMarkIcon, AdjustmentsHorizontalIcon, ClockIcon, PencilSquareIcon, EyeIcon } from '@heroicons/vue/24/outline'; 

const authStore = useAuthStore();
const toast = useToast();
const router = useRouter();

const projects = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

const currentPage = ref(1);
const itemsPerPage = 5;

const FINAL_PROJECT_STATUSES = ['hoan_thanh', 'huy'];

// --- STATE MODAL VÀ ACTION ---
const isCreateModalOpen = ref(false); // Modal Tạo Dự án
const isConfirmModalOpen = ref(false); // Modal Xác nhận Hành động
const projectToActOn = ref<any>(null); // Dự án đang được chọn
const currentAction = ref<'HOAN_THANH' | 'HUY' | 'DELETE' | null>(null); // Hành động đang chờ xác nhận
// --- STATE FILTER ---
const currentFilter = ref('tat_ca'); 
const projectStatuses = [
    { key: 'tat_ca', label: 'Tất cả', icon: AdjustmentsHorizontalIcon },
    { key: 'sap_bat_dau', label: 'Sắp bắt đầu', icon: ClockIcon },
    { key: 'dang_tien_hanh', label: 'Đang tiến hành', icon: PlayIcon },
    { key: 'hoan_thanh', label: 'Hoàn thành', icon: CheckCircleIcon },
    { key: 'huy', label: 'Đã hủy', icon: ArchiveBoxIcon },
];

interface Project {
    id: string;
    ten_du_an: string;
    trang_thai: 'sap_bat_dau' | 'dang_tien_hanh' | 'hoan_thanh' | 'huy';
    ngay_tao: string;
}

// Logic để tải danh sách dự án (ĐÃ SỬA: Nhận tham số filter)
const fetchProjects = async () => {
    try {
        error.value = '';
        // Tạo tham số filter
        const params: { trang_thai?: string, page?: number, limit?: number } = {};
        if (currentFilter.value !== 'tat_ca') {
            params.trang_thai = currentFilter.value.toUpperCase(); // Chuyển sang uppercase cho Backend
        }

        params.page = currentPage.value;
    params.limit = itemsPerPage;

        const data = await getProjects(params);
        if (data.length === 0 && currentPage.value > 1) {
            currentPage.value -= 1;
            await fetchProjects(); 
            return; 
        }
        projects.value = data;
    } catch (err: any) {
        if (!authStore.isManager) {
            error.value = 'Truy cập bị từ chối. Chỉ Quản lý mới có quyền quản lý dự án.';
        } else {
            error.value = err.response?.data?.message || 'Không thể tải danh sách dự án.';
        }
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

const handlePageChange = (newPage: number) => {
    currentPage.value = newPage;
    fetchProjects();
}

// Hàm định dạng trạng thái
const getStatusDisplay = (statusKey: string) => {
    const statuses: { [key: string]: any } = {
        sap_bat_dau: { label: 'Sắp bắt đầu', bg: 'bg-indigo-100', text: 'text-indigo-800', icon: PlayIcon },
        dang_tien_hanh: { label: 'Đang tiến hành', bg: 'bg-blue-100', text: 'text-blue-800', icon: PlayIcon },
        hoan_thanh: { label: 'Hoàn thành', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
        huy: { label: 'Đã hủy', bg: 'bg-red-100', text: 'text-red-800', icon: ArchiveBoxIcon },
    };
    return statuses[statusKey.toLowerCase()] || statuses['sap_bat_dau'];
};

// --- LOGIC: Xử lý thay đổi Filter ---
const handleFilterChange = (key: string) => {
    currentFilter.value = key;
    fetchProjects(); 
}

const handleViewDetail = (id: string) => {
    router.push({ name: 'admin-project-detail', params: { id: id } });
};
// --- KẾT THÚC LOGIC ---

// Hàm xử lý các hành động QUẢN TRỊ (Hoàn thành, Hủy, Xóa)
const handleConfirmAction = async () => {
    if (!projectToActOn.value || !currentAction.value) return;

    const project = projectToActOn.value;
    const action = currentAction.value;
    
    error.value = '';
    
    try {
        if (action === 'DELETE') {
            await deleteProject(project.id);
            toast.success(`Dự án "${project.ten_du_an}" đã bị xóa.`);
        } else {
            const newStatusKey = action.toLowerCase(); // Chuyển thành 'hoan_thanh' hoặc 'huy'
            
            await updateProject(project.id, { trang_thai: newStatusKey }); // Gửi status lowercase
            
            toast.success(`Dự án "${project.ten_du_an}" đã chuyển sang trạng thái ${getStatusDisplay(newStatusKey).label}.`);
        }
        
        // Dọn dẹp Modal và tải lại dữ liệu
        isConfirmModalOpen.value = false;
        await fetchProjects();

    } catch (err: any) {
        // Bắt lỗi Task-based Integrity (ví dụ: còn Task chưa phê duyệt)
        const errorMessage = err.response?.data?.message || 'Thực hiện hành động thất bại.';
        toast.error(errorMessage);
        error.value = errorMessage;
    }
};

// Hàm mở Modal xác nhận
const handleOpenModal = (project: Project, action: 'HOAN_THANH' | 'HUY' | 'DELETE') => {
    projectToActOn.value = project;
    currentAction.value = action;
    isConfirmModalOpen.value = true;
};

// Logic khi tạo dự án xong (từ ProjectForm)
const handleProjectCreated = () => {
    toast.success('Dự án mới đã được tạo thành công.');
    fetchProjects();
}

const handleEditProjectDetail = (project: any) => {
    // 1. Kiểm tra trạng thái Dự án (Logic CHẶN)
    if (FINAL_PROJECT_STATUSES.includes(project.trang_thai)) {
        // Nếu ở trạng thái kết thúc, CHẶN và hiển thị Toast lỗi
        toast.error(`Không thể chỉnh sửa Dự án "${project.ten_du_an}" vì đã ở trạng thái ${getStatusDisplay(project.trang_thai).label}.`);
        return; // Dừng hàm tại đây
    }

    
    // Chuyển hướng đến trang sửa dự án
    router.push({ name: 'admin-edit-project', params: { id: project.id } });
};

onMounted(() => {
    if (authStore.isManager) {
        fetchProjects();
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
                <div class="p-4 bg-white rounded-lg shadow-md flex space-x-3 overflow-x-auto mb-6">
                    <button v-for="status in projectStatuses" :key="status.key"
                        @click="handleFilterChange(status.key)"
                        class="filter-button"
                        :class="{'bg-indigo-600 text-white shadow-lg': currentFilter === status.key, 'bg-gray-200 text-gray-700 hover:bg-gray-300': currentFilter !== status.key}">
                        
                        <component :is="status.icon" class="w-5 h-5 mr-1" />
                        {{ status.label }}
                    </button>
                </div>

                <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-medium">Danh sách Dự án Phòng Ban</h3>
                <router-link :to="{ name: 'admin-create-project' }" 
                        class="btn-primary bg-indigo-600 hover:bg-indigo-700">
                    + Tạo Dự án Mới
                </router-link>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-xl">
                    <p v-if="isLoading">Đang tải danh sách dự án...</p>

                    <p v-else-if="projects.length === 0" class="text-center py-8 text-lg text-gray-500">Không có dự án nào theo bộ lọc hiện tại.</p>
                    
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

                                    <button @click="handleViewDetail(project.id)"
            class="action-icon-btn text-blue-600 hover:text-blue-800" title="Xem chi tiết dự án">
        <EyeIcon class="w-5 h-5 inline" />
    </button>

                                    <button @click="handleEditProjectDetail(project)"
                                        class="action-icon-btn text-blue-600 hover:text-blue-800" title="Sửa thông tin">
                                    <PencilSquareIcon class="w-5 h-5 inline" />
                                    </button>
                                    
                                    <button v-if="project.trang_thai !== 'hoan_thanh' && project.trang_thai !== 'huy'"
                                        @click="handleOpenModal(project, 'HOAN_THANH')"
                                        class="action-icon-btn text-green-600 hover:text-green-900" title="Hoàn thành dự án">
                                        <CheckCircleIcon class="w-5 h-5 inline" />
                                    </button>
                                    
                                    <button v-if="project.trang_thai !== 'hoan_thanh' && project.trang_thai !== 'huy'"
                                        @click="handleOpenModal(project, 'HUY')"
                                        class="action-icon-btn text-yellow-600 hover:text-yellow-800" title="Hủy dự án">
                                        <ArchiveBoxIcon class="w-5 h-5 inline" />
                                    </button>

                                    <button @click="handleOpenModal(project, 'DELETE')"
                                        class="action-icon-btn text-red-600 hover:text-red-900" title="Xóa dự án">
                                        <TrashIcon class="w-5 h-5 inline" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <ProjectForm :is-open="isCreateModalOpen" 
                     @close="isCreateModalOpen = false"
                     @project-created="handleProjectCreated()" />

        <div v-if="isConfirmModalOpen && projectToActOn" class="modal-overlay">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 class="text-xl font-semibold text-red-600 mb-4 flex items-center">Xác nhận Hành động</h3>
                    <button @click="isConfirmModalOpen = false" class="text-gray-500 hover:text-gray-700">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>
                
                <p v-if="currentAction === 'DELETE'" class="mb-6 text-gray-700">
                    Bạn có chắc chắn muốn XÓA DỰ ÁN "**{{ projectToActOn.ten_du_an }}**" vĩnh viễn không? Hành động này sẽ xóa tất cả công việc liên quan và không thể hoàn tác.
                </p>
                 <p v-else-if="currentAction === 'HUY'" class="mb-6 text-gray-700">
                    Bạn có chắc chắn muốn **HỦY DỰ ÁN** "**{{ projectToActOn.ten_du_an }}**" không? Tất cả công việc đang làm sẽ được chuyển sang trạng thái "Bị hủy" và email thông báo sẽ được gửi.
                </p>
                 <p v-else class="mb-6 text-gray-700">
                    Bạn có chắc chắn muốn **HOÀN THÀNH DỰ ÁN** "**{{ projectToActOn.ten_du_an }}**" không? Hệ thống sẽ kiểm tra tất cả công việc con đã được phê duyệt.
                </p>
                
                <div class="flex justify-end space-x-3">
                    <button @click="isConfirmModalOpen = false" class="btn-secondary">
                        Hủy
                    </button>
                    <button @click="handleConfirmAction" 
                            class="font-bold py-2 px-4 rounded shadow-lg text-sm transition text-white"
                            :class="{'bg-red-600 hover:bg-red-700': currentAction === 'DELETE' || currentAction === 'HUY', 'bg-green-600 hover:bg-green-700': currentAction === 'HOAN_THANH'}">
                        {{ currentAction === 'DELETE' ? 'Xác nhận Xóa' : 'Xác nhận' }}
                    </button>
                </div>
            </div>
        </div>
        <div class="flex justify-between items-center mt-6 p-4 bg-white rounded-lg shadow">
                <p class="text-sm text-gray-600">
                    Hiển thị {{ projects.length }} dự án (Trang {{ currentPage }})
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
                        :disabled="projects.length < itemsPerPage"
                        class="btn-secondary">
                        Trang sau →
                    </button>
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

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
</style>