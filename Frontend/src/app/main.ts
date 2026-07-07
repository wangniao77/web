import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'
import '@/styles/screen.scss'
import '@kjgl77/datav-vue3/dist/style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
