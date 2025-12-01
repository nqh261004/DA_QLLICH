<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed } from 'vue';
import { getTasks } from '@/api/taskService';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title
} from 'chart.js';
import { Pie, Bar } from 'vue-chartjs';
import { 
    ClipboardDocumentListIcon, 
    ClockIcon, 
    ExclamationTriangleIcon, 
    AcademicCapIcon,
    EyeIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Title);

const authStore = useAuthStore();
const router = useRouter();
const tasks = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

const taskSummary = computed(() => {
    let overdueCount = 0; 
    let dueSoonCount = 0; 
    let pendingApprovalCount = 0; 
    let completedCount = 0;
    
    const statusCounts = { can_lam: 0, dang_lam: 0, cho_duyet: 0, phe_duyet: 0, bi_huy: 0 };
    const activeTasksList: any[] = []; 
    const now = new Date();
    const fortyEightHours = 48 * 60 * 60 * 1000;

    tasks.value.forEach(task => {
        const deadline = new Date(task.han_chot);
        if (Object.prototype.hasOwnProperty.call(statusCounts, task.trang_thai)) {
            statusCounts[task.trang_thai as keyof typeof statusCounts]++;
        }
        if (task.trang_thai === 'phe_duyet') completedCount++;

        if (task.trang_thai !== 'phe_duyet' && task.trang_thai !== 'bi_huy') {
            const isOverdue = deadline < now;
            const isDueSoon = deadline > now && (deadline.getTime() - now.getTime() < fortyEightHours);
            
            if (isOverdue) overdueCount++;
            if (isDueSoon) dueSoonCount++;
            if (task.trang_thai === 'cho_duyet') pendingApprovalCount++;

            if (isOverdue || isDueSoon || task.trang_thai === 'cho_duyet') {
                 activeTasksList.push(task);
            }
        }
    });

    return { overdueCount, dueSoonCount, pendingApprovalCount, completedCount, activeTasksList, statusCounts };
});

const pieChartData = computed(() => {
    const s = taskSummary.value.statusCounts;
    return {
        labels: ['Cần làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành'],
        datasets: [{
            backgroundColor: ['#9ca3af', '#3b82f6', '#eab308', '#22c55e'],
            data: [s.can_lam, s.dang_lam, s.cho_duyet, s.phe_duyet]
        }]
    };
});

const pieChartOptions = { responsive: true, maintainAspectRatio: false };

const barChartData = computed(() => {
    const counts: {[key: string]: number} = {};
    
    if (authStore.isManager) {
        tasks.value.forEach(t => {
            const name = t.nguoi_thuc_hien?.ho_ten || 'Chưa gán';
            counts[name] = (counts[name] || 0) + 1;
        });
    } else {
        tasks.value.forEach(t => {
            const projectName = t.du_an?.ten_du_an || 'Không xác định';
            counts[projectName] = (counts[projectName] || 0) + 1;
        });
    }

    const sorted = Object.entries(counts).sort(([,a], [,b]) => b - a).slice(0, 5);

    return {
        labels: sorted.map(([name]) => name),
        datasets: [{
            label: 'Số lượng công việc',
            backgroundColor: authStore.isManager ? '#6366f1' : '#0ea5e9', 
            data: sorted.map(([,count]) => count)
        }]
    };
});

const barChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        title: { 
            display: true, 
            text: authStore.isManager ? 'Những con ong chăm chỉ' : 'Phân bố công việc theo Dự án' 
        }
    }
}));

const fetchTasks = async () => {
    isLoading.value = true;
    try {
        const data = await getTasks({ limit: 1000 }); 
        tasks.value = Array.isArray(data) ? data : (data.data || []);
    } catch (err: any) {
        error.value = 'Không thể tải dữ liệu Dashboard.';
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
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        Chào mừng, {{ authStore.userName }}! 👋
                    </h1>
                    <p class="text-gray-500 mt-1">
                        {{ authStore.isManager ? 'Tổng quan tình hình nhân sự & công việc.' : 'Theo dõi tiến độ công việc cá nhân của bạn.' }}
                    </p>
                </div>
            </div>
            
            <p v-if="error" class="alert-error">{{ error }}</p>
            <div v-else-if="isLoading" class="text-center py-12">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                <p class="mt-4 text-gray-500">Đang tổng hợp số liệu...</p>
            </div>

            <div v-else class="space-y-8"> 
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="summary-card border-l-4 border-red-500">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-sm font-medium text-red-600 uppercase tracking-wider">Quá Hạn</p>
                                <p class="text-3xl font-extrabold text-gray-900 mt-1">{{ taskSummary.overdueCount }}</p>
                            </div>
                            <div class="p-2 bg-red-100 rounded-lg">
                                <ExclamationTriangleIcon class="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-card border-l-4 border-yellow-500">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-sm font-medium text-yellow-600 uppercase tracking-wider">Sắp Hết Hạn</p>
                                <p class="text-3xl font-extrabold text-gray-900 mt-1">{{ taskSummary.dueSoonCount }}</p>
                            </div>
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <ClockIcon class="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-card border-l-4 border-blue-500">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-sm font-medium text-blue-600 uppercase tracking-wider">Chờ Duyệt</p>
                                <p class="text-3xl font-extrabold text-gray-900 mt-1">{{ taskSummary.pendingApprovalCount }}</p>
                            </div>
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <AcademicCapIcon class="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div class="summary-card border-l-4 border-green-500">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-sm font-medium text-green-600 uppercase tracking-wider">Hoàn Thành</p>
                                <p class="text-3xl font-extrabold text-gray-900 mt-1">{{ taskSummary.completedCount }}</p>
                            </div>
                            <div class="p-2 bg-green-100 rounded-lg">
                                <CheckCircleIcon class="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 class="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Tỷ lệ Trạng thái</h3>
                        <div class="h-64 relative flex justify-center">
                            <Pie :data="pieChartData" :options="pieChartOptions" />
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 class="text-lg font-bold text-gray-800 mb-6 border-b pb-2">
                            {{ authStore.isManager ? 'Năng suất Nhân viên' : 'Phân bổ theo Dự án' }}
                        </h3>
                        <div class="h-64 relative">
                            <Bar :data="barChartData" :options="barChartOptions" />
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 class="text-xl font-bold text-gray-800 border-b pb-4 mb-4 flex items-center">
                        <ClipboardDocumentListIcon class="w-6 h-6 mr-2 text-indigo-600" /> 
                        Cần Xử Lý Ngay
                    </h3>
                    
                    <p v-if="taskSummary.activeTasksList.length === 0" class="text-center text-gray-500 py-6 italic bg-gray-50 rounded-lg">
                        Tuyệt vời! Hiện tại không có công việc nào quá hạn hoặc cần duyệt gấp.
                    </p>

                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Công việc</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự án</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người làm</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="task in taskSummary.activeTasksList.slice(0, 5)" :key="task.id" class="hover:bg-gray-50 transition-colors">
                                    <td class="px-4 py-3">
                                        <div class="font-medium text-gray-900">{{ task.tieu_de }}</div>
                                        <div v-if="new Date(task.han_chot) < new Date()" class="text-xs text-red-500 font-semibold mt-1">
                                            Quá hạn!
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-500">
                                        {{ task.du_an?.ten_du_an || 'N/A' }}
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-500">
                                        {{ task.nguoi_thuc_hien?.ho_ten || 'Chưa gán' }}
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <button @click="viewTaskDetail(task.id)" class="text-indigo-600 hover:text-indigo-900 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                                            <EyeIcon class="w-4 h-4 inline mr-1" /> Xem
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.summary-card {
    @apply bg-white p-6 rounded-xl shadow-md transition duration-300 transform hover:-translate-y-1 hover:shadow-xl;
}
.alert-error {
    @apply text-red-500 p-4 bg-red-50 rounded-lg border border-red-200 font-medium text-center;
}
</style>