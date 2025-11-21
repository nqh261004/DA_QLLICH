// frontend/src/router/index.ts (CODE ĐÃ SỬA FINAL)
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Import Views
import Login from '@/views/Login.vue';
import Dashboard from '@/views/Dashboard.vue';
import TasksList from '@/views/TasksList.vue';
import UserProfile from '@/views/UserProfile.vue';
import AdminUsers from '@/views/AdminUsers.vue';
import AdminProjects from '@/views/AdminProjects.vue';
import TaskDetail from '@/views/TaskDetail.vue'; 
import AdminCreateTask from '@/views/AdminCreateTask.vue';
import AdminCreateUser from '@/views/AdminCreateUser.vue';
import AdminCreateProject from '@/views/AdminCreateProject.vue';
import AdminEditProject from '@/views/AdminEditProject.vue';
import AdminTasksList from '@/views/AdminTasksList.vue';
import AdminEditTask from '@/views/AdminEditTask.vue';
import AdminProjectDetail from '@/views/AdminProjectDetail.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { requiresAuth: false } },
    { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    
    // Chung cho QL & NV
    { path: '/profile', name: 'profile', component: UserProfile, meta: { requiresAuth: true } },
    { path: '/tasks', name: 'tasks-list', component: TasksList, meta: { requiresAuth: true } },
    
    // ĐÃ SỬA: Dùng TaskDetail.vue cho route chi tiết
    { path: '/tasks/:id', name: 'task-detail', component: TaskDetail, meta: { requiresAuth: true } }, 
    
    // Routes Admin (Chỉ QL)
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsers,
      meta: { requiresAuth: true, role: 'quan_ly' },
    },
    
    {
      path: '/admin/users/new', 
      name: 'admin-create-user',
      component: AdminCreateUser, // Sử dụng Component Form Tạo Tài khoản
      meta: { requiresAuth: true, role: 'quan_ly' },
    },

    {
      path: '/admin/user-detail/:id',
      name: 'admin-user-detail',
      component: UserProfile, // Dùng lại Component Profile
      meta: { requiresAuth: true, role: 'quan_ly' },
    },
    
    {
      path: '/admin/projects',
      name: 'admin-projects',
      component: AdminProjects,
      meta: { requiresAuth: true, role: 'quan_ly' },
    },

    {
      path: '/admin/projects/:id/details', 
      name: 'admin-project-detail',
      component: AdminProjectDetail, // SỬ DỤNG COMPONENT ĐÃ TẠO
      meta: { requiresAuth: true, role: 'quan_ly' },
      props: true, // Cho phép truyền ID qua props nếu cần
    },

    {
      path: '/admin/projects/:id/edit',
      name: 'admin-edit-project',
      component: AdminEditProject,
      meta: { requiresAuth: true, role: 'quan_ly' },
    },

    {
      path: '/admin/projects/new',
      name: 'admin-create-project',
      component: AdminCreateProject,
      meta: { requiresAuth: true, role: 'quan_ly' },
    },

    {
      path: '/admin/tasks/new',
      name: 'admin-new-task',
      component: AdminCreateTask, 
      meta: { requiresAuth: true, role: 'quan_ly' },
    },

    {
      path: '/admin/tasks', 
      name: 'admin-tasks-list', 
      component: AdminTasksList,
      meta: { requiresAuth: true, role: 'quan_ly' },
    },

    {
      path: '/tasks/:id/edit',
      name: 'admin-edit-task',
      component: AdminEditTask,
      meta: { requiresAuth: true, role: 'quan_ly' },
    },
  ],
});

// Navigation Guard: Bảo vệ các tuyến đường
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 1. Kiểm tra Xác thực (Authentication)
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  // 2. Kiểm tra Phân quyền (Authorization - RBAC)
  if (to.meta.role && authStore.userRole !== to.meta.role) {
    // Nếu không đủ quyền, chuyển hướng về dashboard
    return next({ name: 'dashboard' }); 
  }

  next();
});

export default router;