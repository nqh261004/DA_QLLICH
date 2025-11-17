<script setup lang="ts">
import { ref } from 'vue';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const mat_khau = ref('');
const error = ref('');

// Hàm giải mã JWT để lấy Role và Tên (Đơn giản hóa)
const decodeJwt = (token: string) => {
    try {
        const parts = token.split('.');
        // Kiểm tra an toàn: Đảm bảo token có 3 phần
        if (parts.length !== 3) {
            throw new Error('Token không hợp lệ.');
        }

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
}

const handleLogin = async () => {
    error.value = '';
    try {
        const response = await apiClient.post('/auth/dang-nhap', {
            email: email.value,
            mat_khau: mat_khau.value
        });

        const token = response.data.accessToken;
        const decoded = decodeJwt(token);

        console.log('API Success. Token:', token);
        console.log('Decoded Role:', decoded.role);
        
        // Lưu thông tin vào Pinia Store và Local Storage
        authStore.setAuth(token, decoded.userId, decoded.role, decoded.name); 

        // Chuyển hướng về Dashboard (path '/')
        router.push({ name: 'dashboard' });

    } catch (err: any) {
        // Xử lý lỗi từ Backend (ví dụ: 401 Unauthorized)
        error.value = err.response?.data?.message || 'Đăng nhập thất bại!';
        console.error(err);
    }
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                ĐĂNG NHẬP
            </h2>
            <p v-if="error" class="text-red-500 text-sm text-center font-medium">{{ error }}</p>
            <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <input id="email-address" name="email" type="email" autocomplete="email" required
                               v-model="email"
                               class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                               placeholder="Email">
                    </div>
                    <div>
                        <input id="password" name="password" type="password" autocomplete="current-password" required
                               v-model="mat_khau"
                               class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                               placeholder="Mật khẩu">
                    </div>
                </div>

                <div>
                    <button type="submit"
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Đăng nhập
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>