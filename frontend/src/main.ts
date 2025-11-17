import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { type PluginOptions } from 'vue-toastification' 
import "vue-toastification/dist/index.css";

import './style.css' 

import App from './App.vue'
import router from './router'

const app = createApp(App)
const toastOptions: PluginOptions = {};

app.use(createPinia())
app.use(router)
app.use(Toast, toastOptions);

app.mount('#app')