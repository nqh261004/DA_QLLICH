<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue';
import { ref, onMounted, watch } from 'vue';
import { getTasks } from '@/api/taskService';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification";
import {
    CalendarIcon,
    ListBulletIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    AcademicCapIcon,
    WrenchScrewdriverIcon,
    ArchiveBoxXMarkIcon,
    ClipboardDocumentListIcon,
    EyeIcon
} from '@heroicons/vue/24/outline';

// --- FullCalendar Imports ---
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const router = useRouter();
const toast = useToast();

const tasks = ref<any[]>([]);
const isLoading = ref(true);
const error = ref('');
const currentView = ref<'list' | 'calendar'>('list'); 

const currentPage = ref(1);
const itemsPerPage = 5;

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
    allDayText: '', 
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

const taskStatuses = [
    { key: 'tat_ca', label: 'Tất cả', icon: null },
    { key: 'can_lam', label: 'Cần làm', color: 'text-gray-500', bg: '#6b7280', icon: ClipboardDocumentListIcon },
    { key: 'dang_lam', label: 'Đang làm', color: 'text-blue-500', bg: '#3b82f6', icon: WrenchScrewdriverIcon },
    { key: 'cho_duyet', label: 'Chờ duyệt', color: 'text-yellow-600', bg: '#ca8a04', icon: AcademicCapIcon },
    { key: 'phe_duyet', label: 'Phê duyệt', color: 'text-green-600', bg: '#16a34a', icon: CheckCircleIcon },
    { key: 'can_sua', label: 'Cần sửa', color: 'text-orange-500', bg: '#f97316', icon: ExclamationTriangleIcon },
    { key: 'bi_huy', label: 'Bị hủy', color: 'text-red-600', bg: '#dc2626', icon: ArchiveBoxXMarkIcon },
];

const currentFilter = ref('tat_ca');

const getStatusColor = (statusKey: string) => {
    const status = taskStatuses.find(s => s.key === statusKey);
    return status ? status.bg : '#374151';
};

const updateCalendarEvents = () => {
    calendarOptions.value.events = tasks.value.map(task => ({
        id: task.id,
        title: task.tieu_de,
        start: task.han_chot,
        
        allDay: true, 
        
        backgroundColor: getStatusColor(task.trang_thai),
        borderColor: getStatusColor(task.trang_thai),
        textColor: '#ffffff',
        extendedProps: {
            status: task.trang_thai
        }
    }));
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
        toast.error(error.value);
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

const handlePageChange = (newPage: number) => {
    currentPage.value = newPage;
    fetchTasks();
};

watch(currentView, () => {
    currentPage.value = 1;
    fetchTasks();
});

const viewTaskDetail = (id: string) => {
    router.push({ name: 'task-detail', params: { id } });
};

const handleFilterChange = (key: string) => {
    currentFilter.value = key;
    currentPage.value = 1; 
    fetchTasks();
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

const getStatusDisplay = (statusKey: string) => {
    const status = taskStatuses.find(s => s.key === statusKey) || { label: '?', color: 'text-gray-400', icon: null };
    return { label: status.label, color: status.color, icon: status.icon };
};

onMounted(fetchTasks);
</script>

<template>
<MainLayout>
    <div class="space-y-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 class="text-3xl font-bold text-gray-800">Quản lý Công việc</h1>
            
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

        <div class="p-4 bg-white rounded-lg shadow-md flex space-x-3 overflow-x-auto">
            <button v-for="status in taskStatuses" :key="status.key"
                @click="handleFilterChange(status.key)"
                class="filter-button whitespace-nowrap"
                :class="{'bg-indigo-600 text-white shadow-lg': currentFilter === status.key, 'bg-gray-100 text-gray-700 hover:bg-gray-200': currentFilter !== status.key}">
                
                <component :is="status.icon" v-if="status.icon" class="w-5 h-5 mr-1" />
                
                {{ status.label }}
            </button>
        </div>

        <div class="bg-white p-6 rounded-lg shadow min-h-[600px]">
            <p v-if="isLoading" class="text-center py-10">Đang tải dữ liệu...</p>

            <div v-else-if="currentView === 'calendar'" class="calendar-wrapper">
                <FullCalendar :options="calendarOptions" />
            </div>

            <div v-else>
                <p v-if="tasks.length === 0" class="text-center py-8 text-gray-500">Không có công việc nào.</p>
                
                <div v-else>
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">Tên Công Việc</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự án</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn chót</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="task in tasks" :key="task.id" class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 font-medium text-gray-900">{{ task.tieu_de }}</td>
                                <td class="px-6 py-4 text-sm text-gray-500">{{ task.du_an?.ten_du_an || 'N/A' }}</td>
                                <td class="px-6 py-4 text-sm font-semibold" :class="{'text-red-500': new Date(task.han_chot) < new Date() && task.trang_thai !== 'phe_duyet'}">
                                    {{ formatDate(task.han_chot) }}
                                </td>
                                <td class="px-6 py-4">
                                    <span :class="getStatusDisplay(task.trang_thai).color" class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-opacity-10 ring-1 ring-inset ring-gray-500/10 capitalize">
                                        <component :is="getStatusDisplay(task.trang_thai).icon" class="w-4 h-4 mr-1" />
                                        {{ getStatusDisplay(task.trang_thai).label }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button @click="viewTaskDetail(task.id)" class="text-indigo-600 hover:text-indigo-900 font-bold p-2 rounded hover:bg-indigo-50">
                                        <EyeIcon class="w-5 h-5"/>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="flex justify-between items-center mt-6 p-4 border-t border-gray-100">
                        <p class="text-sm text-gray-600">
                            Hiển thị {{ tasks.length }} công việc (Trang {{ currentPage }})
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
                                :disabled="tasks.length < itemsPerPage" 
                                class="btn-secondary">
                                Trang sau →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</MainLayout>
</template>

<style scoped>
.filter-button {
    @apply flex items-center px-4 py-2 border rounded-full font-semibold text-sm transition duration-150;
}

.btn-secondary {
    @apply bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg text-sm transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm;
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