<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, watch } from 'vue';
import apiClient from '@/api/client';
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from 'vue-router';
import { PencilSquareIcon, CalendarIcon, BriefcaseIcon, UserIcon } from '@heroicons/vue/24/outline'; 
import { getTaskDetail, updateTaskContent } from '@/api/taskService';

const toast = useToast();
const route = useRoute();
const router = useRouter();

const taskId = ref(route.params.id as string);
const task = ref<any>(null);
const projects = ref<any[]>([]);
const users = ref<any[]>([]);

const form = ref({
    tieu_de: '',
    mo_ta: '',
    han_chot: undefined as string | undefined, 
    muc_do_uu_tien: 3,
    id_du_an: '',
    id_nguoi_thuc_hien: '' as string | null, 
});

const projectDateInfo = ref({ 
    ngay_bat_dau: 'N/A', 
    ngay_ket_thuc_du_kien: 'N/A' 
});

const formatVN = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

const isSubmitting = ref(false);
const isLoading = ref(true);
const error = ref('');
const successMessage = ref('');

const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

const fetchData = async (id: string) => {
    isLoading.value = true;
    error.value = '';
    try {
        const [taskRes, projectsRes, usersRes] = await Promise.all([
            getTaskDetail(id),
            apiClient.get('/du-an'), 
            apiClient.get('/nguoi-dung') 
        ]);
        
        task.value = taskRes;

        projects.value = projectsRes.data.filter((p: any) => p.trang_thai !== 'hoan_thanh' && p.trang_thai !== 'huy');
        users.value = usersRes.data.filter((u: any) => u.trang_thai_hoat_dong && u.vai_tro == 'nhan_vien'); 

        const hanChotValue = task.value.han_chot 
                             ? new Date(task.value.han_chot).toISOString().split('T')[0] 
                             : undefined;

        const moTaValue = task.value.mo_ta || ''; 

        form.value = {
            tieu_de: task.value.tieu_de,
            mo_ta: moTaValue, 
            han_chot: hanChotValue, 
            muc_do_uu_tien: task.value.muc_do_uu_tien,
            id_du_an: task.value.du_an?.id || '',
            id_nguoi_thuc_hien: task.value.nguoi_thuc_hien?.id || null, 
        };

    } catch (err: any) {
        error.value = 'Không thể tải dữ liệu chi tiết công việc.';
        toast.error(error.value);
        router.push({ name: 'tasks-list' });
    } finally {
        isLoading.value = false;
    }
};

const updateProjectDateInfo = (projectId: string) => {
    const selectedProject = projects.value.find(p => p.id === projectId);
    if (selectedProject) {
        projectDateInfo.value.ngay_bat_dau = selectedProject.ngay_bat_dau;
        projectDateInfo.value.ngay_ket_thuc_du_kien = selectedProject.ngay_ket_thuc_du_kien;
    } else {
        projectDateInfo.value.ngay_bat_dau = 'N/A';
        projectDateInfo.value.ngay_ket_thuc_du_kien = 'N/A';
    }
};

const handleSubmit = async () => {
    error.value = '';
    isSubmitting.value = true;
    successMessage.value = '';

    if (!form.value.tieu_de || !form.value.id_du_an || !form.value.id_nguoi_thuc_hien) {
        toast.error('Vui lòng điền đầy đủ thông tin.');
        isSubmitting.value = false;
        return;
    }

    try {
        const payload = {
            ...form.value,
            muc_do_uu_tien: Number(form.value.muc_do_uu_tien) 
        };

        await updateTaskContent(taskId.value, payload);
        
        toast.success(`Công việc "${form.value.tieu_de}" đã được cập nhật thành công.`);
        router.push({ name: 'admin-tasks-list' }); 

    } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Cập nhật thất bại. Kiểm tra dữ liệu nhập.';
        toast.error(errorMessage);
        error.value = errorMessage; 
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => fetchData(taskId.value));
watch(() => form.value.id_du_an, (newProjectId) => {
    if (newProjectId) {
        updateProjectDateInfo(newProjectId);
    }
});
</script>

<template>
    <MainLayout>
        <div class="space-y-8 max-w-4xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center">
                <PencilSquareIcon class="w-8 h-8 mr-2 text-indigo-600" /> Sửa Công việc: {{ task?.tieu_de || 'Đang tải...' }}
            </h1>
            
            <p v-if="error" class="alert-error">{{ error }}</p>
            <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>

            <p v-if="isLoading" class="text-center py-10">Đang tải dữ liệu Task...</p>

            <div v-else-if="task && task.id" class="bg-white p-8 rounded-xl shadow-xl">
                <form @submit.prevent="handleSubmit" :class="{'opacity-50': isSubmitting}">

                    <div class="grid grid-cols-2 gap-4 mb-6 border-b pb-4">
                         <div>
                            <label class="label flex items-center"><CalendarIcon class="w-4 h-4 mr-1"/> Ngày Bắt đầu Dự án</label>
                            <p class="text-lg font-semibold text-gray-800">
                                {{ formatVN(projectDateInfo.ngay_bat_dau) }}
                            </p>
                        </div>
                         <div>
                            <label class="label flex items-center"><CalendarIcon class="w-4 h-4 mr-1"/> Ngày Kết thúc</label>
                            <p class="text-lg font-semibold text-gray-800">
                                {{ formatVN(projectDateInfo.ngay_ket_thuc_du_kien) }}
                            </p>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="label">Tên công việc</label>
                        <input type="text" v-model="form.tieu_de" required class="form-input">
                    </div>

                    <div class="mb-6">
                        <label class="label">Mô tả công việc</label>
                        <textarea v-model="form.mo_ta" rows="4" class="form-input"></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6 border-t pt-4">
                        <div>
                            <label class="label flex items-center"><BriefcaseIcon class="w-4 h-4 mr-1"/> Chọn Dự án</label>
                            <select v-model="form.id_du_an" required class="form-select">
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.ten_du_an }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="label flex items-center"><UserIcon class="w-4 h-4 mr-1"/> Giao việc cho</label>
                            <select v-model="form.id_nguoi_thuc_hien" required class="form-select">
                                <option v-for="user in users" :key="user.id" :value="user.id">
                                    {{ user.ho_ten }} ({{ user.email }})
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="label flex items-center"><CalendarIcon class="w-4 h-4 mr-1"/> Hạn chót</label>
                            <input type="date" v-model="form.han_chot" class="form-input" required :min="getTodayDate()">
                        </div>
                        <div>
                            <label class="label">Mức độ Ưu tiên (1-5)</label>
                            <input type="number" v-model="form.muc_do_uu_tien" min="1" max="5" class="form-input">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <router-link :to="{name: 'admin-tasks-list'}" class="btn-secondary">Hủy & Quay lại</router-link>
                        <button type="submit" 
                                :disabled="isSubmitting"
                                class="btn-primary bg-indigo-600 hover:bg-indigo-700">
                            {{ isSubmitting ? 'Đang lưu...' : 'Lưu Thay đổi' }}
                        </button>
                    </div>
                </form>
            </div>
            <p v-else class="text-center py-10 text-gray-500">Không tìm thấy công việc này.</p>
        </div>
    </MainLayout>
</template>

<style scoped>
.form-input, .form-select {
    @apply mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150;
}
.label {
    @apply block text-sm font-medium text-gray-700 mb-1;
}
.btn-primary {
    @apply font-bold py-2 px-4 rounded shadow-lg text-sm text-white;
}
.btn-secondary {
    @apply bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm;
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}
</style>