<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTaskDetail, updateTaskStatus } from '@/api/taskService';
import { useAuthStore } from '@/stores/auth';
import { CheckCircleIcon, WrenchScrewdriverIcon, AcademicCapIcon, ArchiveBoxXMarkIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const task = ref<any>(null);
const isLoading = ref(true);
const isUpdating = ref(false); 

interface ActionVisibility {
    canStart: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canReject: boolean;
    isFinal: boolean;
}

const fetchTask = async () => {
    isLoading.value = true;
    try {
        const id = route.params.id as string;
        const data = await getTaskDetail(id);
        task.value = data;
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Không thể tải chi tiết công việc.');
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

const getStatusDisplay = (statusKey: string) => {
    const statuses: { [key: string]: any } = {
        can_lam: { label: 'Cần làm', color: 'text-gray-500', bg: 'bg-gray-100', icon: WrenchScrewdriverIcon },
        dang_lam: { label: 'Đang làm', color: 'text-blue-500', bg: 'bg-blue-100', icon: WrenchScrewdriverIcon },
        cho_duyet: { label: 'Chờ duyệt', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AcademicCapIcon },
        phe_duyet: { label: 'Phê duyệt', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircleIcon },
        can_sua: { label: 'Cần sửa', color: 'text-orange-500', bg: 'bg-orange-100', icon: ArchiveBoxXMarkIcon },
        bi_huy: { label: 'Bị hủy', color: 'text-red-600', bg: 'bg-red-100', icon: ArchiveBoxXMarkIcon },
    };
    return statuses[statusKey] || statuses['can_lam'];
};

const isActionVisible = computed<ActionVisibility>(() => {
    if (!task.value) return { canStart: false, canSubmit: false, canApprove: false, canReject: false, isFinal: false };

    const status = task.value.trang_thai;
    const isExecutor = authStore.userId === task.value.nguoiThucHienId;
    const isManager = authStore.isManager;

    return {
        canStart: isExecutor && (status === 'can_lam' || status === 'can_sua'),
        canSubmit: isExecutor && status === 'dang_lam',
        canApprove: isManager && status === 'cho_duyet',
        canReject: isManager && status === 'cho_duyet',
        isFinal: status === 'phe_duyet' || status === 'bi_huy',
    };
});

const handleStatusUpdate = async (newStatus: string) => {
    if (!task.value) return;
    try {
        isUpdating.value = true;

        const id = route.params.id as string;
        await updateTaskStatus(id, newStatus);

        await fetchTask(); 

        toast.success(`Đã chuyển trạng thái thành công sang ${getStatusDisplay(newStatus).label}`);

        if (route.query.fromAdmin === 'true') {
            router.push({ name: 'admin-tasks-list' });
        }
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
    } finally {
        isUpdating.value = false;
    }
};

const handleGoBack = () => {
    if (route.query.fromAdmin === 'true') {
        router.push({ name: 'admin-tasks-list' });
    } else {
        router.push({ name: 'tasks-list' });
    }
}

onMounted(fetchTask);
</script>

<template>
<MainLayout>
    <div v-if="isLoading || !task" class="text-center py-10">Đang tải chi tiết công việc...</div>

    
    <div v-else class="space-y-6">

        <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4">
        <ArrowLeftIcon class="w-5 h-5 mr-2" />
        Quay lại 
      </button>

        <h1 class="text-3xl font-bold text-gray-800 border-b pb-3 mb-4">
            {{ task.tieu_de }}
        </h1>

        <div class="bg-white p-6 rounded-lg shadow-xl border-l-4 border-indigo-500">
            <h3 class="text-xl font-semibold text-indigo-600 mb-4">Hành động</h3>
            <p v-if="isActionVisible.isFinal" class="text-lg text-gray-500"></p>

            <div v-else class="flex flex-wrap gap-4">
                <button v-if="isActionVisible.canStart"
                    @click="handleStatusUpdate('dang_lam')"
                    :disabled="isUpdating"
                    class="action-button bg-blue-600 hover:bg-blue-700">
                    <WrenchScrewdriverIcon class="w-5 h-5 mr-2" /> Bắt đầu làm / Làm lại
                </button>
                
                <button v-if="isActionVisible.canSubmit"
                    @click="handleStatusUpdate('cho_duyet')"
                    :disabled="isUpdating"
                    class="action-button bg-yellow-600 hover:bg-yellow-700">
                    <AcademicCapIcon class="w-5 h-5 mr-2" /> Gửi duyệt
                </button>

                <button v-if="isActionVisible.canApprove"
                    @click="handleStatusUpdate('phe_duyet')"
                    :disabled="isUpdating"
                    class="action-button bg-green-600 hover:bg-green-700">
                    <CheckCircleIcon class="w-5 h-5 mr-2" /> Phê duyệt
                </button>
                
                <button v-if="isActionVisible.canReject"
                    @click="handleStatusUpdate('can_sua')"
                    :disabled="isUpdating"
                    class="action-button bg-red-600 hover:bg-red-700">
                    <ArchiveBoxXMarkIcon class="w-5 h-5 mr-2" /> Yêu cầu sửa lại
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="card-detail">
                <p class="text-sm font-medium text-gray-500">Trạng thái hiện tại</p>
                <span :class="getStatusDisplay(task.trang_thai).bg" class="mt-1 inline-flex items-center px-3 py-1 text-lg font-semibold rounded-full capitalize">
                    <component :is="getStatusDisplay(task.trang_thai).icon" class="w-5 h-5 mr-2" />
                    {{ getStatusDisplay(task.trang_thai).label }}
                </span>
            </div>

            <div class="card-detail">
                <p class="text-sm font-medium text-gray-500">Mức độ Ưu tiên</p>
                <p class="text-2xl font-bold text-orange-500 mt-1">
                    {{ task.muc_do_uu_tien || 'N/A' }}
                </p>
            </div>
            
            <div class="card-detail">
                <p class="text-sm font-medium text-gray-500">Hạn chót</p>
                <p class="text-xl font-bold text-gray-900 mt-1">
                    {{ new Date(task.han_chot).toLocaleDateString('vi-VN') }}
                </p>
                <p class="text-xs text-gray-500">
                    {{ new Date(task.han_chot).toLocaleTimeString('vi-VN') }}
                </p>
            </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow space-y-4">
            <h3 class="text-xl font-semibold text-gray-800 border-b pb-2">Mô tả Công việc</h3>
            <p class="text-gray-700 whitespace-pre-wrap">{{ task.mo_ta }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div v-if="authStore.isManager">
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold text-gray-800 border-b pb-2">Người thực hiện</h3>
                    <p class="text-gray-700 mt-2">Họ tên: <strong>{{ task.nguoi_thuc_hien?.ho_ten || 'N/A' }}</strong></p>
                    <p class="text-gray-700">Email: <strong>{{ task.nguoi_thuc_hien?.email || 'Chưa rõ email' }}</strong></p>
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold text-gray-800 border-b pb-2">Thông tin Dự án</h3>
                <p class="text-gray-700 mt-2">Dự án: <strong>{{ task.du_an?.ten_du_an || 'Không rõ' }}</strong></p>
                <p class="text-gray-700">Giao việc bởi: <strong>{{ task.nguoi_giao_viec?.ho_ten || 'Quản lý' }}</strong></p>
            </div>
        </div>
    </div>
</MainLayout>
</template>

<style scoped>
.action-button {
    @apply flex items-center px-4 py-2 text-white font-semibold rounded-lg shadow-md transition duration-150 transform hover:scale-105 text-sm;
}
.card-detail {
    @apply bg-white p-6 rounded-lg shadow-md;
}
</style>
