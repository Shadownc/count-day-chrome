import { createApp } from 'vue'
import Options from '../src/Options.vue'
import { ElConfigProvider } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const app = createApp(Options)

app.component(ElConfigProvider.name, ElConfigProvider)

app.mount('#app')