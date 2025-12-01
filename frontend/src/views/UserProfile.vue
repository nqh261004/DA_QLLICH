<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed, watch } from 'vue';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { 
    LockClosedIcon, 
    PencilSquareIcon, 
    EnvelopeIcon, 
    BriefcaseIcon, 
    CalendarIcon, 
    UserCircleIcon, 
    EyeIcon, 
    EyeSlashIcon, 
    ArrowLeftIcon,
    ShieldCheckIcon
    // Đã xóa CameraIcon
} from '@heroicons/vue/24/outline';
import { useToast } from "vue-toastification"; 

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter(); 
const toast = useToast();

const user = ref<any>({}); 
const nameForm = ref({ ho_ten: '' });
const passwordForm = ref({ mat_khau_moi: '', xac_nhan_mat_khau: '' });

const isEditingNameModalOpen = ref(false);
const isPasswordModalOpen = ref(false); 
const showPassword = ref(false);

const error = ref('');
const successMessage = ref('');

const currentProfileId = computed(() => route.params.id || authStore.userId);
const isSelfProfile = computed(() => currentProfileId.value === authStore.userId);

const userInitials = computed(() => {
    const name = user.value.ho_ten || '?';
    return name.split(' ').map((n: string) => n[0]).join('').slice(-2).toUpperCase();
});

const fetchProfile = async () => {
    error.value = '';
    let url: string;
    if (route.name === 'profile') {
        url = '/nguoi-dung/profile'; 
    } else if (route.name === 'admin-user-detail') {
        url = `/nguoi-dung/${route.params.id}`; 
    } else {
        error.value = 'Lỗi: Không tìm thấy ID người dùng.';
        return;
    }
    
    try {
        const response = await apiClient.get(url); 
        user.value = response.data;
        nameForm.value.ho_ten = response.data.ho_ten;
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Không thể tải hồ sơ người dùng.';
    }
};

const handleChangePassword = async () => {
    if (passwordForm.value.mat_khau_moi.length < 6) {
        toast.error('Mật khẩu phải chứa ít nhất 6 ký tự.');
        return;
    }
    if (passwordForm.value.mat_khau_moi !== passwordForm.value.xac_nhan_mat_khau) {
        toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
        return;
    }

    try {
        await apiClient.patch(`/nguoi-dung/${currentProfileId.value}`, { 
            mat_khau: passwordForm.value.mat_khau_moi 
        });
        
        toast.success(`Đổi mật khẩu thành công`);
        passwordForm.value = { mat_khau_moi: '', xac_nhan_mat_khau: '' };
        isPasswordModalOpen.value = false;
        
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Đổi mật khẩu thất bại.';
    }
};

const handleUpdateName = async () => {
    if (!isSelfProfile.value) return; 

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
        toast.success(`Đổi tên thành công`);
        isEditingNameModalOpen.value = false; 
        fetchProfile(); 

    } catch (err: any) {
        error.value = err.response?.data?.message || 'Đổi tên thất bại.';
    }
};

const formatRole = (role: string) => {
    return role === 'quan_ly' ? 'Quản lý' : 'Nhân viên';
};

watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId && newId) {
        fetchProfile();
    }
});

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

onMounted(fetchProfile);
</script>

<template>
    <MainLayout>
        <div class="max-w-6xl mx-auto space-y-6">
            <div class="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
                <div class="absolute inset-0 bg-black opacity-10 pattern-grid"></div>
                
                <button @click="router.back()" class="absolute top-4 left-4 text-white hover:text-gray-200 flex items-center bg-black/20 px-3 py-1 rounded-full transition backdrop-blur-sm">
                    <ArrowLeftIcon class="w-4 h-4 mr-1" /> Quay lại
                </button>

                <div class="absolute bottom-4 left-6 text-white">
                    <h1 class="text-3xl font-bold flex items-center">
                        {{ isSelfProfile ? 'Hồ sơ Cá nhân' : `Hồ sơ: ${user.ho_ten}` }}
                    </h1>
                    <p class="opacity-90 text-sm mt-1">Quản lý thông tin và tài khoản</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-16 px-4 pb-10">
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-2xl shadow-xl p-6 text-center border border-gray-100 relative z-10">
                        <div class="relative inline-block">
                            <div class="w-32 h-32 rounded-full bg-indigo-100 border-4 border-white shadow-md flex items-center justify-center text-indigo-600 text-4xl font-bold mx-auto mb-4 select-none">
                                {{ userInitials }}
                            </div>
                        </div>

                        <h2 class="text-2xl font-bold text-gray-800">{{ user.ho_ten }}</h2>
                        
                        <div class="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            :class="user.vai_tro === 'quan_ly' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                            <ShieldCheckIcon class="w-4 h-4 mr-1"/>
                            {{ formatRole(user.vai_tro) }}
                        </div>

                        <div class="mt-3">
                            <span :class="{'bg-green-100 text-green-700': user.trang_thai_hoat_dong, 'bg-red-100 text-red-700': !user.trang_thai_hoat_dong}"
                                  class="px-3 py-1 inline-flex text-xs font-semibold rounded-full border border-current opacity-80">
                                {{ user.trang_thai_hoat_dong ? 'Đang hoạt động' : 'Đã vô hiệu hóa' }}
                            </span>
                        </div>

                        <div class="mt-6 flex flex-col space-y-3">
                            <button v-if="isSelfProfile" @click="isEditingNameModalOpen = true" 
                                class="profile-action-button bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                                <PencilSquareIcon class="w-5 h-5 mr-2 text-gray-500" /> Đổi Tên Hiển Thị
                            </button>

                            <button v-if="isSelfProfile || authStore.isManager" @click="isPasswordModalOpen = true" 
                                class="profile-action-button bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                                <LockClosedIcon class="w-5 h-5 mr-2" /> Đổi Mật Khẩu
                            </button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-2 space-y-6 pt-16 lg:pt-0">
                    <div class="bg-white rounded-2xl shadow-md p-8 border border-gray-100 h-full">
                        <h3 class="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center">
                            <UserCircleIcon class="w-6 h-6 mr-2 text-indigo-600"/>
                            Thông tin chi tiết
                        </h3>

                        <div v-if="error" class="alert-error mb-4">{{ error }}</div>
                        <div v-if="successMessage" class="alert-success mb-4">{{ successMessage }}</div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Địa chỉ Email</label>
                                <div class="flex items-center text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <EnvelopeIcon class="w-5 h-5 mr-2 text-gray-400" />
                                    {{ user.email }}
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Phòng ban</label>
                                <div class="flex items-center text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <BriefcaseIcon class="w-5 h-5 mr-2 text-gray-400" />
                                    {{ user.phong_ban?.ten_phong_ban || 'Chưa gán' }}
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Ngày tham gia</label>
                                <div class="flex items-center text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <CalendarIcon class="w-5 h-5 mr-2 text-gray-400" />
                                    {{ user.ngay_tao ? new Date(user.ngay_tao).toLocaleDateString('vi-VN') : '...' }}
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Trạng thái xác thực</label>
                                <div class="flex items-center text-green-700 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                                    <ShieldCheckIcon class="w-5 h-5 mr-2" />
                                    Đã xác minh
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="isEditingNameModalOpen" class="modal-overlay">
                <div class="modal-content animate-fade-in-down">
                    <h2 class="text-xl font-bold mb-4 border-b pb-3 text-gray-800 flex items-center">
                        <PencilSquareIcon class="w-6 h-6 mr-2 text-indigo-600" /> Cập nhật thông tin
                    </h2>
                    <form @submit.prevent="handleUpdateName" class="space-y-4">
                        <div>
                            <label for="ho_ten_edit" class="label">Họ và tên mới</label>
                            <input type="text" id="ho_ten_edit" required v-model="nameForm.ho_ten" 
                                class="form-input" placeholder="Nhập tên hiển thị mới..." />
                        </div>
                        <div class="flex justify-end space-x-3 pt-2">
                            <button type="button" @click="isEditingNameModalOpen = false" class="btn-secondary">Hủy</button>
                            <button type="submit" class="btn-primary">Lưu thay đổi</button>
                        </div>
                    </form>
                </div>
            </div>

            <div v-if="isPasswordModalOpen" class="modal-overlay">
                <div class="modal-content animate-fade-in-down">
                    <h2 class="text-xl font-bold mb-4 border-b pb-3 text-red-600 flex items-center">
                        <LockClosedIcon class="w-6 h-6 mr-2" /> Đổi Mật khẩu
                    </h2>
                    <form @submit.prevent="handleChangePassword" class="space-y-4">
                        <div class="relative">
                            <label class="label">Mật khẩu mới</label>
                            <input :type="showPassword ? 'text' : 'password'" v-model="passwordForm.mat_khau_moi" required 
                                placeholder="Tối thiểu 6 ký tự" class="form-input pr-10" />
                            <button type="button" @click="togglePasswordVisibility" class="absolute top-8 right-3 text-gray-400 hover:text-gray-600">
                                <component :is="showPassword ? EyeSlashIcon : EyeIcon" class="h-5 w-5" />
                            </button>
                        </div>

                        <div class="relative">
                            <label class="label">Xác nhận mật khẩu</label>
                            <input :type="showPassword ? 'text' : 'password'" v-model="passwordForm.xac_nhan_mat_khau" required 
                                placeholder="Nhập lại mật khẩu mới" class="form-input pr-10" />
                        </div>

                        <div class="flex justify-end space-x-3 pt-2">
                            <button type="button" @click="isPasswordModalOpen = false" class="btn-secondary">Hủy</button>
                            <button type="submit" class="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500">Xác nhận đổi</button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    </MainLayout>
</template>

<style scoped>
.form-input {
    @apply mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150;
}
.profile-action-button {
    @apply w-full font-medium py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center;
}
.alert-success {
    @apply text-green-700 p-3 bg-green-50 rounded-lg border border-green-200 text-sm font-medium;
}
.alert-error {
    @apply text-red-600 p-3 bg-red-50 rounded-lg border border-red-200 text-sm font-medium;
}
.btn-primary {
    @apply bg-indigo-600 text-white font-medium py-2 px-5 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}
.btn-secondary {
    @apply bg-white text-gray-700 border border-gray-300 font-medium py-2 px-5 rounded-lg hover:bg-gray-50 transition duration-150;
}
.label {
    @apply block text-sm font-medium text-gray-700 mb-1;
}
.modal-overlay {
    @apply fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4;
}
.modal-content {
    @apply bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl transform transition-all;
}
.pattern-grid {
    background-image: radial-gradient(#ffffff 2px, transparent 2px);
    background-size: 24px 24px;
}
@keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-down {
    animation: fadeInDown 0.3s ease-out;
}
</style>