<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; 
import { 
    TrashIcon, 
    LockClosedIcon, 
    LockOpenIcon, 
    EyeIcon, 
    XMarkIcon,
    UserGroupIcon,
    UserPlusIcon,
    ShieldCheckIcon,
    BriefcaseIcon
} from '@heroicons/vue/24/outline'; 

const authStore = useAuthStore();
const router = useRouter(); 
const toast = useToast(); 

const currentPage = ref(1);
const itemsPerPage = 5;

const users = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

const userStats = computed(() => {
    return {
        total: users.value.length,
        managers: users.value.filter(u => u.vai_tro === 'quan_ly').length,
        staff: users.value.filter(u => u.vai_tro === 'nhan_vien').length,
        active: users.value.filter(u => u.trang_thai_hoat_dong).length
    };
});

const currentFilter = ref('all');

const filteredUsers = computed(() => {
    let list = users.value;
    if (currentFilter.value !== 'all') {
        list = list.filter(u => u.vai_tro === currentFilter.value);
    }
    const start = (currentPage.value - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => {
    let list = users.value;
    if (currentFilter.value !== 'all') {
        list = list.filter(u => u.vai_tro === currentFilter.value);
    }
    return Math.ceil(list.length / itemsPerPage);
});

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
        const response = await apiClient.get('/nguoi-dung', { params: { limit: 1000 } }); 
        users.value = response.data;
    } catch (err: any) {
        error.value = 'Không thể tải danh sách người dùng.';
    } finally {
        isLoading.value = false;
    }
};

const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages.value) return;
    currentPage.value = newPage;
}

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
    }
};

const viewUserDetail = (userId: string) => {
    router.push({ name: 'admin-user-detail', params: { id: userId } }); 
};

onMounted(() => {
    if (authStore.isManager) {
        fetchUsers();
    }
});

const formatRole = (role: string) => {
    return role === 'quan_ly' ? 'Quản lý' : 'Nhân viên';
};

const getUserInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').slice(-2).toUpperCase();
};
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <h1 class="text-3xl font-bold text-gray-800 flex items-center">
                <UserGroupIcon class="w-8 h-8 mr-3 text-indigo-600"/> Quản lý Nhân sự
            </h1>
            
            <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>
            <p v-if="error" class="alert-error">{{ error }}</p>

            <div v-if="!authStore.isManager" class="mt-6">
                <p class="text-xl text-red-600 p-6 bg-red-100 rounded-lg border border-red-200">
                    <LockClosedIcon class="w-6 h-6 inline mr-2"/>
                    Truy cập bị từ chối. Chỉ Quản lý mới có quyền xem danh sách người dùng.
                </p>
            </div>
            
            <div v-else class="space-y-6">
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="stat-card border-l-4 border-indigo-500">
                        <div class="text-gray-500 text-xs font-bold uppercase">Tổng nhân sự</div>
                        <div class="text-2xl font-bold text-gray-800 mt-1">{{ userStats.total }}</div>
                    </div>
                    <div class="stat-card border-l-4 border-purple-500">
                        <div class="text-purple-600 text-xs font-bold uppercase">Quản lý</div>
                        <div class="text-2xl font-bold text-gray-800 mt-1">{{ userStats.managers }}</div>
                    </div>
                    <div class="stat-card border-l-4 border-blue-500">
                        <div class="text-blue-600 text-xs font-bold uppercase">Nhân viên</div>
                        <div class="text-2xl font-bold text-gray-800 mt-1">{{ userStats.staff }}</div>
                    </div>
                    <div class="stat-card border-l-4 border-green-500">
                        <div class="text-green-600 text-xs font-bold uppercase">Đang hoạt động</div>
                        <div class="text-2xl font-bold text-gray-800 mt-1">{{ userStats.active }}</div>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    
                    <div class="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                        <button @click="currentFilter = 'all'; currentPage = 1" 
                            class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                            :class="currentFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
                            Tất cả
                        </button>
                        <button @click="currentFilter = 'quan_ly'; currentPage = 1" 
                            class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                            :class="currentFilter === 'quan_ly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
                            Quản lý
                        </button>
                        <button @click="currentFilter = 'nhan_vien'; currentPage = 1" 
                            class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                            :class="currentFilter === 'nhan_vien' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
                            Nhân viên
                        </button>
                    </div>

                    <router-link :to="{ name: 'admin-create-user' }" class="btn-primary flex items-center">
                        <UserPlusIcon class="w-5 h-5 mr-2"/> Thêm Nhân sự
                    </router-link>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <p v-if="isLoading" class="p-8 text-center text-gray-500">Đang tải dữ liệu...</p>
                    
                    <div v-else>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 transition-colors">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10">
                                                    <div class="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                        {{ getUserInitials(user.ho_ten) }}
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">{{ user.ho_ten }}</div>
                                                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center"
                                                :class="user.vai_tro === 'quan_ly' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'">
                                                <component :is="user.vai_tro === 'quan_ly' ? ShieldCheckIcon : BriefcaseIcon" class="w-3 h-3 mr-1"/>
                                                {{ formatRole(user.vai_tro) }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span :class="{'bg-green-100 text-green-800': user.trang_thai_hoat_dong, 'bg-red-100 text-red-800': !user.trang_thai_hoat_dong}"
                                                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center">
                                                <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="user.trang_thai_hoat_dong ? 'bg-green-600' : 'bg-red-600'"></span>
                                                {{ user.trang_thai_hoat_dong ? 'Hoạt động' : 'Vô hiệu' }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button @click="viewUserDetail(user.id)" class="action-icon-btn text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                                                <EyeIcon class="w-5 h-5" />
                                            </button>
                                            <button @click="toggleStatus(user)"
                                                    :class="user.trang_thai_hoat_dong ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'"
                                                    class="action-icon-btn"
                                                    :title="user.trang_thai_hoat_dong ? 'Khóa tài khoản' : 'Mở khóa tài khoản'">
                                                <component :is="user.trang_thai_hoat_dong ? LockClosedIcon : LockOpenIcon" class="w-5 h-5" />
                                            </button>
                                            <button @click="openDeleteModal(user)" class="action-icon-btn text-red-600 hover:text-red-800" title="Xóa vĩnh viễn">
                                                <TrashIcon class="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                            <p class="text-sm text-gray-600">
                                Hiển thị {{ filteredUsers.length }} tài khoản (Trang {{ currentPage }})
                            </p>
                            <div class="flex space-x-2">
                                <button @click="handlePageChange(currentPage - 1)" 
                                        :disabled="currentPage === 1" 
                                        class="btn-secondary">
                                    ← Trang trước
                                </button>
                                <button @click="handlePageChange(currentPage + 1)" 
                                        :disabled="currentPage >= totalPages" 
                                        class="btn-secondary">
                                    Trang sau →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-if="isDeleteModalOpen && userToDelete" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div class="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                    <div class="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 class="text-xl font-bold text-red-600 flex items-center">
                            <TrashIcon class="w-6 h-6 mr-2"/> Xóa Tài khoản
                        </h3>
                        <button @click="isDeleteModalOpen = false" class="text-gray-400 hover:text-gray-600 transition">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>
                    
                    <p class="text-gray-600 mb-6">
                        Bạn có chắc chắn muốn xóa tài khoản <strong>{{ userToDelete.ho_ten }}</strong> ({{ userToDelete.email }})?
                        <br><span class="text-red-500 text-sm mt-1 block">Hành động này không thể hoàn tác!</span>
                    </p>
                    
                    <div class="flex justify-end space-x-3">
                        <button @click="isDeleteModalOpen = false" class="btn-secondary">Hủy bỏ</button>
                        <button @click="deleteUser" class="btn-primary bg-red-600 hover:bg-red-700 border-none shadow-red-200">Xác nhận Xóa</button>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
.btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md text-sm transition duration-150;
}
.btn-secondary {
    @apply bg-white border border-gray-300 text-gray-700 font-medium py-1.5 px-4 rounded-lg text-sm hover:bg-gray-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm;
}
.alert-error {
    @apply text-red-600 p-4 bg-red-50 rounded-lg border border-red-200 font-medium text-center;
}
.alert-success {
    @apply text-green-700 p-4 bg-green-50 rounded-lg border border-green-200 font-medium text-center;
}
.action-icon-btn {
    @apply transition duration-150 p-1.5 rounded-full hover:bg-gray-100;
}
.stat-card {
    @apply bg-white p-5 rounded-xl shadow-sm border border-gray-100;
}
</style>