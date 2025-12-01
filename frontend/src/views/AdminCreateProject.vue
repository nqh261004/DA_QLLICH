<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref } from 'vue';
import apiClient from '@/api/client';
import { useToast } from "vue-toastification";
import { useRouter } from 'vue-router';
import { 
    ArchiveBoxIcon, 
    CalendarIcon, 
    ArrowLeftIcon, 
    PencilSquareIcon, 
    Bars3BottomLeftIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline'; 

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
        error.value = 'Vui lòng điền đầy đủ các trường bắt buộc (*).';
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
        const responseMessage = err.response?.data?.message;
        let finalMessage = 'Tạo dự án thất bại.';

        if (Array.isArray(responseMessage) && responseMessage.length > 0) {
             finalMessage = responseMessage[0]; 
        } else if (typeof responseMessage === 'string') {
             finalMessage = responseMessage;
        }

        toast.error(finalMessage);
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <MainLayout>
        <div class="max-w-4xl mx-auto space-y-6">
            <button @click="router.back()" class="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Quay lại
            </button>

            <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div class="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-white">
                    <div class="flex items-center">
                        <div class="bg-white/20 p-3 rounded-full mr-4 backdrop-blur-sm">
                            <ArchiveBoxIcon class="w-8 h-8 text-white"/>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">Khởi Tạo Dự Án Mới</h1>
                            <p class="text-indigo-100 text-sm mt-1">Thiết lập thông tin và thời gian cho dự án.</p>
                        </div>
                    </div>
                </div>

                <div v-if="error" class="mx-8 mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {{ error }}
                </div>

                <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
                    
                    <div>
                        <label class="label">Tên dự án <span class="text-red-500">*</span></label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <PencilSquareIcon class="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" v-model="form.ten_du_an" required
                                placeholder="Ví dụ: Xây dựng hệ thống CRM" 
                                class="form-input pl-10" />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="label">Ngày bắt đầu <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="date" v-model="form.ngay_bat_dau" required
                                    :min="getTodayDate()"
                                    class="form-input pl-10" />
                            </div>
                        </div>
                        <div>
                            <label class="label">Ngày kết thúc dự kiến <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="date" v-model="form.ngay_ket_thuc_du_kien" required
                                    :min="form.ngay_bat_dau || getTodayDate()"
                                    class="form-input pl-10" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="label">Mô tả dự án</label>
                        <div class="relative">
                            <div class="absolute top-3 left-3 pointer-events-none">
                                <Bars3BottomLeftIcon class="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea v-model="form.mo_ta" rows="4" 
                                placeholder="Mô tả mục tiêu, phạm vi dự án..." 
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
                                <CheckCircleIcon class="w-5 h-5 mr-2" /> Tạo Dự Án
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