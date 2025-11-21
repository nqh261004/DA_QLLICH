<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; 
import { TrashIcon, LockClosedIcon, LockOpenIcon, EyeIcon, XMarkIcon } from '@heroicons/vue/24/outline'; 

const authStore = useAuthStore();
const router = useRouter(); 
const toast = useToast(); 

const currentPage = ref(1);
const itemsPerPage = 5;

const users = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

const isDeleteModalOpen = ref(false); 
const userToDelete = ref<any>(null); 
const successMessage = ref('');

interface User {
    id: string;
    ho_ten: string;
    email: string;
    vai_tro: 'quan_ly' | 'nhan_vien';
    trang_thai_hoat_dong: boolean;
}

const fetchUsers = async () => {
    try {
        error.value = '';

        const params = {
            page: currentPage.value,
            limit: itemsPerPage,
        };
        
        const response = await apiClient.get('/nguoi-dung', { params }); 

        if (response.data.length === 0 && currentPage.value > 1) {
            currentPage.value -= 1;
            await fetchUsers(); 
            return;
        }

        users.value = response.data;
    } catch (err: any) {
        // ... (Xử lý lỗi truy cập và phân quyền giữ nguyên) ...
    } finally {
        isLoading.value = false;
    }
};

// 🔥 HÀM MỚI: XỬ LÝ CHUYỂN TRANG
const handlePageChange = (newPage: number) => {
    currentPage.value = newPage;
    fetchUsers();
}

// --- LOGIC: THAY ĐỔI TRẠNG THÁI ---
const toggleStatus = async (user: User) => {
    const newStatus = !user.trang_thai_hoat_dong;
    error.value = ''; 
    successMessage.value = '';

    if (user.id === authStore.userId) { 
        toast.error('Không thể tự vô hiệu hóa tài khoản của bạn.'); 
        return;
    }

    try {
        await apiClient.patch(`/nguoi-dung/${user.id}`, { trang_thai_hoat_dong: newStatus });

        user.trang_thai_hoat_dong = newStatus;
        toast.success(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${user.ho_ten}.`); 

    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại.'); 
        error.value = err.response?.data?.message || 'Cập nhật trạng thái thất bại.';
    }
};

const openDeleteModal = (user: User) => {
    error.value = '';
    successMessage.value = '';

    if (user.id === authStore.userId) {
        toast.error('Không thể tự xóa tài khoản của bạn.');
        return;
    }
    userToDelete.value = user;
    isDeleteModalOpen.value = true;
};

// --- LOGIC: XÓA TÀI KHOẢN ---
const deleteUser = async () => {
    if (!userToDelete.value) return; 

    try {
        await apiClient.delete(`/nguoi-dung/${userToDelete.value.id}`);
        users.value = users.value.filter(u => u.id !== userToDelete.value.id);
        
        toast.success(`Đã xóa tài khoản ${userToDelete.value.ho_ten} thành công.`);

        isDeleteModalOpen.value = false; 
        userToDelete.value = null;

    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Xóa tài khoản thất bại.');
        error.value = err.response?.data?.message || 'Xóa tài khoản thất bại.';
    }
};

// --- HÀM CHUYỂN HƯỚNG XEM CHI TIẾT ---
const viewUserDetail = (userId: string) => {
    router.push(`/admin/user-detail/${userId}`); 
};


onMounted(() => {
    if (authStore.isManager) {
        fetchUsers();
    }
});

const formatRole = (role: string) => {
    return role === 'quan_ly' ? 'Quản lý' : 'Nhân viên';
};
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800">Quản lý Tài khoản</h1>
            
            <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>
            <p v-if="error" class="alert-error">{{ error }}</p>

            <div v-if="!authStore.isManager" class="mt-6">
                <p class="text-xl text-red-600 p-6 bg-red-100 rounded-lg">
                    Truy cập bị từ chối. Chỉ Quản lý mới có quyền xem danh sách người dùng.
                </p>
            </div>
            
            <div v-else class="mt-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-medium">Danh sách Nhân sự</h3>
                    <router-link :to="{ name: 'admin-create-user' }" class="btn-primary">
                        + Tạo Tài khoản Mới
                    </router-link>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow">
                    <p v-if="isLoading">Đang tải...</p>
                    
                    <table v-else class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ Tên</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="user in users" :key="user.id">
                                <td class="px-6 py-4 whitespace-nowrap">{{ user.ho_ten }}</td>
                                <td class="px-6 py-4 whitespace-nowrap">{{ user.email }}</td>
                                <td class="px-6 py-4 whitespace-nowrap capitalize">{{ formatRole(user.vai_tro) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="{'bg-green-100 text-green-800': user.trang_thai_hoat_dong, 'bg-red-100 text-red-800': !user.trang_thai_hoat_dong}"
                                          class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                        {{ user.trang_thai_hoat_dong ? 'Hoạt động' : 'Vô hiệu' }}
                                    </span>
                                </td>
                                
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    
                                    <button @click="viewUserDetail(user.id)"
                                            class="action-icon-btn text-blue-600 hover:text-blue-800"
                                            title="Xem chi tiết tài khoản">
                                        <EyeIcon class="w-5 h-5 inline" />
                                    </button>
                                    
                                    <button @click="toggleStatus(user)"
                                            :class="{'text-yellow-600 hover:text-yellow-800': user.trang_thai_hoat_dong, 'text-green-600 hover:text-green-800': !user.trang_thai_hoat_dong}"
                                            class="action-icon-btn"
                                            :title="user.trang_thai_hoat_dong ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'">
                                        <LockClosedIcon v-if="user.trang_thai_hoat_dong" class="w-5 h-5 inline" />
                                        <LockOpenIcon v-else class="w-5 h-5 inline" />
                                    </button>
                                    
                                    <button @click="openDeleteModal(user)"
                                            class="action-icon-btn text-red-600 hover:text-red-800"
                                            title="Xóa tài khoản">
                                        <TrashIcon class="w-5 h-5 inline" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="flex justify-between items-center mt-6 p-4 bg-white rounded-lg shadow">
                <p class="text-sm text-gray-600">
                    Hiển thị {{ users.length }} tài khoản (Trang {{ currentPage }})
                </p>
                <div class="flex space-x-3">
                    <button 
                    @click="handlePageChange(currentPage - 1)" 
                    :disabled="currentPage === 1"
                    class="btn-secondary">
                    ← Trang trước
                </button>
                <button 
                    @click="handlePageChange(currentPage + 1)" 
                    :disabled="users.length < itemsPerPage" 
                    class="btn-secondary">
                    Trang sau →
                </button>
                </div>
            </div>
            </div>
        </div>
        
        <div v-if="isDeleteModalOpen && userToDelete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 class="text-xl font-bold text-red-600">Xác nhận Xóa Tài khoản</h3>
                    <button @click="isDeleteModalOpen = false" class="text-gray-500 hover:text-gray-700">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>
                
                <p class="text-gray-700 mb-6">
                    Bạn có chắc chắn muốn xóa tài khoản: {{ userToDelete.email }}
                </p>
                
                <div class="flex justify-end space-x-3">
                    <button @click="isDeleteModalOpen = false" class="btn-secondary">
                        Hủy bỏ
                    </button>
                    <button @click="deleteUser" class="btn-primary bg-red-600 hover:bg-red-700">
                        Xác nhận Xóa
                    </button>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-lg text-sm;
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
.action-icon-btn {
    @apply transition duration-150 p-1 rounded hover:bg-gray-200;
}
</style>