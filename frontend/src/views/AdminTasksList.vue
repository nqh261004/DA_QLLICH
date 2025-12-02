<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, watch } from 'vue';
import { getTasks, deleteTask } from '@/api/taskService'; 
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; 
import { useAuthStore } from '@/stores/auth';
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    AcademicCapIcon, 
    WrenchScrewdriverIcon, 
    ArchiveBoxXMarkIcon, 
    ClipboardDocumentListIcon, 
    EyeIcon, 
    AdjustmentsHorizontalIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    XMarkIcon,
    CalendarIcon,
    ListBulletIcon
} from '@heroicons/vue/24/outline'; 

import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore(); 

const tasks = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');

const currentPage = ref(1);
const itemsPerPage = 5; 
const currentView = ref<'list' | 'calendar'>('list');

const isConfirmDeleteModalOpen = ref(false);
const taskToDeleteId = ref('');
const taskToDeleteTitle = ref('');

const openDeleteModal = (taskId: string, taskTitle: string) => {
    console.log('Before - taskToDeleteTitle:', taskToDeleteTitle.value);
    taskToDeleteId.value = taskId;
    taskToDeleteTitle.value = taskTitle;
    isConfirmDeleteModalOpen.value = true;
    console.log('After - taskToDeleteTitle:', taskToDeleteTitle.value);
    console.log('After - isConfirmDeleteModalOpen:', isConfirmDeleteModalOpen.value);
};

const handleDeleteTask = async () => {
    const id = taskToDeleteId.value;
    const title = taskToDeleteTitle.value;
    
    isConfirmDeleteModalOpen.value = false; 

    try {
        await deleteTask(id);
        toast.success(`Công việc "${title}" đã được xóa thành công.`);
        
        await fetchTasks();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa công việc.');
        error.value = error.response?.data?.message || 'Có lỗi xảy ra khi xóa công việc.';
    }
}

const calendarOptions = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,listWeek'
    },
    events: [] as any[],
    eventClick: (info: any) => {
        viewTaskDetail(info.event.id);
    },
    locale: 'vi',
    allDayText: 'Hạn chót',
    buttonText: {
        today: 'Hôm nay',
        month: 'Tháng',
        week: 'Tuần',
        day: 'Ngày',
        list: 'Lịch trình'
    },
    height: 'auto',
    dayMaxEvents: true
});

const STATUS_ICONS: { [key: string]: any } = {
    can_lam: ClipboardDocumentListIcon,
    dang_lam: WrenchScrewdriverIcon,
    cho_duyet: AcademicCapIcon,
    phe_duyet: CheckCircleIcon,
    can_sua: ExclamationTriangleIcon,
    bi_huy: ArchiveBoxXMarkIcon,
};

const taskStatuses = [
    { key: 'tat_ca', label: 'Tất cả', icon: AdjustmentsHorizontalIcon },
    { key: 'can_lam', label: 'Cần làm', color: 'text-gray-500', bg: '#6b7280' },
    { key: 'dang_lam', label: 'Đang làm', color: 'text-blue-500', bg: '#3b82f6' },
    { key: 'cho_duyet', label: 'Chờ duyệt', color: 'text-yellow-600', bg: '#ca8a04' },
    { key: 'phe_duyet', label: 'Phê duyệt', color: 'text-green-600', bg: '#16a34a' },
    { key: 'can_sua', label: 'Cần sửa', color: 'text-orange-500', bg: '#f97316' },
    { key: 'bi_huy', label: 'Bị hủy', color: 'text-red-600', bg: '#dc2626' }, 
];

const currentFilter = ref('tat_ca'); 

const getStatusColor = (statusKey: string) => {
    const status = taskStatuses.find(s => s.key === statusKey);
    return status ? status.bg : '#374151';
};

const updateCalendarEvents = () => {
    calendarOptions.value.events = tasks.value.map(task => {
        const assigneeName = task.nguoi_thuc_hien?.ho_ten 
            ? `[${task.nguoi_thuc_hien.ho_ten.split(' ').pop()}] ` 
            : '[Chưa gán] ';
            
        return {
            id: task.id,
            title: `${assigneeName}${task.tieu_de}`, 
            start: task.han_chot,
            allDay: true,
            backgroundColor: getStatusColor(task.trang_thai),
            borderColor: getStatusColor(task.trang_thai),
            textColor: '#ffffff',
            extendedProps: {
                status: task.trang_thai
            }
        }
    });
};

const fetchTasks = async () => {
    isLoading.value = true;
    error.value = '';

    try {
        const params: any = {};
        if (currentFilter.value !== 'tat_ca') {
            params.trang_thai = currentFilter.value.toUpperCase();
        }

        if (currentView.value === 'calendar') {
            params.limit = 1000; 
            params.page = 1;
        } else {
            params.limit = itemsPerPage;
            params.page = currentPage.value;
        }

        const data = await getTasks(params);

        if (currentView.value === 'list' && data.length === 0 && currentPage.value > 1) {
            currentPage.value -= 1;
            await fetchTasks();
            return;
        }

        tasks.value = data;

        if (currentView.value === 'calendar') {
            updateCalendarEvents();
        }
    } catch (err: any) {
        if (!authStore.isManager) {
            error.value = 'Truy cập bị từ chối. Chỉ Quản lý mới có quyền quản lý công việc.';
        } else {
            error.value = err.response?.data?.message || 'Không thể tải danh sách công việc.';
        }
        toast.error(error.value);
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

const taskToActOn = ref<any | null>(null);



const handlePageChange = (newPage: number) => {
    currentPage.value = newPage;
    fetchTasks();
}

watch(currentView, () => {
    currentPage.value = 1;
    fetchTasks();
});

const viewTaskDetail = (id: string) => {
    router.push({ 
        name: 'task-detail', 
        params: { id } ,
        query: { fromAdmin: 'true' }
    });
}

const handleEditDetail = (task: any) => {
    const FINAL_TASK_STATUSES = ['phe_duyet', 'bi_huy'];
    if (FINAL_TASK_STATUSES.includes(task.trang_thai)) {
        toast.error(`Không thể chỉnh sửa công việc đã ${getStatusDisplay(task.trang_thai).label}.`);
        return; 
    }
    router.push({ name: 'admin-edit-task', params: { id: task.id } });
};

// const openDeleteModal = (taskId: string, taskTitle: string) => {
//     taskToDeleteId.value = taskId;
//     taskToDeleteTitle.value = taskTitle;
//     isConfirmDeleteModalOpen.value = true;
// };

// const handleDeleteTask = async () => {
//     const id = taskToDeleteId.value;
//     isConfirmDeleteModalOpen.value = false; 
//     try {
//         await deleteTask(id);
//         toast.success(`Đã xóa công việc thành công.`);
//         await fetchTasks();
//     } catch (error: any) {
//         toast.error('Có lỗi xảy ra khi xóa công việc.');
//     }
// }

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

const getStatusDisplay = (statusKey: string) => {
    const status = taskStatuses.find(s => s.key === statusKey) || { label: '?', color: 'text-gray-400' };
    return {
        label: status.label,
        color: status.color,
        icon: STATUS_ICONS[statusKey],
    }
};

const handleFilterChange = (key: string) => {
    currentFilter.value = key;
    currentPage.value = 1;
    fetchTasks();
}

const handleCreateNewTask = () => {
    router.push({ name: 'admin-new-task' }); 
}

onMounted(fetchTasks);
</script>

<template>
    <MainLayout>
        <div class="space-y-8">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 class="text-3xl font-bold text-gray-800">Quản lý Toàn bộ Công việc</h1>
                
                <div class="bg-white p-1 rounded-lg shadow border flex">
                    <button @click="currentView = 'list'"
                        class="px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors"
                        :class="currentView === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'">
                        <ListBulletIcon class="w-5 h-5 mr-2"/> Danh sách
                    </button>
                    <button @click="currentView = 'calendar'"
                        class="px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors"
                        :class="currentView === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'">
                        <CalendarIcon class="w-5 h-5 mr-2"/> Lịch biểu
                    </button>
                </div>
            </div>

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="p-4 bg-white rounded-lg shadow-md flex space-x-3 overflow-x-auto max-w-full">
                    <button v-for="status in taskStatuses" :key="status.key"
                        @click="handleFilterChange(status.key)"
                        class="filter-button whitespace-nowrap"
                        :class="{'bg-indigo-600 text-white shadow-lg': currentFilter === status.key, 'bg-gray-200 text-gray-700 hover:bg-gray-300': currentFilter !== status.key}">
                        <component :is="getStatusDisplay(status.key).icon" v-if="getStatusDisplay(status.key).icon" class="w-5 h-5 mr-1" />
                        {{ status.label }}
                    </button>
                </div>
                
                <button @click="handleCreateNewTask" class="btn-primary bg-indigo-600 hover:bg-indigo-700 shrink-0">
                    + Tạo Công việc Mới
                </button>
            </div>

            <div class="bg-white p-6 rounded-lg shadow min-h-[600px]">
                <p v-if="error" class="alert-error">{{ error }}</p>
                <p v-if="isLoading" class="text-center py-8 text-lg">Đang tải danh sách công việc...</p>
                
                <div v-else-if="currentView === 'calendar'" class="calendar-wrapper">
                    <FullCalendar :options="calendarOptions" />
                </div>

                <div v-else>
                    <p v-if="tasks.length === 0" class="text-center py-8 text-lg text-gray-500">
                        Không có công việc nào theo bộ lọc hiện tại.
                    </p>
                    
                    <div v-else>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">Tên Công Việc</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thực hiện</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự án</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn chót</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="task in tasks" :key="task.id" 
                                        class="hover:bg-gray-50 transition-colors">
                                        
                                        <td class="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">{{ task.tieu_de }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold text-indigo-600">{{ task.nguoi_thuc_hien?.ho_ten || 'Chưa gán' }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ task.du_an?.ten_du_an || 'N/A' }}</td>
                                        
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                                            :class="{'text-red-500': new Date(task.han_chot) < new Date() && task.trang_thai !== 'phe_duyet'}">
                                            {{ formatDate(task.han_chot) }}
                                        </td>
                                        
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span :class="getStatusDisplay(task.trang_thai).color"
                                                  class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-opacity-10 ring-1 ring-inset ring-gray-500/10 capitalize">
                                                <component :is="getStatusDisplay(task.trang_thai).icon" v-if="getStatusDisplay(task.trang_thai).icon" class="w-4 h-4 mr-1" />
                                                {{ getStatusDisplay(task.trang_thai).label }}
                                            </span>
                                        </td>

                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button @click="handleEditDetail(task)" class="action-icon-btn text-blue-600 hover:text-blue-800" title="Sửa">
                                                <PencilSquareIcon class="w-5 h-5 inline" />
                                            </button>
                                            <button @click="viewTaskDetail(task.id)" class="action-icon-btn text-indigo-600 hover:text-indigo-900" title="Xem">
                                                <EyeIcon class="w-5 h-5 inline" />
                                            </button>
                                            <button @click="openDeleteModal(task.id, task.tieu_de)" class="action-icon-btn text-red-600 hover:text-red-800" title="Xóa">
                                                <TrashIcon class="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="flex justify-between items-center mt-6 p-4 border-t border-gray-100">
                            <p class="text-sm text-gray-600">
                                Hiển thị {{ tasks.length }} công việc (trang {{ currentPage }})
                            </p>
                            <div class="flex space-x-3">
                                <button @click="handlePageChange(currentPage - 1)" :disabled="currentPage === 1" class="btn-secondary">
                                    ← Trang trước
                                </button>
                                <button @click="handlePageChange(currentPage + 1)" :disabled="tasks.length < itemsPerPage" class="btn-secondary">
                                    Trang sau →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
    <div v-if="isConfirmDeleteModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 class="text-xl font-bold text-red-600">Xác nhận Xóa Công việc</h3>
                    <button @click="isConfirmDeleteModalOpen = false" class="text-gray-500 hover:text-gray-700">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>
                
                <p class="text-gray-700 mb-6">
                    Bạn có chắc chắn muốn xóa công việc {{ taskToDeleteTitle }} không? 
                </p>
                
                <div class="flex justify-end space-x-3">
                    <button @click="isConfirmDeleteModalOpen = false" class="btn-secondary">
                        Hủy bỏ
                    </button>
                    <button @click="handleDeleteTask" class="btn-primary bg-red-600 hover:bg-red-700">
                        Xác nhận Xóa
                    </button>
                </div>
            </div>
        </div>
</template>

<style scoped>
.filter-button {
    @apply flex items-center px-4 py-2 border rounded-full font-semibold text-sm transition duration-150;
}
.action-icon-btn {
    @apply transition duration-150 p-1 rounded hover:bg-gray-100;
}
.btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-lg text-sm;
}
.btn-secondary {
    @apply bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg text-sm transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm;
}
.alert-error {
    @apply text-red-500 p-3 bg-red-100 rounded-lg border border-red-300 font-medium;
}

.calendar-wrapper :deep(.fc-toolbar-title) {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
}
.calendar-wrapper :deep(.fc-button-primary) {
    background-color: #4f46e5;
    border-color: #4f46e5;
}
.calendar-wrapper :deep(.fc-button-primary:hover) {
    background-color: #4338ca;
    border-color: #4338ca;
}
.calendar-wrapper :deep(.fc-event) {
    cursor: pointer;
    border: none;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    padding: 2px 4px;
    font-size: 0.85rem;
}
.calendar-wrapper :deep(.fc-day-today) {
    background-color: #e0e7ff !important;
}
</style>