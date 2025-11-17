<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useRouter } from 'vue-router';
import { PlusCircleIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
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
const error = ref('');
const successMessage = ref('');
const isLoading = ref(true);

const fetchData = async () => {
    try {
        const [projectsRes, usersRes] = await Promise.all([
            apiClient.get('/du-an'), // QL có quyền lấy tất cả dự án
            apiClient.get('/nguoi-dung') // QL có quyền lấy tất cả người dùng
        ]);
        
        projects.value = projectsRes.data;
        users.value = usersRes.data.filter((u: any) => u.vai_tro === 'nhan_vien' && u.trang_thai_hoat_dong);

        // Thiết lập giá trị mặc định cho dropdown
        if (projects.value.length > 0) {
            form.value.id_du_an = projects.value[0].id;
        }
        if (users.value.length > 0) {
            form.value.id_nguoi_thuc_hien = users.value[0].id;
        }

    } catch (err: any) {
        error.value = 'Lỗi tải dữ liệu. Hãy đảm bảo bạn đã tạo Dự án và Người dùng.';
    } finally {
        isLoading.value = false;
    }
};

// 2. Xử lý logic Giao việc
const handleSubmit = async () => {
    error.value = '';
    successMessage.value = '';
    
    if (!form.value.id_du_an || !form.value.id_nguoi_thuc_hien) {
        error.value = 'Vui lòng chọn Dự án và Người thực hiện.';
        return;
    }

    try {
        const payload = {
            ...form.value,
            // Đảm bảo muc_do_uu_tien là số (đã bị Vue ép thành string)
            muc_do_uu_tien: Number(form.value.muc_do_uu_tien) 
        };

        await apiClient.post('/cong-viec', payload);
        
        successMessage.value = 'Công việc đã được giao thành công! Email thông báo đã được gửi.';
        // Reset form sau khi thành công
        form.value.tieu_de = '';
        form.value.mo_ta = '';
        form.value.han_chot = '';
        form.value.muc_do_uu_tien = 3;

    } catch (err: any) {
        // Lỗi từ Backend (ví dụ: Hạn chót sớm hơn ngày tạo dự án)
        error.value = err.response?.data?.message || 'Giao việc thất bại. Kiểm tra dữ liệu nhập.';
        console.error(err);
    }
};

onMounted(fetchData);
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">Tạo & Giao việc Mới</h1>
            
            <p v-if="isLoading">Đang tải dữ liệu...</p>
            <p v-else-if="error" class="text-red-500 p-3 bg-red-100 rounded">{{ error }}</p>

            <div v-else class="max-w-3xl bg-white p-8 rounded-lg shadow-xl mx-auto">
                <h3 class="text-xl font-bold mb-6 border-b pb-2 flex items-center">
                    <PlusCircleIcon class="w-6 h-6 mr-3 text-indigo-600" /> Thông tin Công việc
                </h3>

                <div v-if="successMessage" class="bg-green-100 text-green-700 p-4 rounded-lg mb-6 font-semibold">
                    {{ successMessage }}
                </div>
                
                <form @submit.prevent="handleSubmit">
                    
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
                            <label class="block text-gray-700 text-sm font-bold mb-2">Chọn Dự án</label>
                            <select v-model="form.id_du_an" required class="form-select">
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.ten_du_an }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Giao việc cho</label>
                            <select v-model="form.id_nguoi_thuc_hien" required class="form-select">
                                <option v-for="user in users" :key="user.id" :value="user.id">
                                    {{ user.ho_ten }} ({{ user.email }})
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Hạn chót</label>
                            <input type="date" v-model="form.han_chot" class="form-input" required>
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Mức độ Ưu tiên (1-5)</label>
                            <input type="number" v-model="form.muc_do_uu_tien" min="1" max="5" class="form-input">
                        </div>
                    </div>

                    <button type="submit" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 shadow-md">
                        Giao Việc
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