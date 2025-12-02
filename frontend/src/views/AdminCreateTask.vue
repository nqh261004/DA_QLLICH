<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; 
import { 
    PlusCircleIcon, 
    CalendarIcon, 
    BriefcaseIcon, 
    UserIcon, 
    PencilSquareIcon,
    ArrowLeftIcon,
    Bars3BottomLeftIcon,
    CheckCircleIcon,
    FlagIcon 
} from '@heroicons/vue/24/outline';

const router = useRouter();
const toast = useToast();

const projects = ref<any[]>([]);
const users = ref<any[]>([]);
const form = ref({
    tieu_de: '',
    mo_ta: '',
    han_chot: '',
    muc_do_uu_tien: 3,
    id_du_an: '',
    id_nguoi_thuc_hien: ''
});

const isSubmitting = ref(false); 
const isLoading = ref(true);

const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

const fetchData = async () => {
    try {
        const [projectsRes, usersRes] = await Promise.all([
            apiClient.get('/du-an'), 
            apiClient.get('/nguoi-dung') 
        ]);
        console.log('=== TẤT CẢ USERS ===');
        console.table(usersRes.data);

        const allNhanVien = usersRes.data.filter((u: any) => u.vai_tro === 'nhan_vien');
        console.log('=== NHÂN VIÊN (vai_tro=nhan_vien) ===');
        console.table(allNhanVien);

        const activeNhanVien = allNhanVien.filter((u: any) => u.trang_thai_hoat_dong);
        console.log('=== NHÂN VIÊN HOẠT ĐỘNG ===');
        console.table(activeNhanVien);

        projects.value = projectsRes.data.filter((p: any) => p.trang_thai !== 'hoan_thanh' && p.trang_thai !== 'huy');
        users.value = usersRes.data.filter((u: any) => u.vai_tro === 'nhan_vien' && u.trang_thai_hoat_dong);

        if (projects.value.length > 0) form.value.id_du_an = projects.value[0].id;
        if (users.value.length > 0) form.value.id_nguoi_thuc_hien = users.value[0].id;

    } catch (err: any) {
        toast.error('Lỗi tải dữ liệu. Hãy đảm bảo bạn đã tạo Dự án và Người dùng.');
    } finally {
        isLoading.value = false;
    }
};

const handleSubmit = async () => {
    isSubmitting.value = true;

    if (!form.value.tieu_de || !form.value.id_du_an || !form.value.id_nguoi_thuc_hien) {
        toast.error('Vui lòng điền đủ thông tin bắt buộc (*).');
        isSubmitting.value = false;
        return;
    }

    try {
        const payload = {
            ...form.value,
            muc_do_uu_tien: Number(form.value.muc_do_uu_tien) 
        };

        await apiClient.post('/cong-viec', payload);
        
        toast.success(`Đã giao việc "${form.value.tieu_de}" thành công!`);
        router.push({ name: 'admin-tasks-list' }); 

    } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Giao việc thất bại.';
        toast.error(errorMessage);
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(fetchData);
</script>

<template>
    <MainLayout>
        <div class="max-w-4xl mx-auto space-y-6">
            <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Quay lại
            </button>

            <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                    <div class="flex items-center">
                        <div class="bg-white/20 p-3 rounded-full mr-4 backdrop-blur-sm">
                            <PlusCircleIcon class="w-8 h-8 text-white"/>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">Giao Công Việc Mới</h1>
                            <p class="text-indigo-100 text-sm mt-1">Tạo task và phân công cho nhân viên.</p>
                        </div>
                    </div>
                </div>

                <div v-if="isLoading" class="p-12 text-center text-gray-500">
                    <svg class="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Đang tải dữ liệu dự án & nhân viên...
                </div>

                <form v-else @submit.prevent="handleSubmit" class="p-8 space-y-6">
                    
                    <div>
                        <label class="label">Tên công việc <span class="text-red-500">*</span></label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <PencilSquareIcon class="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" v-model="form.tieu_de" required
                                placeholder="Ví dụ: Thiết kế Database" 
                                class="form-input pl-10" />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="label">Thuộc Dự án <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <BriefcaseIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <select v-model="form.id_du_an" required class="form-input pl-10 appearance-none bg-white">
                                    <option value="" disabled>-- Chọn dự án --</option>
                                    <option v-for="project in projects" :key="project.id" :value="project.id">
                                        {{ project.ten_du_an }}
                                    </option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <p v-if="projects.length === 0" class="text-xs text-red-500 mt-1">Chưa có dự án nào đang chạy.</p>
                        </div>

                        <div>
                            <label class="label">Người thực hiện <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <select v-model="form.id_nguoi_thuc_hien" required class="form-input pl-10 appearance-none bg-white">
                                    <option value="" disabled>-- Chọn nhân viên --</option>
                                    
                                    <option value="ALL" class="font-bold text-indigo-600">
                                        -- Giao cho Tất cả Nhân viên --
                                    </option>
                                    
                                    <option v-for="user in users" :key="user.id" :value="user.id">
                                        {{ user.ho_ten }} ({{ user.email }})
                                    </option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <p v-if="users.length === 0" class="text-xs text-red-500 mt-1">Chưa có nhân viên nào.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="label">Hạn chót <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="date" v-model="form.han_chot" required
                                    :min="getTodayDate()"
                                    class="form-input pl-10" />
                            </div>
                        </div>

                        <div>
                            <label class="label flex items-center">
                                <FlagIcon class="w-4 h-4 mr-1"/> Mức độ ưu tiên
                            </label>
                            <div class="flex items-center space-x-6 mt-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" v-model="form.muc_do_uu_tien" :value="1" class="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300" />
                                    <span class="ml-2 text-sm text-gray-700">Thấp</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" v-model="form.muc_do_uu_tien" :value="3" class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                    <span class="ml-2 text-sm text-gray-700 font-medium">Trung bình</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="radio" v-model="form.muc_do_uu_tien" :value="5" class="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300" />
                                    <span class="ml-2 text-sm text-red-600 font-bold">Cao</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="label">Mô tả chi tiết</label>
                        <div class="relative">
                            <div class="absolute top-3 left-3 pointer-events-none">
                                <Bars3BottomLeftIcon class="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea v-model="form.mo_ta" rows="4" 
                                placeholder="Mô tả nội dung công việc, yêu cầu cụ thể..." 
                                class="form-input pl-10 pt-3 resize-none"></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end items-center pt-6 border-t border-gray-100 space-x-4">
                        <button type="button" @click="router.back()" class="btn-secondary">
                            Hủy bỏ
                        </button>
                        <button type="submit" :disabled="isSubmitting" 
                            class="btn-primary flex items-center">
                            <span v-if="!isSubmitting" class="flex items-center">
                                <CheckCircleIcon class="w-5 h-5 mr-2" /> Giao việc ngay
                            </span>
                            <span v-else class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Đang xử lý...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
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