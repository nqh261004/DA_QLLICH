<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from 'vue-router';
import { 
    ArchiveBoxIcon, 
    CalendarIcon, 
    PencilSquareIcon,
    ArrowLeftIcon,
    Bars3BottomLeftIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline'; 

const toast = useToast();
const route = useRoute();
const router = useRouter();

const projectId = ref(route.params.id as string);
const project = ref<any>(null);
const form = ref({
    ten_du_an: '',
    mo_ta: '',
});

const isSubmitting = ref(false);
const isLoading = ref(true);
const error = ref('');
const successMessage = ref('');

const fetchProject = async (id: string) => {
    isLoading.value = true;
    error.value = '';
    try {
        const response = await apiClient.get(`/du-an/${id}`);
        project.value = response.data;
        form.value = {
            ten_du_an: project.value.ten_du_an,
            mo_ta: project.value.mo_ta,
        };
    } catch (err: any) {
        error.value = 'Không thể tải chi tiết dự án. Vui lòng kiểm tra ID.';

    } finally {
        isLoading.value = false;
    }
};

const handleSubmit = async () => {
    error.value = '';
    isSubmitting.value = true;
    successMessage.value = '';

    if (!form.value.ten_du_an) {
        toast.error('Tên dự án không được để trống.');
        isSubmitting.value = false;
        return;
    }

    try {
        await apiClient.patch(`/du-an/${projectId.value}`, form.value);
        
        toast.success(`Cập nhật dự án "${form.value.ten_du_an}" thành công!`);
        successMessage.value = 'Đã lưu thay đổi thành công.';

        project.value.ten_du_an = form.value.ten_du_an;
        project.value.mo_ta = form.value.mo_ta;
        
    } catch (err: any) {
        const responseMessage = err.response?.data?.message;
        let finalMessage = 'Sửa dự án thất bại.';

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

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
};

onMounted(() => fetchProject(projectId.value));
</script>

<template>
    <MainLayout>
        <div class="max-w-3xl mx-auto space-y-6">
            <button @click="router.back()" class="flex items-center text-gray-600 hover:text-indigo-600 transition mb-4">
                <ArrowLeftIcon class="w-5 h-5 mr-2" /> Quay lại
            </button>

            <div v-if="isLoading" class="p-12 text-center text-gray-500 bg-white rounded-xl shadow">
                <svg class="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Đang tải dữ liệu dự án...
            </div>

            <div v-else-if="project" class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                    <div class="flex items-center">
                        <div class="bg-white/20 p-3 rounded-full mr-4 backdrop-blur-sm">
                            <PencilSquareIcon class="w-8 h-8 text-white"/>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">Chỉnh Sửa Dự Án</h1>
                            <p class="text-blue-100 text-sm mt-1 truncate max-w-md">
                                {{ project.ten_du_an }}
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="error" class="mx-8 mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {{ error }}
                </div>
                <div v-if="successMessage" class="mx-8 mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center">
                    <CheckCircleIcon class="w-5 h-5 mr-2"/> {{ successMessage }}
                </div>

                <div class="p-8 space-y-8">
                    <div class="bg-gray-50 rounded-xl p-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex items-center">
                            <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                <CalendarIcon class="w-6 h-6 text-blue-600"/>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold uppercase">Ngày bắt đầu</p>
                                <p class="text-gray-800 font-medium">{{ formatDate(project.ngay_bat_dau) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <div class="bg-indigo-100 p-2 rounded-lg mr-3">
                                <CalendarIcon class="w-6 h-6 text-indigo-600"/>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold uppercase">Ngày kết thúc</p>
                                <p class="text-gray-800 font-medium">{{ formatDate(project.ngay_ket_thuc_du_kien) }}</p>
                            </div>
                        </div>
                    </div>

                    <form @submit.prevent="handleSubmit" class="space-y-6">
                        
                        <div>
                            <label class="label">Tên Dự án</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ArchiveBoxIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" v-model="form.ten_du_an" required
                                    placeholder="Nhập tên dự án mới" 
                                    class="form-input pl-10" />
                            </div>
                        </div>

                        <div>
                            <label class="label">Mô tả</label>
                            <div class="relative">
                                <div class="absolute top-3 left-3 pointer-events-none">
                                    <Bars3BottomLeftIcon class="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea v-model="form.mo_ta" rows="5" 
                                    placeholder="Cập nhật mô tả dự án..." 
                                    class="form-input pl-10 pt-3 resize-none"></textarea>
                            </div>
                        </div>

                        <div class="flex justify-end items-center pt-6 border-t border-gray-100 space-x-4">
                            <router-link :to="{name: 'admin-projects'}" class="btn-secondary">
                                Hủy bỏ
                            </router-link>
                            <button type="submit" :disabled="isSubmitting" 
                                class="btn-primary flex items-center">
                                <span v-if="!isSubmitting" class="flex items-center">
                                    <CheckCircleIcon class="w-5 h-5 mr-2" /> Lưu Thay Đổi
                                </span>
                                <span v-else class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Đang lưu...
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div v-else class="p-12 text-center">
                <p class="text-red-500 font-medium text-lg">{{ error }}</p>
                <button @click="router.push({ name: 'admin-projects' })" class="mt-4 text-indigo-600 hover:underline">
                    Quay về danh sách
                </button>
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
    @apply bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-gray-50 transition duration-150 flex items-center justify-center;
}
</style>