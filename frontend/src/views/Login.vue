<script setup lang="ts">
import { ref } from 'vue';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const email = ref('');
const mat_khau = ref('');
const showPassword = ref(false);
const isLoading = ref(false); 

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const decodeJwt = (token: string) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Token không hợp lệ.');

        const payloadBase64 = parts[1];
        const payload = JSON.parse(atob(payloadBase64!));

        return {
            userId: payload.sub,
            role: payload.vai_tro,
            name: payload.email?.split('@')[0] || 'Người dùng',
        };
    } catch (e) {
        console.error("Lỗi giải mã JWT (An toàn):", e);
        return { role: 'nhan_vien', name: 'Người dùng' };
    }
};

const handleLogin = async () => {
    isLoading.value = true;
    try {
        const response = await apiClient.post('/auth/dang-nhap', {
            email: email.value,
            mat_khau: mat_khau.value
        });

        const token = response.data.accessToken;
        const decoded = decodeJwt(token);

        authStore.setAuth(token, decoded.userId, decoded.role, decoded.name);

        toast.success(`Xin chào, ${decoded.name}!`);
        router.push({ name: 'dashboard' });

    } catch (err: any) {
        const msg = err.response?.data?.message || 'Đăng nhập thất bại!';
        toast.error(msg);
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative bg-gray-900">
    
    <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
             alt="Background" 
             class="w-full h-full object-cover opacity-60" />
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
    </div>

    <div class="relative z-10 w-full max-w-md px-6 animate-fade-in-up">
        <div class="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 sm:p-10">
            
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white shadow-lg mb-4 transform -rotate-6 transition hover:rotate-0">
                    <LockClosedIcon class="w-7 h-7"/>
                </div>
                <h2 class="text-3xl font-extrabold text-gray-800 tracking-tight">Đăng Nhập</h2>
                <p class="text-gray-500 mt-2 text-sm">Chào mừng bạn quay trở lại hệ thống!</p>
            </div>

            <form class="space-y-6" @submit.prevent="handleLogin">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1 ml-1">Email</label>
                    <div class="relative group">
                        <input type="email" required v-model="email"
                            class="form-input pl-10"
                            placeholder="abc@congty.com">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1 ml-1">Mật khẩu</label>
                    <div class="relative group">
                        <input :type="showPassword ? 'text' : 'password'" required v-model="mat_khau"
                            class="form-input pl-10 pr-10"
                            placeholder="••••••••">
                        
                        <button type="button" @click="togglePasswordVisibility"
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition focus:outline-none">
                            <component :is="showPassword ? EyeSlashIcon : EyeIcon" class="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <button type="submit" :disabled="isLoading"
                    class="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
                    <span v-if="!isLoading" class="flex items-center">
                        ĐĂNG NHẬP
                    </span>
                    <span v-else class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Đang xử lý...
                    </span>
                </button>
            </form>

        </div>
    </div>
  </div>
</template>

<style scoped>

.form-input {
    @apply appearance-none block w-full px-3 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
}
</style>