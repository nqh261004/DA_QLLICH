<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTaskDetail, updateTaskStatus, submitTaskWork } from '@/api/taskService';
import { useAuthStore } from '@/stores/auth';
import { useToast } from "vue-toastification";
import { 
    ClockIcon, 
    UserIcon, 
    BriefcaseIcon, 
    CheckCircleIcon,
    ArrowLeftIcon,
    PaperClipIcon, 
    ArrowUpTrayIcon,
    FlagIcon
} from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const task = ref<any>(null);
const isLoading = ref(true);
const isUpdating = ref(false);
const error = ref('');

const selectedFiles = ref<File[]>([]);

const taskId = route.params.id as string;

const isManager = computed(() => authStore.isManager);

const isAssignee = computed(() => authStore.userId === task.value?.nguoiThucHienId);

const canSubmit = computed(() => {
    return isAssignee.value && (task.value?.trang_thai === 'dang_lam' || task.value?.trang_thai === 'can_sua');
});

const canApprove = computed(() => {
    return isManager.value && task.value?.trang_thai === 'cho_duyet';
});

const handleFileChange = (event: any) => {
    const files = Array.from(event.target.files) as File[];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const validFiles: File[] = [];

    for (const file of files) {
        if (file.size > MAX_SIZE) {
            toast.error(`File "${file.name}" quá lớn! (Tối đa 5MB)`);
        } else {
            validFiles.push(file);
        }
    }

    selectedFiles.value = validFiles;

    if (validFiles.length < files.length) {
        event.target.value = ''; 
    }
};

const handleSubmitWork = async () => {
    try {
        isUpdating.value = true;
        const formData = new FormData();
        
        selectedFiles.value.forEach((file) => {
            formData.append('files', file);
        });

        await submitTaskWork(taskId, formData);
        
        toast.success('Đã nộp bài và gửi file thành công!');
        selectedFiles.value = []; 
        await fetchTaskDetail(); 
    } catch (err: any) {
        toast.error('Lỗi khi nộp bài: ' + (err.response?.data?.message || 'Lỗi server'));
    } finally {
        isUpdating.value = false;
    }
};

const handleApprove = async (status: 'phe_duyet' | 'can_sua') => {
    try {
        isUpdating.value = true;
        await updateTaskStatus(taskId, status);
        toast.success(status === 'phe_duyet' ? 'Đã phê duyệt công việc!' : 'Đã yêu cầu sửa lại!');
        await fetchTaskDetail();
    } catch (err: any) {
        toast.error('Có lỗi xảy ra.');
    } finally {
        isUpdating.value = false;
    }
};

const handleStartWork = async () => {
    try {
        isUpdating.value = true;
        await updateTaskStatus(taskId, 'dang_lam');
        toast.success('Đã bắt đầu làm việc!');
        await fetchTaskDetail();
    } catch (err) {
        toast.error('Lỗi cập nhật trạng thái');
    } finally {
        isUpdating.value = false;
    }
}

const getPriorityDisplay = (level: number) => {
    switch (level) {
        case 5: return { label: 'Cao', class: 'bg-red-100 text-red-800' };
        case 3: return { label: 'Trung bình', class: 'bg-blue-100 text-blue-800' };
        default: return { label: 'Thấp', class: 'bg-green-100 text-green-800' };
    }
};

const fetchTaskDetail = async () => {
    isLoading.value = true;
    try {
        const data = await getTaskDetail(taskId);
        task.value = data;
    } catch (err) {
        error.value = 'Không tìm thấy công việc hoặc có lỗi xảy ra.';
    } finally {
        isLoading.value = false;
    }
};


const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

const getFileUrl = (fileName: string) => {
    return `http://localhost:3000/uploads/${fileName}`; 
};

onMounted(fetchTaskDetail);
</script>

<template>
    <MainLayout>
        <div class="max-w-4xl mx-auto">
            <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Quay lại
            </button>

            <div v-if="isLoading" class="text-center py-10">Đang tải chi tiết...</div>
            <div v-else-if="error" class="alert-error text-center">{{ error }}</div>

            <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white">
                    <h1 class="text-2xl font-bold mb-2">{{ task.tieu_de }}</h1>
                    <div class="flex flex-wrap gap-4 text-sm opacity-90">
                        <span class="flex items-center"><BriefcaseIcon class="w-4 h-4 mr-1"/> Dự án: {{ task.du_an?.ten_du_an }}</span>
                        <span class="flex items-center"><UserIcon class="w-4 h-4 mr-1"/> Người làm: {{ task.nguoi_thuc_hien?.ho_ten }}</span>
                        <span class="flex items-center"><ClockIcon class="w-4 h-4 mr-1"/> Hạn: {{ formatDate(task.han_chot) }}</span>
                        <span class="flex items-center px-3 py-1 rounded-full backdrop-blur-sm text-gray-800 font-semibold"
                              :class="getPriorityDisplay(task.muc_do_uu_tien).class">
                            <FlagIcon class="w-4 h-4 mr-1.5"/> 
                            Ưu tiên: {{ getPriorityDisplay(task.muc_do_uu_tien).label }}
                        </span>
                    </div>
                </div>

                <div class="p-6 space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">Mô tả công việc</h3>
                        <p class="text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded-lg border">
                            {{ task.mo_ta || 'Không có mô tả chi tiết.' }}
                        </p>
                    </div>

                    <div v-if="task.files && task.files.length > 0">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <PaperClipIcon class="w-5 h-5 mr-2"/> Tài liệu đính kèm
                        </h3>
                        <ul class="space-y-2">
                            <li v-for="file in task.files" :key="file.id" class="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition">
                                <div class="flex items-center overflow-hidden">
                                    <span class="text-indigo-700 font-medium truncate mr-2">{{ file.ten_file_goc }}</span>
                                    <span class="text-xs text-gray-500">({{ (file.kich_thuoc / 1024).toFixed(1) }} KB)</span>
                                </div>
                                <a :href="getFileUrl(file.ten_file_luu)" target="_blank" class="text-sm text-blue-600 hover:underline font-semibold whitespace-nowrap">
                                    Tải xuống
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div class="border-t pt-6">

                        <div v-if="canSubmit" class="bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <label class="block mb-2 text-sm font-medium text-gray-900">Nộp kết quả công việc:</label>
                            <div class="flex flex-col sm:flex-row gap-3">
                                <input type="file" multiple @change="handleFileChange" 
                                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border rounded-lg cursor-pointer bg-white" 
                                />
                                <button @click="handleSubmitWork" :disabled="isUpdating" 
                                    class="btn-primary bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap flex items-center justify-center">
                                    <ArrowUpTrayIcon class="w-5 h-5 mr-2" />
                                    Gửi duyệt
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">* Bạn có thể chọn nhiều file cùng lúc.</p>
                        </div>

                        <div v-else-if="canApprove" class="flex gap-4">
                            <button @click="handleApprove('phe_duyet')" :disabled="isUpdating" class="btn-primary bg-green-600 hover:bg-green-700 flex-1">
                                <CheckCircleIcon class="w-5 h-5 mr-2 inline"/> Phê duyệt
                            </button>
                            <button @click="handleApprove('can_sua')" :disabled="isUpdating" class="btn-primary bg-orange-500 hover:bg-orange-600 flex-1">
                                Yêu cầu sửa lại
                            </button>
                        </div>

                        <div v-else-if="isAssignee && task.trang_thai === 'can_lam'">
                            <button @click="handleStartWork" :disabled="isUpdating" class="btn-primary bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                <ClockIcon class="w-5 h-5 mr-2 inline"/> Bắt đầu làm việc này
                            </button>
                        </div>

                        <div v-else-if="task.trang_thai === 'cho_duyet'" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-lg font-medium">
                             Công việc đang chờ quản lý phê duyệt.
                        </div>
                        <div v-else-if="task.trang_thai === 'phe_duyet'" class="text-center p-4 bg-green-50 text-green-700 rounded-lg font-medium">
                             Công việc đã hoàn thành xuất sắc!
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.btn-primary {
    @apply text-white font-bold py-2 px-6 rounded-lg shadow transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}
.alert-error {
    @apply text-red-600 bg-red-100 p-4 rounded-lg border border-red-300;
}
</style>