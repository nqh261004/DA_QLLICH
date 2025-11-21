<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
// Import icons cho giao diện
import { HomeIcon, UserGroupIcon, FolderIcon, PlusCircleIcon, UserCircleIcon, ClipboardDocumentListIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/vue/24/outline'; 

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
    authStore.logout();
    router.push({ name: 'login' });
};

// Hàm định dạng vai trò
const formatRole = (role: string | null) => {
    if (role === 'quan_ly') return 'Quản lý';
    if (role === 'nhan_vien') return 'Nhân viên';
    return 'Khách';
}
</script>

<template>
    <div class="flex h-screen bg-gray-100 antialiased">
        
        <aside class="w-64 bg-gray-800 text-white p-4 flex flex-col shadow-xl">
            <h1 class="text-2xl font-bold mb-6 text-indigo-400 border-b border-gray-700 pb-3">QL Lịch biểu</h1>
            <nav class="flex-1 space-y-2">
                
                <router-link to="/" 
                    class="nav-link" 
                    :class="{'bg-indigo-600': $route.path === '/'}">
                    <HomeIcon class="w-5 h-5 mr-3" /> Dashboard
                </router-link>

                <router-link to="/tasks"
                    class="nav-link"
                    :class="{'bg-gray-700': $route.path.startsWith('/tasks')}">
                    <ClipboardDocumentListIcon class="w-5 h-5 mr-3" /> Công việc Của Tôi
                </router-link>

                <template v-if="authStore.isManager">
                    <div class="mt-4 pt-4 border-t border-gray-700">
                        <p class="text-xs font-semibold uppercase text-gray-400 mb-2">Quản Trị Hệ Thống</p>

                        <router-link to="/admin/users"
                            class="nav-link"
                            :class="{'bg-indigo-700': $route.path.startsWith('/admin/users')}">
                            <UserGroupIcon class="w-5 h-5 mr-3" /> Quản lý Người dùng
                        </router-link>

                        <router-link to="/admin/projects"
                            class="nav-link"
                            :class="{'bg-indigo-700': $route.path.startsWith('/admin/projects')}">
                            <FolderIcon class="w-5 h-5 mr-3" /> Quản lý Dự án
                        </router-link>

                        <router-link to="/admin/tasks"
                            class="nav-link"
                            :class="{'bg-indigo-700': $route.path.startsWith('/admin/tasks')}">
                            <ClipboardDocumentListIcon class="w-5 h-5 mr-3" /> Quản lý Công việc
                        </router-link>
                    </div>
                </template>
            </nav>
            
            <div class="mt-auto border-t border-gray-700 pt-4">
                <router-link to="/profile" class="flex items-center py-2 text-sm hover:text-indigo-400 transition">
                    <UserCircleIcon class="w-5 h-5 mr-2" />
                    <span class="font-medium text-gray-300 truncate">Profile: {{ authStore.userName }}</span>
                </router-link>
                <button @click="handleLogout" 
                        class="mt-2 w-full flex items-center justify-center text-left bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded text-sm transition shadow-lg">
                    <ArrowLeftEndOnRectangleIcon class="w-5 h-5 mr-2" /> Đăng Xuất
                </button>
            </div>
        </aside>

        <main class="flex-1 overflow-y-auto">
            <header class="sticky top-0 bg-white p-4 shadow-md flex justify-end items-center z-10">
                <div class="flex items-center space-x-3">
                    <UserCircleIcon class="w-7 h-7 text-gray-500" />
                    <span class="text-base font-medium text-gray-700">
                        {{ authStore.userName }} ({{ formatRole(authStore.userRole) }})
                    </span>
                </div>
            </header>

            <div class="p-6">
                <slot></slot>
            </div>
        </main>
    </div>
</template>

<style scoped>
.nav-link {
    display: flex;
    align-items: center;
    padding: 0.625rem 1rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
}
.nav-link:hover {
    background-color: #374151; /* gray-700 */
    color: #fff;
}
/* Active link styling */
.nav-link.router-link-exact-active {
    background-color: #4f46e5; /* indigo-600 */
    color: white;
}
</style>