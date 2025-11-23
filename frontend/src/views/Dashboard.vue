<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue'; 
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getTasks } from '@/api/taskService'; 
import { ClockIcon, AcademicCapIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon, EyeIcon } from '@heroicons/vue/24/outline'; // Thêm EyeIcon
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const tasks = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

const taskSummary = computed(() => {
    let overdueCount = 0; 
    let dueSoonCount = 0; 
    let pendingApprovalCount = 0; 
    let totalActiveCount = 0;

    const activeTasksList: any[] = []; 

    const now = new Date();
    const fortyEightHours = 48 * 60 * 60 * 1000;

    tasks.value.forEach(task => {
        const deadline = new Date(task.han_chot);
        
        if (task.trang_thai === 'phe_duyet' || task.trang_thai === 'bi_huy') {
            return;
        }

        totalActiveCount++;
        
        const isOverdue = deadline < now;
        const isDueSoon = deadline > now && (deadline.getTime() - now.getTime() < fortyEightHours);
        
        if (isOverdue) overdueCount++;
        if (isDueSoon) dueSoonCount++;
        if (task.trang_thai === 'cho_duyet') pendingApprovalCount++;

        if (isOverdue || isDueSoon || task.trang_thai === 'cho_duyet') {
             activeTasksList.push(task);
        }
    });

    return { overdueCount, dueSoonCount, pendingApprovalCount, totalActiveCount, activeTasksList };
});


const fetchTasks = async () => {
    isLoading.value = true;
    error.value = '';
    try {
        const data = await getTasks(); 
        tasks.value = data;
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Không thể tải dữ liệu Dashboard.';
    } finally {
        isLoading.value = false;
    }
};

const viewTaskDetail = (id: string) => {
    router.push({ name: 'task-detail', params: { id } });
}

onMounted(fetchTasks);
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">
                Chào mừng, {{ authStore.userName }}!
            </h1>
            
            <p v-if="error" class="alert-error">{{ error }}</p>
            
            <p v-else-if="isLoading" class="text-center py-10">Đang tải dữ liệu Dashboard...</p>

            <div v-else> 
                <h2 class="text-2xl font-semibold mb-4 border-b pb-2">
                    Tổng quan Công việc {{ authStore.isManager ? 'Phòng Ban' : 'Của Bạn' }}
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div class="summary-card border-red-500">
                        <div class="flex justify-between items-center">
                            <p class="text-sm font-medium text-red-600">Quá Hạn</p>
                            <ExclamationTriangleIcon class="w-6 h-6 text-red-600" />
                        </div>
                        <p class="text-4xl font-extrabold text-gray-900 mt-1">{{ taskSummary.overdueCount }}</p>
                        <p class="text-xs text-gray-500">Công việc cần xử lý khẩn cấp</p>
                    </div>
                    
                    <div class="summary-card border-yellow-500">
                         <div class="flex justify-between items-center">
                            <p class="text-sm font-medium text-yellow-600">Sắp Hết Hạn</p>
                            <ClockIcon class="w-6 h-6 text-yellow-600" />
                        </div>
                        <p class="text-4xl font-extrabold text-gray-900 mt-1">{{ taskSummary.dueSoonCount }}</p>
                        <p class="text-xs text-gray-500">Công việc đến hạn trong 48 giờ tới</p>
                    </div>
                    
                    <div class="summary-card border-blue-500">
                         <div class="flex justify-between items-center">
                            <p class="text-sm font-medium text-blue-600">Chờ Phê duyệt</p>
                            <AcademicCapIcon class="w-6 h-6 text-blue-600" />
                        </div>
                        <p class="text-4xl font-extrabold text-gray-900 mt-1">{{ taskSummary.pendingApprovalCount }}</p>
                        <p class="text-xs text-gray-500">Đang đợi phản hồi từ Quản lý</p>
                    </div>
                </div>

                <div class="mt-8 bg-white p-6 rounded-xl shadow-lg">
                    <h3 class="text-xl font-medium border-b pb-2 mb-4 flex items-center">
                        <ClipboardDocumentListIcon class="w-5 h-5 mr-2" /> 
                        Công Việc Cần Xử Lý 
                    </h3>
                    
                    <p v-if="taskSummary.activeTasksList.length === 0" class="text-gray-500 italic py-4">
                        Không có Công việc nào cần hành động ngay lập tức.
                    </p>

                    <table v-else class="min-w-full divide-y divide-gray-200">
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="task in taskSummary.activeTasksList.slice(0, 3)" :key="task.id" class="hover:bg-gray-50">
                                <td class="py-3 px-2 text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {{ task.tieu_de }}
                                </td>
                                <td class="py-3 px-2 whitespace-nowrap text-sm text-gray-500">
                                    {{ task.du_an?.ten_du_an || 'N/A' }}
                                </td>
                                <td class="py-3 px-2 whitespace-nowrap text-sm text-gray-500">
                                    Người thực hiện: {{ task.nguoi_thuc_hien?.ho_ten || 'N/A' }}
                                </td>
                                <td class="py-3 px-2 text-right">
                                    <button @click="viewTaskDetail(task.id)" class="text-indigo-600 hover:text-indigo-900 font-bold text-sm">
                                        <EyeIcon class="w-4 h-4 inline mr-1" /> 
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
/* Style giữ nguyên */
.summary-card {
    @apply bg-white p-6 rounded-xl shadow-lg border-l-8 transition duration-300 transform hover:scale-[1.02];
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}
</style>