<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, watch } from 'vue';
import apiClient from '@/api/client';
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from 'vue-router';
import { ArchiveBoxIcon, CalendarIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'; 

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
        router.push({ name: 'admin-projects' }); 
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
        error.value = err.response?.data?.message || 'Cập nhật thất bại.';
        toast.error(error.value);
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => fetchProject(projectId.value));
</script>

<template>
    <MainLayout>
        <div class="space-y-8 max-w-4xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center">
                <ArchiveBoxIcon class="w-8 h-8 mr-2 text-indigo-600" /> Sửa Dự án: {{ project?.ten_du_an || 'Đang tải...' }}
            </h1>
            
            <p v-if="error" class="alert-error">{{ error }}</p>
            <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>

            <p v-if="isLoading" class="text-center py-10">Đang tải dữ liệu dự án...</p>

            <div v-else-if="project" class="bg-white p-8 rounded-xl shadow-xl">
                
                <div class="grid grid-cols-2 gap-4 mb-6 border-b pb-4">
                     <div>
                        <label class="label flex items-center"><CalendarIcon class="w-4 h-4 mr-1"/> Ngày Bắt đầu</label>
                        <p class="text-lg font-semibold">{{ new Date(project.ngay_bat_dau).toLocaleDateString('vi-VN') }}</p>
                    </div>
                     <div>
                        <label class="label flex items-center"><CalendarIcon class="w-4 h-4 mr-1"/> Ngày Kết thúc</label>
                        <p class="text-lg font-semibold">{{ new Date(project.ngay_ket_thuc_du_kien).toLocaleDateString('vi-VN') }}</p>
                    </div>
                </div>

                <form @submit.prevent="handleSubmit" :class="{'opacity-50': isSubmitting}">
                    
                    <div class="mb-4">
                        <label class="label">Tên Dự án</label>
                        <input type="text" v-model="form.ten_du_an" required
                               placeholder="Tên Dự án" 
                               class="form-input">
                    </div>

                    <div class="mb-6">
                        <label class="label">Mô tả</label>
                        <textarea v-model="form.mo_ta" rows="4" 
                                  placeholder="Mô tả dự án" 
                                  class="form-input"></textarea>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <router-link :to="{name: 'admin-projects'}" class="btn-secondary">Hủy</router-link>
                        <button type="submit" 
                                :disabled="isSubmitting"
                                class="btn-primary bg-indigo-600 hover:bg-indigo-700">
                            {{ isSubmitting ? 'Đang lưu...' : 'Lưu' }}
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
.alert-success {
    @apply text-green-700 p-3 bg-green-100 rounded-lg border border-green-300 font-medium;
}
</style>