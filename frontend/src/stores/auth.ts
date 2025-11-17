// frontend/src/stores/auth.ts (CODE ĐÃ SỬA FINAL)
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  // Trạng thái được lưu trong Local Storage
  const token = ref(localStorage.getItem('access_token') || null);
  const userId = ref(localStorage.getItem('user_id') || null);
  const userRole = ref(localStorage.getItem('user_role') || null);
  const userName = ref(localStorage.getItem('user_name') || 'Người dùng');
  // 🔔 THÊM MỚI: userPhongBanId
  const userPhongBanId = ref(localStorage.getItem('user_phongban_id') || null); 
  
  const isAuthenticated = computed(() => !!token.value);
  const isManager = computed(() => userRole.value === 'quan_ly');

  // Cập nhật hàm setAuth để nhận và lưu userPhongBanId
  function setAuth(accessToken: string, id: string, role: string, name: string, phongBanId: string | null = null) {
    token.value = accessToken;
    userId.value = id;
    userRole.value = role;
    userName.value = name;
    userPhongBanId.value = phongBanId; // <-- LƯU TRẠNG THÁI
    
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user_id', id);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', name);
    if (phongBanId) {
        localStorage.setItem('user_phongban_id', phongBanId); // <-- LƯU VÀO LOCAL STORAGE
    } else {
        localStorage.removeItem('user_phongban_id');
    }
  }

  function logout() {
    token.value = null;
    userId.value = null;
    userRole.value = null;
    userName.value = 'Người dùng';
    userPhongBanId.value = null; // <-- XÓA TRẠNG THÁI
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_phongban_id'); // <-- XÓA TRONG LOCAL STORAGE
  }

  // 🔔 TRẢ VỀ: userPhongBanId
  return { token, userId, userRole, userName, userPhongBanId, isAuthenticated, isManager, setAuth, logout };
});