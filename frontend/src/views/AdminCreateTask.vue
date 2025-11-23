<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; 
import { PlusCircleIcon, CalendarIcon, BriefcaseIcon, UserIcon } from '@heroicons/vue/24/outline';

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

        projects.value = projectsRes.data.filter((p: any) => p.trang_thai !== 'hoan_thanh' && p.trang_thai !== 'huy');
        users.value = usersRes.data.filter((u: any) => u.vai_tro === 'nhan_vien' && u.trang_thai_hoat_dong);

        if (projects.value.length > 0) {
            form.value.id_du_an = projects.value[0].id;
        }
        if (users.value.length > 0) {
            form.value.id_nguoi_thuc_hien = users.value[0].id;
        }

    } catch (err: any) {
        toast.error('Lỗi tải dữ liệu. Hãy đảm bảo bạn đã tạo Dự án và Người dùng.');
    } finally {
        isLoading.value = false;
    }
};

const handleSubmit = async () => {
    isSubmitting.value = true;

    if (!form.value.tieu_de || !form.value.id_du_an || !form.value.id_nguoi_thuc_hien) {
        toast.error('Vui lòng điền Tiêu đề và chọn Dự án và Người thực hiện.');
        isSubmitting.value = false;
        return;
    }

    try {
        const payload = {
            ...form.value,
            muc_do_uu_tien: Number(form.value.muc_do_uu_tien) 
        };

        await apiClient.post('/cong-viec', payload);
        
        toast.success(`Công việc "${form.value.tieu_de}" đã được giao thành công!`);

        router.push({ name: 'admin-tasks-list' }); 

    } catch (err: any) {
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
            <h1 class="text-3xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center">
            <PlusCircleIcon class="w-8 h-8 mr-2 text-indigo-600"/>Tạo Công việc Mới
            </h1>
            
            <p v-if="isLoading">Đang tải dữ liệu...</p>
            
            <div v-else class="max-w-3xl bg-white p-8 rounded-lg shadow-xl mx-auto">
                <form @submit.prevent="handleSubmit" :class="{'opacity-50': isSubmitting}">
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Tên công việc</label>
                        <input type="text" v-model="form.tieu_de" required
                               placeholder="Nhập tên công việc" 
                               class="form-input">
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Mô tả công việc</label>
                        <textarea v-model="form.mo_ta" rows="4" 
                                  placeholder="Nhập mô tả công việc" 
                                  class="form-input"></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                                <BriefcaseIcon class="w-4 h-4 mr-1"/> Chọn dự án
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
                                <option value="ALL">
                                    Tất cả nhân viên
                                </option>
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
                            <label class="block text-gray-700 text-sm font-bold mb-2">Mức độ ưu tiên (1-5)</label>
                            <input type="number" v-model="form.muc_do_uu_tien" min="1" max="5" class="form-input">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <router-link :to="{name: 'admin-tasks-list'}" class="btn-secondary">Hủy</router-link>
                        <button type="submit" 
                                :disabled="isSubmitting"
                                class="btn-primary bg-indigo-600 hover:bg-indigo-700">
                            {{ isSubmitting ? 'Đang tạo...' : 'Tạo Công việc' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.form-input, .form-select {
    @apply shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150;
}
.form-input {
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