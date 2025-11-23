<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref } from 'vue';
import apiClient from '@/api/client';
import { useToast } from "vue-toastification";
import { useRouter } from 'vue-router';
import { ArchiveBoxIcon, CalendarIcon } from '@heroicons/vue/24/outline'; 

const toast = useToast();
const router = useRouter();

const form = ref({
    ten_du_an: '',
    mo_ta: '',
    ngay_bat_dau: '',
    ngay_ket_thuc_du_kien: '',
});

const error = ref('');
const isSubmitting = ref(false);

const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]; 
};

const handleSubmit = async () => {
    error.value = '';
    isSubmitting.value = true;

    if (!form.value.ten_du_an || !form.value.ngay_bat_dau || !form.value.ngay_ket_thuc_du_kien) {
        error.value = 'Vui lòng điền đầy đủ các trường bắt buộc.';
        toast.error(error.value);
        isSubmitting.value = false;
        return;
    }
    if (new Date(form.value.ngay_ket_thuc_du_kien) < new Date(form.value.ngay_bat_dau)) {
        error.value = 'Ngày kết thúc không thể sớm hơn ngày bắt đầu.';
        toast.error(error.value);
        isSubmitting.value = false;
        return;
    }

    try {
        await apiClient.post('/du-an', form.value);

        toast.success(`Dự án "${form.value.ten_du_an}" đã được tạo thành công!`);

        router.push({ name: 'admin-projects' }); 

    } catch (err: any) {
        error.value = err.response?.data?.message || 'Tạo dự án thất bại.';
        toast.error(error.value);
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <MainLayout>
        <div class="space-y-8 max-w-4xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center">
                <ArchiveBoxIcon class="w-8 h-8 mr-2 text-indigo-600" /> Tạo Dự Án Mới
            </h1>
            
            <p v-if="error" class="alert-error">{{ error }}</p>

            <div class="bg-white p-8 rounded-xl shadow-xl">
                <form @submit.prevent="handleSubmit" :class="{'opacity-50': isSubmitting}">
                    
                    <div class="mb-4">
                        <label class="label">Tên dự án</label>
                        <input type="text" v-model="form.ten_du_an" required
                               placeholder="Nhập tên dự án" 
                               class="form-input">
                    </div>

                    <div class="mb-4">
                        <label class="label">Mô tả dự án</label>
                        <textarea v-model="form.mo_ta" rows="4" 
                                  placeholder="Nhập mô tả dự án" 
                                  class="form-input"></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="label flex items-center">
                                <CalendarIcon class="w-4 h-4 mr-1"/> Ngày bắt đầu
                            </label>
                            <input type="date" v-model="form.ngay_bat_dau" required
                                   :min="getTodayDate()"
                                   class="form-input">
                        </div>
                        <div>
                            <label class="label flex items-center">
                                <CalendarIcon class="w-4 h-4 mr-1"/> Ngày kết thúc
                            </label>
                            <input type="date" v-model="form.ngay_ket_thuc_du_kien" required
                                   :min="form.ngay_bat_dau || getTodayDate()"
                                   class="form-input">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <router-link :to="{name: 'admin-projects'}" class="btn-secondary">Hủy</router-link>
                        <button type="submit" 
                                :disabled="isSubmitting"
                                class="btn-primary bg-indigo-600 hover:bg-indigo-700">
                            {{ isSubmitting ? 'Đang tạo...' : 'Tạo Dự án' }}
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
    @apply font-bold py-2 px-4 rounded shadow-lg text-sm text-white;
}
.btn-secondary {
    @apply bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm;
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}
</style>