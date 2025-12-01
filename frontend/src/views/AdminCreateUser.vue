<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref } from 'vue';
import apiClient from '@/api/client';
import { useToast } from "vue-toastification"; 
import { 
    UserPlusIcon, 
    UserIcon, 
    EnvelopeIcon, 
    LockClosedIcon, 
    BriefcaseIcon,
    ArrowLeftIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();

const form = ref({
    ho_ten: '',
    email: '',
    mat_khau: '',
    vai_tro: 'nhan_vien' as 'quan_ly' | 'nhan_vien',
});

const isSubmitting = ref(false);
const error = ref('');

const handleSubmit = async () => {
    error.value = '';
    isSubmitting.value = true;

    if (form.value.mat_khau.length < 6) {
        toast.error('Mật khẩu phải chứa ít nhất 6 ký tự.'); 
        isSubmitting.value = false;
        return;
    }

    try {
        await apiClient.post('/nguoi-dung', { ...form.value });

        toast.success(`Đã tạo tài khoản ${form.value.ho_ten} thành công!`);

        // Reset form
        form.value = {
            ho_ten: '',
            email: '',
            mat_khau: '',
            vai_tro: 'nhan_vien',
        };

    } catch (err: any) {
        const msg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.';
        if (msg.includes('exist')) {
            toast.error('Email này đã được sử dụng!');
        } else {
            toast.error(msg);
        }
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <MainLayout>
        <div class="max-w-2xl mx-auto space-y-6">

            <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Quay lại
            </button>

            <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                <div class="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-white text-center">
                    <div class="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <UserPlusIcon class="w-8 h-8 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold">Tạo Tài khoản Mới</h1>
                    <p class="mt-2 opacity-90 text-sm">Thêm nhân viên mới vào hệ thống quản lý.</p>
                </div>

                <div class="p-8">
                    <form @submit.prevent="handleSubmit" class="space-y-6">

                        <div>
                            <label class="label">Họ và Tên</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" v-model="form.ho_ten" required
                                    placeholder="Ví dụ: Nguyễn Văn A" 
                                    class="form-input pl-10" />
                            </div>
                        </div>

                        <div>
                            <label class="label">Địa chỉ Email</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="email" v-model="form.email" required
                                    placeholder="ten.nhanvien@congty.com" 
                                    class="form-input pl-10" />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <label class="label">Mật khẩu khởi tạo</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon class="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="password" v-model="form.mat_khau" required
                                        placeholder="Tối thiểu 6 ký tự" 
                                        class="form-input pl-10" />
                                </div>
                            </div>

                            <div>
                                <label class="label">Vai trò hệ thống</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <BriefcaseIcon class="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select v-model="form.vai_tro" class="form-input pl-10 appearance-none">
                                        <option value="nhan_vien">Nhân viên</option>
                                        <option value="quan_ly">Quản lý (Admin)</option>
                                    </select>

                                    <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="border-t border-gray-100 pt-6 mt-6 flex justify-end space-x-4">
                            <button type="button" @click="router.back()" class="btn-secondary">
                                Hủy bỏ
                            </button>
                            <button type="submit" :disabled="isSubmitting" 
                                class="btn-primary flex items-center">
                                <CheckCircleIcon v-if="!isSubmitting" class="w-5 h-5 mr-2" />
                                <svg v-else class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                {{ isSubmitting ? 'Đang xử lý...' : 'Tạo Tài khoản' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.form-input {
    @apply mt-1 block w-full py-3 pr-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 outline-none;
}
.label {
    @apply block text-sm font-semibold text-gray-700 mb-1;
}
.btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-sm transition duration-150 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}
.btn-secondary {
    @apply bg-white border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg text-sm hover:bg-gray-50 transition duration-150;
}
</style>