<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { 
    HomeIcon, 
    UserGroupIcon, 
    FolderIcon, 
    UserCircleIcon, 
    ClipboardDocumentListIcon, 
    ArrowLeftEndOnRectangleIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/vue/24/outline'; 

const authStore = useAuthStore();
const router = useRouter();
const isSidebarOpen = ref(false); // Cho mobile menu

const handleLogout = () => {
    authStore.logout();
    router.push({ name: 'login' });
};

const formatRole = (role: string | null) => {
    if (role === 'quan_ly') return 'Quản lý';
    if (role === 'nhan_vien') return 'Nhân viên';
    return 'Khách';
}

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
}
</script>

<template>
    <div class="flex h-screen bg-gray-50 antialiased font-sans">
        
        <div v-if="isSidebarOpen" @click="toggleSidebar" class="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity"></div>

        <aside :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
               class="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:inset-auto">
            
            <div class="flex items-center justify-between h-16 px-6 bg-slate-950 shadow-md">
                <h1 class="text-xl font-extrabold tracking-wider text-indigo-400">QUẢN LÝ LỊCH</h1>
                <button @click="toggleSidebar" class="lg:hidden text-gray-400 hover:text-white">
                    <XMarkIcon class="w-6 h-6"/>
                </button>
            </div>

            <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                
                <router-link to="/" class="nav-link" :class="{'active-link': $route.path === '/'}">
                    <HomeIcon class="nav-icon" /> Dashboard
                </router-link>

                <router-link to="/tasks" class="nav-link" :class="{'active-link': $route.path.startsWith('/tasks')}">
                    <ClipboardDocumentListIcon class="nav-icon" /> Công việc Của Tôi
                </router-link>

                <template v-if="authStore.isManager">
                    <div class="mt-8 mb-2 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Quản Trị Hệ Thống
                    </div>

                    <router-link to="/admin/users" class="nav-link" :class="{'active-link': $route.path.startsWith('/admin/users')}">
                        <UserGroupIcon class="nav-icon" /> Quản lý Nhân sự
                    </router-link>

                    <router-link to="/admin/projects" class="nav-link" :class="{'active-link': $route.path.startsWith('/admin/projects')}">
                        <FolderIcon class="nav-icon" /> Quản lý Dự án
                    </router-link>

                    <router-link to="/admin/tasks" class="nav-link" :class="{'active-link': $route.path.startsWith('/admin/tasks')}">
                        <ClipboardDocumentListIcon class="nav-icon" /> Quản lý Công việc
                    </router-link>
                </template>
            </nav>
            
            <div class="p-4 bg-slate-950 border-t border-slate-800">
                <router-link to="/profile" class="flex items-center p-2 mb-3 rounded-lg hover:bg-slate-800 transition group">
                    <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-3 shadow-lg">
                        {{ authStore.userName?.charAt(0) || 'U' }}
                    </div>
                    <div class="overflow-hidden">
                        <p class="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition">{{ authStore.userName }}</p>
                        <p class="text-xs text-slate-400 truncate">{{ formatRole(authStore.userRole) }}</p>
                    </div>
                </router-link>
                
                <button @click="handleLogout" 
                        class="w-full flex items-center justify-center bg-red-600/90 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition shadow-md hover:shadow-lg">
                    <ArrowLeftEndOnRectangleIcon class="w-5 h-5 mr-2" /> Đăng Xuất
                </button>
            </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden h-screen">
            <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
                <button @click="toggleSidebar" class="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100">
                    <Bars3Icon class="w-6 h-6"/>
                </button>

                <div class="flex items-center ml-auto space-x-4">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-medium text-gray-800">{{ authStore.userName }}</p>
                        <p class="text-xs text-gray-500">{{ formatRole(authStore.userRole) }}</p>
                    </div>
                    <router-link to="/profile" class="relative block">
                        <UserCircleIcon class="w-9 h-9 text-gray-400 hover:text-indigo-600 transition cursor-pointer" />
                        <span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400"></span>
                    </router-link>
                </div>
            </header>

            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8">
                <transition name="fade" mode="out-in">
                    <slot></slot>
                </transition>
            </main>
        </div>
    </div>
</template>

<style scoped>
.nav-link {
    @apply flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 mb-1;
}
.active-link {
    @apply bg-indigo-600 text-white shadow-md hover:bg-indigo-700;
}
.nav-icon {
    @apply w-5 h-5 mr-3 opacity-75;
}
.active-link .nav-icon {
    @apply opacity-100;
}

/* Hiệu ứng chuyển trang mượt mà */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>