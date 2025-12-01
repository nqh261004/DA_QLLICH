<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/api/client';
import { useToast } from 'vue-toastification';
import { 
    ArrowLeftIcon, 
    EyeIcon, 
    CalendarIcon, 
    UserIcon, 
    BriefcaseIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon
} from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const projectId = computed(() => route.params.id as string);

const project = ref<any>(null);
const isLoading = ref(true);

const currentTaskPage = ref(1);
const tasksPerPage = 5;
const pagedTasks = computed(() => {
  if (!project.value?.cong_viec) return [];
  const start = (currentTaskPage.value - 1) * tasksPerPage;
  return project.value.cong_viec.slice(start, start + tasksPerPage);
});

const handleTaskPageChange = (newPage: number) => {
  if (newPage < 1) return;
  if (project.value && (newPage - 1) * tasksPerPage >= project.value.cong_viec.length) return;
  currentTaskPage.value = newPage;
};

// --- Tính toán tiến độ ---
const projectProgress = computed(() => {
    if (!project.value?.cong_viec || project.value.cong_viec.length === 0) return 0;
    const completed = project.value.cong_viec.filter((t: any) => t.trang_thai === 'phe_duyet').length;
    return Math.round((completed / project.value.cong_viec.length) * 100);
});

const projectStats = computed(() => {
    const tasks = project.value?.cong_viec || [];
    return {
        total: tasks.length,
        completed: tasks.filter((t: any) => t.trang_thai === 'phe_duyet').length,
        inProgress: tasks.filter((t: any) => t.trang_thai === 'dang_lam' || t.trang_thai === 'cho_duyet' || t.trang_thai === 'can_sua').length,
        pending: tasks.filter((t: any) => t.trang_thai === 'can_lam').length
    };
});


const STATUS_MAP: { [key: string]: { label: string; class: string } } = {
  sap_bat_dau: { label: 'Sắp bắt đầu', class: 'bg-indigo-100 text-indigo-800' },
  dang_tien_hanh: { label: 'Đang tiến hành', class: 'bg-blue-100 text-blue-800' },
  hoan_thanh: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800' },
  huy: { label: 'Hủy', class: 'bg-red-100 text-red-800' },

  can_lam: { label: 'Cần làm', class: 'bg-gray-100 text-gray-600' },
  dang_lam: { label: 'Đang làm', class: 'bg-blue-100 text-blue-800' },
  cho_duyet: { label: 'Chờ duyệt', class: 'bg-yellow-100 text-yellow-800' },
  can_sua: { label: 'Cần sửa', class: 'bg-orange-100 text-orange-800' }, 
  phe_duyet: { label: 'Phê duyệt', class: 'bg-green-100 text-green-800' },
  bi_huy: { label: 'Bị hủy', class: 'bg-red-100 text-red-800' },
};

const getStatusDisplay = (status: string) => STATUS_MAP[status?.toLowerCase()] || { label: status, class: 'bg-gray-100 text-gray-800' };
const getStatusClass = (status: string) => `px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusDisplay(status).class}`;

const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const isTaskOverdue = (dateString: string | null, status: string) => !dateString || ['phe_duyet','bi_huy'].includes(status) ? false : new Date() > new Date(dateString);

const viewTaskDetail = (id: string) => {
    router.push({ name: 'task-detail', params: { id }, query: { fromAdmin: 'true' } });
}

const fetchProjectDetail = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.get(`/du-an/${projectId.value}`);
    project.value = response.data;
    if (project.value.cong_viec) {
      project.value.cong_viec.sort((a: any,b: any)=> new Date(a.han_chot).getTime() - new Date(b.han_chot).getTime());
    }
  } catch (err: any) {
    toast.error('Không thể tải chi tiết dự án.');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (projectId.value) fetchProjectDetail();
});
</script>

<template>
  <MainLayout>
    <div class="max-w-6xl mx-auto space-y-6">
      <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Quay lại
            </button>

      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-500">Đang tải thông tin dự án...</p>
      </div>

      <div v-else-if="project" class="space-y-6">
        
        <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div class="p-6 md:p-8">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <span :class="getStatusClass(project.trang_thai)">{{ getStatusDisplay(project.trang_thai).label }}</span>
                            <span class="text-gray-400 text-sm flex items-center">
                                <CalendarIcon class="w-4 h-4 mr-1"/> {{ formatDateTime(project.ngay_bat_dau) }} - {{ formatDateTime(project.ngay_ket_thuc_du_kien) }}
                            </span>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-900">{{ project.ten_du_an }}</h1>
                    </div>
                    
                    <div class="w-full md:w-1/3">
                        <div class="flex justify-between text-sm font-medium mb-1">
                            <span class="text-gray-600">Tiến độ</span>
                            <span class="text-indigo-600">{{ projectProgress }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" :style="{ width: projectProgress + '%' }"></div>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex flex-wrap gap-6 text-sm text-gray-600 border-t pt-4">
                    <div class="flex items-center">
                        <UserIcon class="w-5 h-5 mr-2 text-gray-400"/>
                        Quản lý: <strong class="ml-1 text-gray-800">{{ project.nguoi_quan_ly?.ho_ten || 'Chưa gán' }}</strong>
                    </div>
                    <div class="flex items-center max-w-2xl">
                        <BriefcaseIcon class="w-5 h-5 mr-2 text-gray-400 flex-shrink-0"/>
                        <span>{{ project.mo_ta || 'Không có mô tả chi tiết.' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p class="text-gray-500 text-xs uppercase font-semibold">Tổng công việc</p>
                <p class="text-2xl font-bold text-gray-800 mt-1">{{ projectStats.total }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p class="text-green-600 text-xs uppercase font-semibold">Đã hoàn thành</p>
                <p class="text-2xl font-bold text-green-700 mt-1">{{ projectStats.completed }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p class="text-blue-600 text-xs uppercase font-semibold">Đang thực hiện</p>
                <p class="text-2xl font-bold text-blue-700 mt-1">{{ projectStats.inProgress }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p class="text-gray-500 text-xs uppercase font-semibold">Cần làm</p>
                <p class="text-2xl font-bold text-gray-600 mt-1">{{ projectStats.pending }}</p>
            </div>
        </div>

        <div class="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 class="text-lg font-bold text-gray-800 flex items-center">
                    <ChartBarIcon class="w-5 h-5 mr-2 text-indigo-600"/> Danh sách công việc
                </h2>
                <span class="text-sm text-gray-500">{{ projectStats.total }} công việc</span>
            </div>

            <div v-if="project.cong_viec && project.cong_viec.length > 0">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Công việc</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thực hiện</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn chót</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="task in pagedTasks" :key="task.id" class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 font-medium text-gray-900">{{ task.tieu_de }}</td>
                                <td class="px-6 py-4">
                                    <span :class="getStatusClass(task.trang_thai)">{{ getStatusDisplay(task.trang_thai).label }}</span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500 flex items-center">
                                    <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                                        {{ task.nguoi_thuc_hien?.ho_ten?.charAt(0) || '?' }}
                                    </div>
                                    {{ task.nguoi_thuc_hien?.ho_ten || 'Chưa gán' }}
                                </td>
                                <td class="px-6 py-4 text-sm" :class="{'text-red-600 font-bold': isTaskOverdue(task.han_chot, task.trang_thai)}">
                                    <div class="flex items-center">
                                        <ClockIcon v-if="isTaskOverdue(task.han_chot, task.trang_thai)" class="w-4 h-4 mr-1"/>
                                        {{ formatDateTime(task.han_chot) }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button @click="viewTaskDetail(task.id)" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full hover:bg-indigo-100 transition">
                                        <EyeIcon class="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                    <p class="text-sm text-gray-600">
                        Trang {{ currentTaskPage }} / {{ Math.ceil(project.cong_viec.length / tasksPerPage) }}
                    </p>
                    <div class="flex space-x-2">
                        <button @click="handleTaskPageChange(currentTaskPage - 1)" 
                                :disabled="currentTaskPage === 1" 
                                class="btn-secondary">
                            ← Trang trước
                        </button>
                        <button @click="handleTaskPageChange(currentTaskPage + 1)" 
                                :disabled="pagedTasks.length < tasksPerPage" 
                                class="btn-secondary">
                            Trang sau →
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="p-10 text-center">
                <div class="inline-block p-4 rounded-full bg-gray-100 mb-3">
                    <BriefcaseIcon class="w-8 h-8 text-gray-400"/>
                </div>
                <p class="text-gray-500 italic">Dự án này chưa có công việc nào.</p>
            </div>
        </div>

      </div>

      <div v-else-if="!isLoading" class="text-center py-12">
        <p class="text-xl font-medium text-gray-500">Không tìm thấy thông tin dự án.</p>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.btn-secondary {
  @apply bg-white border border-gray-300 text-gray-700 font-medium py-1.5 px-4 rounded-lg text-sm hover:bg-gray-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm;
}
</style>