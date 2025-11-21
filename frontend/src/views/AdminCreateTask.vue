<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useRouter } from 'vue-router';
// IMPORT THƯ VIỆN TOAST
import { useToast } from "vue-toastification"; 
import { PlusCircleIcon, CalendarIcon, BriefcaseIcon, UserIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const toast = useToast(); // KHỞI TẠO TOAST

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

// Thêm lại biến này để ngăn chặn click đúp
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
        
        // Chỉ lấy dự án Đang hoạt động
        projects.value = projectsRes.data.filter((p: any) => p.trang_thai !== 'hoan_thanh' && p.trang_thai !== 'huy');
        // Chỉ lấy người dùng là Nhân viên đang Hoạt động
        users.value = usersRes.data.filter((u: any) => u.vai_tro === 'nhan_vien' && u.trang_thai_hoat_dong);

        if (projects.value.length > 0) {
            form.value.id_du_an = projects.value[0].id;
        }
        if (users.value.length > 0) {
            form.value.id_nguoi_thuc_hien = users.value[0].id;
        }

    } catch (err: any) {
        // SỬ DỤNG TOAST CHO LỖI TẢI DỮ LIỆU
        toast.error('Lỗi tải dữ liệu. Hãy đảm bảo bạn đã tạo Dự án và Người dùng.');
    } finally {
        isLoading.value = false;
    }
};

// 2. Xử lý logic Giao việc
const handleSubmit = async () => {
    isSubmitting.value = true;
    
    // VALIDATION
    if (!form.value.tieu_de || !form.value.id_du_an || !form.value.id_nguoi_thuc_hien) {
        toast.error('Vui lòng điền Tiêu đề và chọn Dự án/Người thực hiện.');
        isSubmitting.value = false;
        return;
    }

    try {
        const payload = {
            ...form.value,
            muc_do_uu_tien: Number(form.value.muc_do_uu_tien) 
        };

        await apiClient.post('/cong-viec', payload);
        
        // SỬ DỤNG TOAST THAY CHO successMessage
        toast.success(`Công việc "${form.value.tieu_de}" đã được giao thành công! Email thông báo đã được gửi.`);

        // CHUYỂN HƯỚNG SANG TRANG DANH SÁCH CÔNG VIỆC
        router.push({ name: 'admin-tasks-list' }); 

    } catch (err: any) {
        // SỬ DỤNG TOAST CHO LỖI API
        const errorMessage = err.response?.data?.message || 'Giao việc thất bại. Kiểm tra dữ liệu nhập.';
        toast.error(errorMessage);
        console.error(err);
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(fetchData);
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">Tạo & Giao việc Mới</h1>
            
            <p v-if="isLoading">Đang tải dữ liệu...</p>
            
            <div v-else class="max-w-3xl bg-white p-8 rounded-lg shadow-xl mx-auto">
                <h3 class="text-xl font-bold mb-6 border-b pb-2 flex items-center">
                    <PlusCircleIcon class="w-6 h-6 mr-3 text-indigo-600" /> Thông tin Công việc
                </h3>

                <form @submit.prevent="handleSubmit" :class="{'opacity-50': isSubmitting}">
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Tiêu đề Công việc</label>
                        <input type="text" v-model="form.tieu_de" required
                               placeholder="Ví dụ: Kiểm thử API thanh toán" 
                               class="form-input">
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Mô tả</label>
                        <textarea v-model="form.mo_ta" rows="4" 
                                  placeholder="Chi tiết yêu cầu công việc..." 
                                  class="form-input"></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                <BriefcaseIcon class="w-4 h-4 mr-1"/> Chọn Dự án
                            </label>
                            <select v-model="form.id_du_an" required class="form-select">
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.ten_du_an }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                <UserIcon class="w-4 h-4 mr-1"/> Giao việc cho
                            </label>
                            <select v-model="form.id_nguoi_thuc_hien" required class="form-select">
                                <option v-for="user in users" :key="user.id" :value="user.id">
                                    {{ user.ho_ten }} ({{ user.email }})
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                <CalendarIcon class="w-4 h-4 mr-1"/> Hạn chót
                            </label>
                            <input type="date" v-model="form.han_chot" class="form-input" required
                            :min="getTodayDate()">
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Mức độ Ưu tiên (1-5)</label>
                            <input type="number" v-model="form.muc_do_uu_tien" min="1" max="5" class="form-input">
                        </div>
                    </div>

                    <button type="submit" 
                            :disabled="isSubmitting"
                            class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 shadow-md">
                        {{ isSubmitting ? 'Đang giao việc...' : 'Giao Việc' }}
                    </button>
                </form>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.form-input, .form-select {
    @apply shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150;
}
</style>