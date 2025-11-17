<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed, watch } from 'vue';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { LockClosedIcon, PencilSquareIcon, EnvelopeIcon, BriefcaseIcon, CalendarIcon, UserCircleIcon, HomeIcon } from '@heroicons/vue/24/outline';
import { useToast } from "vue-toastification"; 


const authStore = useAuthStore();
const route = useRoute();
const router = useRouter(); 
const toast = useToast();

// Dữ liệu người dùng
const user = ref<any>({}); 
const nameForm = ref({ ho_ten: '' });
const passwordForm = ref({ mat_khau_moi: '', xac_nhan_mat_khau: '' });

// Trạng thái giao diện
const isEditingNameModalOpen = ref(false); // SỬA: Biến Modal cho sửa tên
const isPasswordModalOpen = ref(false); 

// Thông báo
const error = ref('');
const successMessage = ref('');

// ID MỤC TIÊU
const currentProfileId = computed(() => route.params.id || authStore.userId);
const isSelfProfile = computed(() => currentProfileId.value === authStore.userId);


// 1. Tải thông tin cá nhân (Hàm chính)
const fetchProfile = async () => {
    error.value = '';
    const idToFetch = route.params.id || authStore.userId; 
    
    if (!idToFetch) {
        error.value = 'Lỗi: Không tìm thấy ID người dùng.';
        return;
    }

    try {
        const response = await apiClient.get(`/nguoi-dung/${idToFetch}`); 
        user.value = response.data;
        nameForm.value.ho_ten = response.data.ho_ten;
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Không thể tải hồ sơ. Lỗi phân quyền.';
        
        if (route.name === 'admin-user-detail') { 
             router.push({ name: 'admin-users' }); 
        } else { 
             router.push({ name: 'dashboard' }); 
        }
    }
};

// 2. Xử lý logic Đổi mật khẩu (giữ nguyên)
const handleChangePassword = async () => {
    if (!isSelfProfile.value) return; 

    if (passwordForm.value.mat_khau_moi.length < 6) {
        toast.error('Mật khẩu phải chứa ít nhất 6 ký tự.');
        return;
    }
    if (passwordForm.value.mat_khau_moi !== passwordForm.value.xac_nhan_mat_khau) {
        toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
        return;
    }

    try {
        await apiClient.patch(`/nguoi-dung/${authStore.userId}`, { 
            mat_khau: passwordForm.value.mat_khau_moi 
        });
        
        toast.success(`Đổi mật khẩu thành công`);
        passwordForm.value = { mat_khau_moi: '', xac_nhan_mat_khau: '' };
        isPasswordModalOpen.value = false;
        
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Đổi mật khẩu thất bại.';
    }
};

// 3. Xử lý logic Sửa tên (chỉ cho Self-profile)
const handleUpdateName = async () => {
    if (!isSelfProfile.value) return; 

    
    // Kiểm tra nếu tên không thay đổi
    if (nameForm.value.ho_ten === user.value.ho_ten) {
        isEditingNameModalOpen.value = false;
        return;
    }

    try {
        const response = await apiClient.patch(`/nguoi-dung/${authStore.userId}`, { 
            ho_ten: nameForm.value.ho_ten 
        });
        
        user.value.ho_ten = response.data.ho_ten;
        authStore.userName = response.data.ho_ten; 
        toast.success(`Cập nhật tên thành công`);
        isEditingNameModalOpen.value = false; 

        fetchProfile(); 

    } catch (err: any) {
        error.value = err.response?.data?.message || 'Cập nhật tên thất bại.';
    }
};


// 4. Xử lý logic format (giữ nguyên)
const formatRole = (role: string) => {
    return role === 'quan_ly' ? 'Quản lý' : 'Nhân viên';
};
const formatStatus = (status: boolean) => {
    return status ? 'Hoạt động' : 'Vô hiệu';
};

// Lắng nghe thay đổi ID trên URL
watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId && newId) {
        fetchProfile();
    }
});

onMounted(fetchProfile);
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800 border-b pb-3 mb-4">
                <UserCircleIcon class="w-8 h-8 mr-2 inline text-indigo-600" /> 
                {{ isSelfProfile ? 'Hồ sơ Cá nhân' : `Hồ sơ: ${user.ho_ten}` }}
            </h1>
            
            <div v-if="error" class="alert-error">{{ error }}</div>
            <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>

            <p v-if="!user.id" class="py-10 text-center text-gray-500">Đang tải thông tin hồ sơ...</p>

            <div v-if="user.id" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div class="lg:col-span-1 h-fit">
                    <div class="bg-white p-8 rounded-xl shadow-2xl mb-6 text-center border-t-4 border-indigo-500">
                        <div class="w-28 h-28 mx-auto rounded-full bg-indigo-500 flex items-center justify-center text-white text-5xl font-bold mb-4 shadow-inner">
                            {{ user.ho_ten ? user.ho_ten.charAt(0) : '?' }}
                        </div>

                        <p class="text-2xl font-extrabold text-gray-800">{{ user.ho_ten }}</p>
                        <p class="text-sm font-semibold text-gray-500 capitalize mt-1">Chức vụ: {{ formatRole(user.vai_tro) }}</p>
                        
                        <div class="mt-4">
                            <span :class="{'bg-green-100 text-green-800': user.trang_thai_hoat_dong, 'bg-red-100 text-red-800': !user.trang_thai_hoat_dong}"
                                      class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full">
                                    {{ formatStatus(user.trang_thai_hoat_dong) }}
                            </span>
                        </div>
                        
                        <div v-if="isSelfProfile" class="mt-6 flex flex-col space-y-3">
                            <button @click="isEditingNameModalOpen = true" 
                                class="profile-action-button bg-indigo-500 hover:bg-indigo-600">
                                <PencilSquareIcon class="w-5 h-5 mr-2" /> Chỉnh sửa Tên
                            </button>
                            <button @click="isPasswordModalOpen = true" 
                                class="profile-action-button bg-red-500 hover:bg-red-600">
                                <LockClosedIcon class="w-5 h-5 mr-2" /> Đổi Mật khẩu
                            </button>
                        </div>
                    </div>

                    <div v-if="!isSelfProfile && authStore.isManager" class="mt-4">
                         <button @click="router.push({ name: 'admin-users' })" 
                                class="w-full btn-secondary">
                             <HomeIcon class="w-5 h-5 mr-2 inline" /> Quay lại Quản lý Tài khoản
                        </button>
                    </div>
                </div>

                <div class="bg-white p-8 rounded-xl shadow lg:col-span-2">
                    <h3 class="text-xl font-bold mb-6 border-b pb-2 text-indigo-600">
                        Chi tiết Hồ sơ
                    </h3>
                    
                    <div class="space-y-5">
                        <p class="detail-item">
                            <EnvelopeIcon class="w-6 h-6 mr-3 text-indigo-500" /> 
                            <span class="text-gray-500">Email:</span> <strong>{{ user.email }}</strong>
                        </p>
                        <p class="detail-item">
                            <BriefcaseIcon class="w-6 h-6 mr-3 text-indigo-500" /> 
                            <span class="text-gray-500">Phòng ban:</span><strong>{{ user.phong_ban?.ten_phong_ban || 'Chưa gán' }}</strong>
                        </p>
                        <p class="detail-item">
                            <CalendarIcon class="w-6 h-6 mr-3 text-indigo-500" /> 
                            <span class="text-gray-500">Tham gia từ:</span> <strong>{{ new Date(user.ngay_tao).toLocaleDateString('vi-VN') }}</strong>
                        </p>
                    </div>
                </div>
            </div>
            
            <div v-if="isEditingNameModalOpen" class="modal-overlay">
                <div class="modal-content">
                    <h2 class="text-2xl font-bold mb-4 border-b pb-2 text-indigo-600 flex items-center">
                        <PencilSquareIcon class="w-6 h-6 mr-2" /> Chỉnh sửa Họ tên
                    </h2>
                    <form @submit.prevent="handleUpdateName" class="space-y-4">
                        <div class="mb-4">
                            <label for="ho_ten_edit" class="label">Họ và Tên mới</label>
                            <input type="text" id="ho_ten_edit" required v-model="nameForm.ho_ten" class="form-input" />
                        </div>
                        
                        <div class="flex justify-end space-x-3 pt-2">
                            <button type="button" @click="isEditingNameModalOpen = false" class="btn-secondary">Hủy</button>
                            <button type="submit" class="btn-primary">Cập nhật</button>
                        </div>
                    </form>
                </div>
            </div>

            <div v-if="isPasswordModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="modal-content">
                    <h2 class="text-2xl font-bold mb-4 border-b pb-2 text-red-600 flex items-center">
                        <LockClosedIcon class="w-6 h-6 mr-2" /> Đổi Mật khẩu
                    </h2>
                    <form @submit.prevent="handleChangePassword" class="space-y-4">
                        <div class="mb-4">
                            <label for="mat_khau_moi" class="label">Mật khẩu mới</label>
                            <input type="password" id="mat_khau_moi" required v-model="passwordForm.mat_khau_moi" class="form-input" placeholder="Tối thiểu 6 ký tự">
                        </div>
                        <div class="mb-6">
                            <label for="xac_nhan_mat_khau" class="label">Xác nhận Mật khẩu</label>
                            <input type="password" id="xac_nhan_mat_khau" required v-model="passwordForm.xac_nhan_mat_khau" class="form-input" placeholder="Nhập lại mật khẩu mới">
                        </div>
                        
                        <div class="flex justify-end space-x-3">
                            <button type="button" @click="isPasswordModalOpen = false" class="btn-secondary">Hủy</button>
                            <button type="submit" class="btn-primary">Xác nhận Đổi</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.detail-item {
    @apply flex items-center text-lg font-medium text-gray-800 border-t pt-4;
}
.form-input {
    @apply mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150;
}
.profile-action-button {
    @apply w-full font-semibold py-2 px-4 rounded-md transition duration-150 shadow-md flex items-center justify-center text-white;
}
.alert-success {
    @apply text-green-700 p-3 bg-green-100 rounded-lg border border-green-300 font-medium;
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}
.btn-primary {
    @apply bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md;
}
.btn-secondary {
    @apply bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-150;
}
.label {
    @apply block text-sm font-medium text-gray-700 mb-1;
}
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.modal-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
</style>