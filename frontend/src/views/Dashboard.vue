<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue'; 
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">
                Chào mừng, {{ authStore.userName }}!
            </h1>
            
            <p class="text-xl text-indigo-600">
                Bạn đang ở Dashboard chính.
            </p>

            <div class="p-6 bg-white rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Tổng quan Công việc</h2>
                <p class="text-gray-600">
                    Đây là nơi các thẻ tóm tắt (Quá hạn, Sắp hết hạn, Chờ duyệt) sẽ được hiển thị sau khi chúng ta tích hợp API.
                </p>
            </div>
        </div>
    </MainLayout>
</template>