<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import { getTasks } from '@/api/taskService';
import { useRouter } from 'vue-router';
// Import các Icon cần thiết
import { ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, AcademicCapIcon, WrenchScrewdriverIcon, ArchiveBoxXMarkIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'; 


const router = useRouter();
const tasks = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

// Định nghĩa các Icon và Status
const STATUS_ICONS: { [key: string]: any } = {
    can_lam: ClipboardDocumentListIcon,
    dang_lam: WrenchScrewdriverIcon,
    cho_duyet: AcademicCapIcon,
    phe_duyet: CheckCircleIcon,
    can_sua: ExclamationTriangleIcon,
    bi_huy: ArchiveBoxXMarkIcon,
};

const taskStatuses = [
    { key: 'tat_ca', label: 'Tất cả' },
    { key: 'can_lam', label: 'Cần làm', color: 'text-gray-500' },
    { key: 'dang_lam', label: 'Đang làm', color: 'text-blue-500' },
    { key: 'cho_duyet', label: 'Chờ duyệt', color: 'text-yellow-600' },
    { key: 'phe_duyet', label: 'Phê duyệt', color: 'text-green-600' },
    { key: 'can_sua', label: 'Cần sửa', color: 'text-orange-500' },
    { key: 'bi_huy', label: 'Bị hủy', color: 'text-red-600' }, 
];

const currentFilter = ref('tat_ca'); 


const fetchTasks = async () => {
    isLoading.value = true;
    error.value = '';
    
    const params: { trang_thai?: string } = {};
    if (currentFilter.value !== 'tat_ca') {
        params.trang_thai = currentFilter.value;
    }
    
    try {
        // API Call: Backend tự động lọc theo vai trò (QL thấy tất cả, NV thấy của mình)
        const data = await getTasks(params);
        tasks.value = data;
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Không thể tải danh sách công việc.';
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

// Chuyển hướng đến trang chi tiết
const viewTaskDetail = (id: string) => {
    router.push({ name: 'task-detail', params: { id } });
}

// Logic định dạng ngày tháng
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Định dạng ngày tháng VN: DD/MM/YYYY
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

// Hàm định dạng trạng thái (Luôn trả về icon hoặc undefined)
const getStatusDisplay = (statusKey: string) => {
    const status = taskStatuses.find(s => s.key === statusKey) || { label: 'Không xác định', color: 'text-gray-400' };
    
    return {
        label: status.label,
        color: status.color,
        // Lấy Icon từ mapping (sẽ là undefined nếu statusKey là 'tat_ca')
        icon: STATUS_ICONS[statusKey],
    }
};

// Lắng nghe thay đổi filter và tải lại dữ liệu
const handleFilterChange = (key: string) => {
    currentFilter.value = key;
    fetchTasks();
}

// Dùng onMounted để tải dữ liệu lần đầu
onMounted(fetchTasks);

</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">Danh sách Công việc Của Tôi</h1>

            <div class="p-4 bg-white rounded-lg shadow-md flex space-x-3 overflow-x-auto">
                <button v-for="status in taskStatuses" :key="status.key"
                    @click="handleFilterChange(status.key)"
                    class="filter-button"
                    :class="{'bg-indigo-600 text-white shadow-lg': currentFilter === status.key, 'bg-gray-200 text-gray-700 hover:bg-gray-300': currentFilter !== status.key}">
                    
                    <component :is="getStatusDisplay(status.key).icon" v-if="getStatusDisplay(status.key).icon" class="w-5 h-5 mr-1" />
                    {{ status.label }}
                </button>
            </div>


            <div class="bg-white p-6 rounded-lg shadow">
                <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>
                <p v-if="isLoading" class="text-center py-8 text-lg">Đang tải danh sách công việc...</p>
                <p v-else-if="tasks.length === 0" class="text-center py-8 text-lg text-gray-500">
                    Không có công việc nào theo bộ lọc hiện tại.
                </p>
                
                <table v-else class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Tên Công Việc</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dự án</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người giao việc</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn chót</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="task in tasks" :key="task.id" 
                            :class="{'bg-red-50 hover:bg-red-100': new Date(task.han_chot) < new Date() && task.trang_thai !== 'phe_duyet', 'hover:bg-gray-50': true}">
                            
                            <td class="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">{{ task.tieu_de }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ task.du_an?.ten_du_an || 'N/A' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ task.nguoi_giao_viec?.ho_ten || 'N/A' }}</td>
                            
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
                                <button @click="viewTaskDetail(task.id)"
                                        class="text-indigo-600 hover:text-indigo-900 font-bold transition duration-150">
                                    Xem
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.filter-button {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 0.875rem; 
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;
}
</style>