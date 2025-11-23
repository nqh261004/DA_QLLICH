<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useToast } from "vue-toastification"; 
import { UserPlusIcon } from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const toast = useToast();

const form = ref({
    ho_ten: '',
    email: '',
    mat_khau: '',
    vai_tro: 'nhan_vien' as 'quan_ly' | 'nhan_vien',
});

const isSubmitting = ref(false);
const error = ref('');
const phongBans = ref<any[]>([]); 

const handleSubmit = async () => {
    error.value = '';
    isSubmitting.value = true;

    if (form.value.mat_khau.length < 6) {
        toast.error('Mật khẩu phải chứa ít nhất 6 ký tự.'); 
        isSubmitting.value = false;
        return;
    }

    try {
        await apiClient.post('/nguoi-dung', {
            ...form.value,
        });

        toast.success(`Đã tạo tài khoản ${form.value.ho_ten} thành công!`);

        form.value = {
            ho_ten: '',
            email: '',
            mat_khau: '',
            vai_tro: 'nhan_vien',
        };

    } catch (err: any) {
        toast.error('Email đã tồn tại!');
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {

});
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800 border-b pb-3 mb-4">
                <UserPlusIcon class="w-8 h-8 mr-2 inline text-indigo-600" /> Tạo Tài khoản Mới
            </h1>

            <p v-if="error" class="alert-error">{{ error }}</p>

            <div class="max-w-xl bg-white p-8 rounded-xl shadow-xl mx-auto">
                <form @submit.prevent="handleSubmit" :class="{'opacity-50': isSubmitting}">

                    <div class="mb-4">
                        <label class="label">Họ và Tên</label>
                        <input type="text" v-model="form.ho_ten" required
                               placeholder="Nguyễn Văn A" 
                               class="form-input">
                    </div>

                    <div class="mb-4">
                        <label class="label">Địa chỉ Email</label>
                        <input type="email" v-model="form.email" required
                               placeholder="ten.nhanvien@congty.com" 
                               class="form-input">
                    </div>

                    <div class="mb-4">
                        <label class="label">Mật khẩu ban đầu</label>
                        <input type="password" v-model="form.mat_khau" required
                               placeholder="Mật khẩu tối thiểu 6 ký tự" 
                               class="form-input">
                    </div>

                    <div class="mb-6">
                        <label class="label">Vai trò</label>
                        <select v-model="form.vai_tro" class="form-input">
                            <option value="nhan_vien">Nhân viên</option>
                            <option value="quan_ly">Quản lý</option>
                        </select>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <router-link :to="{name: 'admin-users'}" class="btn-secondary">Hủy</router-link>
                        <button type="submit" 
                                :disabled="isSubmitting"
                                class="btn-primary bg-indigo-600 hover:bg-indigo-700">
                            {{ isSubmitting ? 'Đang tạo...' : 'Tạo Tài Khoản' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.form-input {
    @apply mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150;
}
.label {
    @apply block text-sm font-medium text-gray-700 mb-1;
}
.btn-primary {
    @apply font-bold py-2 px-4 rounded shadow-lg text-sm;
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}
.btn-secondary {
    @apply bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm;
}
</style>