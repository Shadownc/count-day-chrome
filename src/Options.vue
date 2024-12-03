<template>
    <el-config-provider :locale="locale">
        <div class="page-container">
            <div class="popup-card">
                <div class="content-wrapper">
                    <div class="section-title">自定义设置</div>

                    <div class="setting-section">
                        <div class="setting-header">发薪日设置</div>
                        <el-input-number v-model="payday" :min="1" :max="31" size="large" controls-position="right"
                            class="payday-input" placeholder="每月发薪日期" />
                    </div>

                    <div class="setting-section">
                        <div class="setting-header">生日提醒</div>
                        <div class="birthday-list">
                            <div v-for="(birthday, index) in birthdays" :key="index" class="birthday-item">
                                <el-input v-model="birthday.name" placeholder="姓名" size="large" class="name-input" />
                                <el-date-picker v-model="birthday.date" type="date" placeholder="选择日期"
                                    format="YYYY年MM月DD日" value-format="YYYY-MM-DD" size="large" :locale="zhCn" />
                                <el-button type="danger" size="large" @click="removeBirthday(index)">
                                    删除
                                </el-button>
                            </div>
                        </div>
                        <el-button type="primary" size="large" class="add-btn" @click="addBirthday">
                            添加生日提醒
                        </el-button>
                    </div>

                    <el-button type="primary" size="large" class="save-btn" @click="saveSettings">
                        保存设置
                    </el-button>
                </div>
            </div>
        </div>
    </el-config-provider>

</template>

<script>
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
export default {
    data() {
        return {
            locale: zhCn,
            payday: 1,
            birthdays: []
        };
    },
    methods: {
        addBirthday() {
            this.birthdays.push({ name: '', date: '' });
        },
        removeBirthday(index) {
            this.birthdays.splice(index, 1);
        },
        saveSettings() {
            // 过滤掉没填完整的生日提醒
            const settings = {
                payday: this.payday,
                birthdays: this.birthdays.filter(b => b.name && b.date)
            };

            chrome.storage.sync.set(settings, () => {
                ElMessage({
                    message: '设置已保存',
                    type: 'success'
                })
            });
        }
    },
    mounted() {
        // 从 chrome.storage 加载设置
        chrome.storage.sync.get(['payday', 'birthdays'], (result) => {
            if (result.payday) {
                this.payday = result.payday;
            }
            if (result.birthdays) {
                this.birthdays = result.birthdays;
            }
        });
    }
};
</script>

<style>
body {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
}
</style>

<style scoped>
.page-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
    position: relative;
    overflow: hidden;
}

.popup-card {
    width: 480px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border-radius: 20px;
    padding: 28px;
    box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.05),
        0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}

.content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.section-title {
    font-size: 22px;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    margin-bottom: 12px;
    background: linear-gradient(to right, #6366f1, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.setting-section {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 16px;
    padding: 20px;
    box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.03),
        0 0 0 1px rgba(255, 255, 255, 0.9) inset;
    backdrop-filter: blur(8px);
}

.setting-header {
    font-size: 16px;
    color: #1e293b;
    margin-bottom: 12px;
}

.birthday-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
}

.birthday-item {
    display: grid;
    grid-template-columns: 100px 1fr 80px;
    gap: 12px;
    align-items: center;
    background: rgba(255, 255, 255, 0.9);
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    transition: all 0.2s ease;
}

.birthday-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.add-btn {
    width: 100%;
    height: 40px;
}

.save-btn {
    width: 100%;
    height: 40px;
    margin-top: 8px;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.1;
    }

    50% {
        opacity: 0.2;
    }
}

:deep(.el-input-number) {
    width: 100%;
}

:deep(.el-button--primary) {
    background: linear-gradient(to right, #6366f1, #818cf8);
    border: none;
    transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
    background: linear-gradient(to right, #818cf8, #6366f1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

:deep(.el-button--danger) {
    background: linear-gradient(to right, #ef4444, #f87171);
    border: none;
    transition: all 0.3s ease;
}

:deep(.el-button--danger:hover) {
    background: linear-gradient(to right, #f87171, #ef4444);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

:deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.1) inset !important;
    background: rgba(255, 255, 255, 0.9);
    transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3) inset !important;
}

:deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.5) inset !important;
}

:deep(.el-date-editor.el-input) {
    width: 100%;
}
</style>