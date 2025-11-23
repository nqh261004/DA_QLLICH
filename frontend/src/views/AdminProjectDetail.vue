<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/api/client';
import { useToast } from 'vue-toastification';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/vue/24/outline';

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

const STATUS_MAP: { [key: string]: { label: string; class: string } } = {
  sap_bat_dau: { label: 'Sắp bắt đầu', class: 'bg-indigo-100 text-indigo-800' },
  dang_tien_hanh: { label: 'Đang tiến hành', class: 'bg-blue-100 text-blue-800' },
  hoan_thanh: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800' },
  huy: { label: 'Hủy', class: 'bg-red-100 text-red-800' },
  can_lam: { label: 'Cần làm', class: 'bg-gray-100 text-gray-500' },
  cho_duyet: { label: 'Chờ duyệt', class: 'bg-yellow-100 text-yellow-800' },
  phe_duyet: { label: 'Phê duyệt', class: 'bg-green-100 text-green-800' },
  bi_huy: { label: 'Bị hủy', class: 'bg-red-100 text-red-800' },
};

const getStatusDisplay = (status: string) => STATUS_MAP[status.toLowerCase()] || { label: status, class: 'bg-gray-100 text-gray-800' };
const getStatusClass = (status: string) => `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusDisplay(status).class}`;
const formatDateTime = (dateString: string | null) => !dateString ? 'Chưa có' : new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
const isOverdue = (dateString: string | null, status: string) => !dateString || ['hoan_thanh','huy'].includes(status) ? false : new Date() > new Date(dateString);
const isTaskOverdue = (dateString: string | null, status: string) => !dateString || ['phe_duyet','bi_huy'].includes(status) ? false : new Date() > new Date(dateString);

const viewTaskDetail = (id: string) => {
    router.push({ 
        name: 'task-detail', 
        params: { id } ,
        query: { fromAdmin: 'true' } 
    });
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
    console.error(err);
    toast.error('Không thể tải chi tiết dự án.');
    project.value = null;
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
    <div class="container mx-auto p-4">
      <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4">
        <ArrowLeftIcon class="w-5 h-5 mr-2" />
        Quay lại
      </button>

      <div v-if="isLoading" class="text-center py-10">
        <p class="text-lg">Đang tải chi tiết dự án...</p>
      </div>

      <div v-else-if="project" class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h1 class="text-3xl font-bold leading-tight text-gray-900 mb-4">{{ project.ten_du_an }}</h1>

        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Trạng thái</dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                <span :class="getStatusClass(project.trang_thai)">
                  {{ getStatusDisplay(project.trang_thai).label }}
                </span>
              </dd>
            </div>

            <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Người quản lý</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {{ project.nguoi_quan_ly?.ho_ten || 'Không rõ' }}
              </dd>
            </div>

            <div class="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Mô tả</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">
                {{ project.mo_ta || 'Không có mô tả.' }}
              </dd>
            </div>

            <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Ngày bắt đầu</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {{ formatDateTime(project.ngay_bat_dau) }}
              </dd>
            </div>

            <div :class="{'bg-gray-50': true, 'text-red-600 font-semibold': isOverdue(project.ngay_ket_thuc_du_kien, project.trang_thai)}" 
                 class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Kết thúc</dt>
              <dd class="mt-1 text-sm sm:col-span-2 sm:mt-0">
                {{ formatDateTime(project.ngay_ket_thuc_du_kien) }}
              </dd>
            </div>
          </dl>
        </div>

        <h2 class="text-2xl font-semibold text-gray-900 mt-10 mb-4 border-t pt-4">Danh sách Công việc</h2>

        <div v-if="project.cong_viec && project.cong_viec.length > 0" class="mt-4">
          <div class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Tên Công việc</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Người thực hiện</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hạn chót</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hành động</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="task in pagedTasks" :key="task.id">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{{ task.tieu_de }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <span :class="getStatusClass(task.trang_thai)">
                      {{ getStatusDisplay(task.trang_thai).label }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ task.nguoi_thuc_hien?.ho_ten || 'Chưa gán' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm" 
                      :class="{'text-red-600 font-medium': isTaskOverdue(task.han_chot, task.trang_thai)}">
                    {{ formatDateTime(task.han_chot) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-right">
                    <button @click="viewTaskDetail(task.id)" 
                            class="action-icon-btn text-blue-600 hover:text-blue-800" 
                            title="Xem chi tiết">
                      <EyeIcon class="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-between items-center mt-4">
            <p class="text-sm text-gray-600">
              Hiển thị {{ pagedTasks.length }} Task (Trang {{ currentTaskPage }})
            </p>
            <div class="flex space-x-3">
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

        <p v-else class="text-gray-500 italic mt-4">Dự án này chưa có công việc nào được giao.</p>

      </div>

      <div v-else-if="!isLoading" class="text-center py-10 text-red-600">
        <p class="text-xl font-medium">Không tìm thấy Dự án này.</p>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.sm\:grid-cols-3 > dt {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.action-icon-btn {
  @apply transition duration-150 p-1 rounded hover:bg-gray-200;
}
.btn-secondary {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm;
}
</style>
