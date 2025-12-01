<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, watch } from 'vue';
import apiClient from '@/api/client';
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from 'vue-router';
import { 
    PencilSquareIcon, 
    CalendarIcon, 
    BriefcaseIcon, 
    UserIcon, 
    ArrowLeftIcon,
    Bars3BottomLeftIcon,
    CheckCircleIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'; 
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
    if (!dateString || dateString === 'N/A') return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

const isSubmitting = ref(false);
const isLoading = ref(true);

const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

const fetchData = async (id: string) => {
    isLoading.value = true;
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

        if (form.value.id_du_an) {
            updateProjectDateInfo(form.value.id_du_an);
        }

    } catch (err: any) {
        toast.error('Không thể tải dữ liệu chi tiết công việc.');
        router.push({ name: 'admin-tasks-list' });
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
    isSubmitting.value = true;

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
        
        // CHỈ THÔNG BÁO BẰNG TOAST
        toast.success(`Công việc "${form.value.tieu_de}" đã được cập nhật thành công.`);
        
        if(task.value) task.value.tieu_de = form.value.tieu_de;

    } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Cập nhật thất bại. Kiểm tra dữ liệu nhập.';
        toast.error(errorMessage);
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
        <div class="max-w-4xl mx-auto space-y-6">
            
            <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Quay lại
            </button>

            <div v-if="isLoading" class="p-12 text-center text-gray-500 bg-white rounded-xl shadow">
                <svg class="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Đang tải dữ liệu công việc...
            </div>

            <div v-else-if="task && task.id" class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div class="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
                    <div class="flex items-center">
                        <div class="bg-white/20 p-3 rounded-full mr-4 backdrop-blur-sm">
                            <PencilSquareIcon class="w-8 h-8 text-white"/>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">Chỉnh Sửa Công Việc</h1>
                            <p class="text-blue-100 text-sm mt-1 truncate max-w-lg">{{ task.tieu_de }}</p>
                        </div>
                    </div>
                </div>

                <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
                    
                    <div class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col md:flex-row gap-6 md:items-center">
                        <div class="flex items-center text-blue-800">
                            <InformationCircleIcon class="w-5 h-5 mr-2"/>
                            <span class="font-semibold text-sm uppercase">Thời gian Dự án:</span>
                        </div>
                        <div class="flex gap-6 text-sm text-gray-700">
                            <div class="flex items-center">
                                <span class="text-gray-500 mr-2">Bắt đầu:</span>
                                <span class="font-medium">{{ formatVN(projectDateInfo.ngay_bat_dau) }}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-500 mr-2">Kết thúc:</span>
                                <span class="font-medium">{{ formatVN(projectDateInfo.ngay_ket_thuc_du_kien) }}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="label">Tên công việc</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <PencilSquareIcon class="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" v-model="form.tieu_de" required
                                class="form-input pl-10" placeholder="Nhập tên công việc">
                        </div>
                    </div>

                    <div>
                        <label class="label">Mô tả công việc</label>
                        <div class="relative">
                            <div class="absolute top-3 left-3 pointer-events-none">
                                <Bars3BottomLeftIcon class="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea v-model="form.mo_ta" rows="4" 
                                class="form-input pl-10 pt-3 resize-none" placeholder="Mô tả chi tiết..."></textarea>
                        </div>
                    </div>

                    <div class="border-t border-gray-100 my-6"></div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="label flex items-center"><BriefcaseIcon class="w-4 h-4 mr-1"/> Dự án</label>
                            <div class="relative">
                                <select v-model="form.id_du_an" required class="form-input appearance-none bg-white">
                                    <option v-for="project in projects" :key="project.id" :value="project.id">
                                        {{ project.ten_du_an }}
                                    </option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="label flex items-center"><UserIcon class="w-4 h-4 mr-1"/> Người thực hiện</label>
                            <div class="relative">
                                <select v-model="form.id_nguoi_thuc_hien" required class="form-input appearance-none bg-white">
                                    <option :value="null" disabled>-- Chọn nhân viên --</option>
                                    <option v-for="user in users" :key="user.id" :value="user.id">
                                        {{ user.ho_ten }} ({{ user.email }})
                                    </option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="label flex items-center"><CalendarIcon class="w-4 h-4 mr-1"/> Hạn chót</label>
                            <input type="date" v-model="form.han_chot" class="form-input" required :min="getTodayDate()">
                        </div>
                        <div>
                            <label class="label">Mức độ Ưu tiên</label>
                            <div class="flex items-center space-x-4 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" v-model="form.muc_do_uu_tien" :value="1" class="text-green-600 focus:ring-green-500 w-4 h-4" />
                                    <span class="ml-2 text-sm text-gray-700">Thấp</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" v-model="form.muc_do_uu_tien" :value="3" class="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                    <span class="ml-2 text-sm text-gray-700 font-medium">Trung bình</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" v-model="form.muc_do_uu_tien" :value="5" class="text-red-600 focus:ring-red-500 w-4 h-4" />
                                    <span class="ml-2 text-sm text-red-600 font-bold">Cao</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end items-center pt-6 border-t border-gray-100 space-x-4">
                        <button type="button" @click="router.back()" class="btn-secondary">
                            Hủy bỏ
                        </button>
                        <button type="submit" :disabled="isSubmitting" 
                            class="btn-primary flex items-center">
                            <span v-if="!isSubmitting" class="flex items-center">
                                <CheckCircleIcon class="w-5 h-5 mr-2" /> Lưu Thay Đổi
                            </span>
                            <span v-else class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Đang lưu...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
            
            <p v-else class="text-center py-10 text-gray-500">Không tìm thấy dữ liệu công việc.</p>
        </div>
    </MainLayout>
</template>

<style scoped>
.form-input {
    @apply mt-1 block w-full py-2.5 pr-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-sm;
}
.label {
    @apply block text-sm font-semibold text-gray-700 mb-1;
}
.btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md text-sm transition duration-150 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}
.btn-secondary {
    @apply bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-gray-50 transition duration-150;
}
</style>