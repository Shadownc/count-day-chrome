<template>
  <div class="popup-card">
    <div class="decoration-layer">
      <div class="deco-circle circle-1"></div>
      <div class="deco-circle circle-2"></div>
      <div class="deco-line line-1"></div>
      <div class="deco-line line-2"></div>
    </div>
    
    <div class="card-header">
      <div class="today-info">
        <div class="date-row">
          <span class="current-date">{{ formatFullDate(new Date()) }}</span>
          <span class="week-info">{{ getWeekInfo() }}</span>
        </div>
        <div class="lunar-row">
          {{ getLunarInfo(new Date()) }}
        </div>
      </div>
      <div class="time-row">
        {{ currentTime }}
      </div>
    </div>
    
    <div class="content-wrapper">
      <div class="section-title">即将到来</div>
      <div class="countdown-section">
        <div v-for="(item, index) in countdownItems" 
             :key="`countdown-${index}`"
             class="countdown-item"
             :class="{ 'custom-countdown': item.type === 'custom' }">
          <div class="item-header">
            <div class="left-info">
              <span class="name">距离{{ item.name }}</span>
              <span class="lunar-date">{{ getLunarInfo(item.targetDate) }}</span>
            </div>
            <span class="target-date">{{ formatDate(item.targetDate) }}</span>
          </div>
          <div class="countdown-info">
            <div v-if="item.type === 'custom'" class="days-only">
              还剩 {{ item.days }} 天
            </div>
            <div v-else class="time-blocks">
              <span class="time-block">{{ item.days }}<small>天</small></span>
              <span class="time-block">{{ item.hours }}<small>时</small></span>
              <span class="time-block">{{ padZero(item.minutes) }}<small>分</small></span>
              <span class="time-block">{{ padZero(item.seconds) }}<small>秒</small></span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-title">时间进度</div>
      <div class="progress-section">
        <div v-for="(item, index) in progressItems" 
             :key="`progress-${index}`"
             class="progress-item">
          <div class="progress-header">
            <span class="name">距离{{ item.name }}</span>
            <span class="days-passed">已过 {{ item.days }} 天</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: item.percentage + '%' }"></div>
            <span class="percentage-label">{{ item.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import solarLunar from 'solarlunar-es'

export default {
    data() {
        return {
            dateItems: [],
            timer: null,
            fixedItems: [
                { name: '周末', type: 'weekend' },
                { name: '周一', type: 'passed' },
                { name: '月初', type: 'passed' },
                { name: '年初', type: 'passed' }
            ],
            currentTime: '',
            customItems: []
        }
    },
    computed: {
        countdownItems() {
            const customCountdowns = this.customItems.map(item => ({
                name: item.name,
                targetDate: item.targetDate,
                days: Math.floor((item.targetDate - new Date()) / (1000 * 60 * 60 * 24)),
                type: 'custom'
            }))
            
            return [
                ...this.dateItems.filter(item => item.type !== 'passed'),
                ...customCountdowns
            ].sort((a, b) => (a.targetDate || 0) - (b.targetDate || 0))
        },
        progressItems() {
            return this.dateItems.filter(item => item.type === 'passed')
        }
    },
    created() {
        this.loadCustomSettings().then(() => {
            this.calculateDates()
            this.timer = setInterval(() => {
                this.calculateDates()
                this.updateCurrentTime()
            }, 1000)
        })
    },
    methods: {
        loadCustomSettings() {
            return new Promise((resolve) => {
                // 检查 chrome.storage 是否可用
                if (!chrome?.storage?.sync) {
                    console.warn('Chrome storage API 不可用，跳过加载自定义设置');
                    resolve();
                    return;
                }

                try {
                    chrome.storage.sync.get(['payday', 'birthdays'], (settings) => {
                        if (chrome.runtime.lastError) {
                            console.error('读取存储时出错:', chrome.runtime.lastError);
                            resolve();
                            return;
                        }

                        this.customItems = [];

                        // 处理发薪日
                        if (settings?.payday) {
                            try {
                                this.customItems.push(this.createPaydayItem(settings.payday));
                            } catch (err) {
                                console.error('处理发薪日数据出错:', err);
                            }
                        }

                        // 处理生日提醒
                        if (settings?.birthdays?.length) {
                            settings.birthdays.forEach(birthday => {
                                try {
                                    if (birthday?.name && birthday?.date) {
                                        this.customItems.push(this.createBirthdayItem(birthday));
                                    }
                                } catch (err) {
                                    console.error('处理生日数据出错:', err, birthday);
                                }
                            });
                        }

                        resolve();
                    });
                } catch (err) {
                    console.error('访问 Chrome storage 时出错:', err);
                    resolve();
                }
            });
        },

        createPaydayItem(payday) {
            const now = new Date();
            let targetDate = new Date(now.getFullYear(), now.getMonth(), payday);
            
            // 如果今天已经过了这个月的发薪日，计算下个月的
            if (now > targetDate) {
                targetDate = new Date(now.getFullYear(), now.getMonth() + 1, payday);
            }

            return {
                name: '发薪日',
                targetDate,
                type: 'custom',
                days: Math.floor((targetDate - now) / (1000 * 60 * 60 * 24))
            };
        },

        createBirthdayItem(birthday) {
            const now = new Date();
            const birthdayDate = new Date(birthday.date);
            
            // 设置今年的生日日期
            let targetDate = new Date(
                now.getFullYear(),
                birthdayDate.getMonth(),
                birthdayDate.getDate()
            );
            
            // 如果今年的生日已过，设置为明年的生日
            if (now > targetDate) {
                targetDate = new Date(
                    now.getFullYear() + 1,
                    birthdayDate.getMonth(),
                    birthdayDate.getDate()
                );
            }

            return {
                name: `${birthday.name}生日`,
                targetDate,
                type: 'custom',
                days: Math.floor((targetDate - now) / (1000 * 60 * 60 * 24))
            };
        },

        getTraditionalFestivals() {
            const now = new Date()
            const currentYear = now.getFullYear()
            
            // 定义传统节日
            const festivals = [
                { name: '春节', month: 1, day: 1 },
                { name: '元宵节', month: 1, day: 15 },
                { name: '端午节', month: 5, day: 5 },
                { name: '七夕节', month: 7, day: 7 },
                { name: '中秋节', month: 8, day: 15 },
                { name: '重阳节', month: 9, day: 9 },
                { name: '小年', month: 12, day: 23 }
            ]

            let allFestivals = []
            
            // 计算今明两年的节日日期
            for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
                const year = currentYear + yearOffset
                
                festivals.forEach(festival => {
                    try {
                        const lunar = solarLunar.lunar2solar(year, festival.month, festival.day)
                        const festivalDate = new Date(lunar.cYear, lunar.cMonth - 1, lunar.cDay)
                        
                        if (festivalDate > now) {
                            allFestivals.push({
                                name: festival.name,
                                type: 'festival',
                                targetDate: festivalDate
                            })
                        }
                    } catch (error) {
                        console.error(`计算${festival.name}日期出错:`, error)
                    }
                })
            }

            // 按日期排序，取最近的几个节日
            return allFestivals
                .sort((a, b) => a.targetDate - b.targetDate)
                .slice(0, 5) // 只取最近的5个节日
        },

        calculateDates() {
            // 获取传统节日
            const festivals = this.getTraditionalFestivals()
            
            // 合并固定项目和节日
            const allDates = [
                ...this.fixedItems,
                ...festivals
            ]

            this.dateItems = allDates.map(item => {
                if (item.type === 'passed') {
                    return this.calculatePassed(item.name)
                }
                return this.calculateSpecialDate(item.name, item.type, item.targetDate)
            })
        },

        calculateSpecialDate(name, type, targetDate) {
            try {
                const date = targetDate || this.getNextDate(type)
                const countdown = this.calculateCountdown(name, date)
                return {
                    ...countdown,
                    targetDate: date
                }
            } catch (error) {
                console.error('计算特殊日期出错:', error)
                return {
                    name,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    type: 'countdown',
                    targetDate: null
                }
            }
        },

        formatDate(date) {
            if (!date) return ''
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        },
        getWeekday(date) {
            if (!date) return ''
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
            return weekdays[date.getDay()]
        },
        getLunarInfo(date) {
            if (!date) return ''
            const solar = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            }
            const lunar = solarLunar.solar2lunar(solar.year, solar.month, solar.day)
            return `农历${lunar.monthCn}${lunar.dayCn}`
        },
        getNextDate(type) {
            const now = new Date()
            const currentYear = now.getFullYear()
            
            // 农历节日日期映射
            const lunarFestivals = {
                yuanxiao: { month: 1, day: 15 },    // 元宵：正月十五
                duanwu: { month: 5, day: 5 },       // 端午：五月初五
                zhongqiu: { month: 8, day: 15 },    // 中秋：八月十五
                chongyang: { month: 9, day: 9 },    // 重阳：九月初九
                xiaonian: { month: 12, day: 23 },    // 小年：腊月廿三
                springFestival: { month: 1, day: 1 }  // 春节：正月初一
            }
            
            switch (type) {
                case 'weekend': {
                    const today = now.getDay()
                    let daysUntilWeekend
                    
                    if (today === 6) {
                        daysUntilWeekend = 7
                    } else if (today === 0) {
                        daysUntilWeekend = 6
                    } else {
                        daysUntilWeekend = 6 - today
                    }
                    
                    const nextWeekend = new Date(now)
                    nextWeekend.setHours(0, 0, 0, 0)
                    nextWeekend.setDate(now.getDate() + daysUntilWeekend)
                    return nextWeekend
                }
                
                case 'newYear': {
                    const nextNewYear = new Date(currentYear + 1, 0, 1)
                    const thisNewYear = new Date(currentYear, 0, 1)
                    return now < thisNewYear ? thisNewYear : nextNewYear
                }
                
                // 处理农历节日
                case 'yuanxiao':
                case 'duanwu':
                case 'zhongqiu':
                case 'chongyang':
                case 'xiaonian':
                case 'springFestival': {
                    const festival = lunarFestivals[type]
                    if (!festival) return now
                    
                    // 计算今年的节日日期
                    const thisYear = solarLunar.lunar2solar(currentYear, festival.month, festival.day)
                    const thisYearDate = new Date(thisYear.cYear, thisYear.cMonth - 1, thisYear.cDay)
                    
                    // 如果今年的节日已过，计算明年的日期
                    if (thisYearDate < now) {
                        const nextYear = solarLunar.lunar2solar(currentYear + 1, festival.month, festival.day)
                        return new Date(nextYear.cYear, nextYear.cMonth - 1, nextYear.cDay)
                    }
                    
                    return thisYearDate
                }
                
                default:
                    console.error('未知的日期类型:', type)
                    return now
            }
        },
        getLunarFestivalDate(type) {
            const now = new Date()
            const currentYear = now.getFullYear()
            
            try {
                let targetDate

                if (type === 'xiaonian') {
                    const xiaonianSolar = solarLunar.lunar2solar(currentYear, 12, 23)
                    targetDate = new Date(xiaonianSolar.cYear, xiaonianSolar.cMonth - 1, xiaonianSolar.cDay)
                    
                    if (targetDate < now) {
                        const nextXiaonian = solarLunar.lunar2solar(currentYear + 1, 12, 23)
                        targetDate = new Date(nextXiaonian.cYear, nextXiaonian.cMonth - 1, nextXiaonian.cDay)
                    }
                } else if (type === 'springFestival') {
                    const springFestivalSolar = solarLunar.lunar2solar(currentYear + 1, 1, 1)
                    targetDate = new Date(springFestivalSolar.cYear, springFestivalSolar.cMonth - 1, springFestivalSolar.cDay)
                    
                    if (targetDate < now) {
                        const nextSpringFestival = solarLunar.lunar2solar(currentYear + 2, 1, 1)
                        targetDate = new Date(nextSpringFestival.cYear, nextSpringFestival.cMonth - 1, nextSpringFestival.cDay)
                    }
                }

                return targetDate
            } catch (error) {
                console.error('计算农历节日日期出错:', error)
                return type === 'xiaonian' ? 
                    new Date(2024, 1, 2) :  // 2024年2月2日小年
                    new Date(2024, 1, 10)   // 2024年2月10日春节
            }
        },
        calculateCountdown(name, targetDate) {
            if (!targetDate || isNaN(targetDate.getTime())) {
                console.error('目标日期无效:', name, targetDate)
                return {
                    name,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    type: 'countdown'
                }
            }

            const now = new Date()
            const diffTime = targetDate - now
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            
            return {
                name,
                days: diffDays,
                hours: Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diffTime % (1000 * 60)) / 1000),
                type: 'countdown'
            }
        },
        calculatePassed(name) {
            const now = new Date()
            let days, percentage

            if (name === '周一') {
                const day = now.getDay()
                days = day === 0 ? 6 : day - 1
                percentage = Math.round((days / 7) * 100)
            } else if (name === '月初') {
                days = now.getDate() - 1
                percentage = Math.round((days / 30) * 100)
            } else if (name === '年初') {
                const startOfYear = new Date(now.getFullYear(), 0, 1)
                days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24))
                percentage = Math.round((days / 365) * 100)
            }

            return {
                name,
                days,
                percentage,
                type: 'passed'
            }
        },
        // 用于调试的辅助方法
        debugLunarDate(date) {
            const solar = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            }
            const lunar = solarLunar.solar2lunar(solar.year, solar.month, solar.day)
            console.log('公历:', `${solar.year}年${solar.month}月${solar.day}日`)
            console.log('农历:', `${lunar.lYear}年${lunar.lMonth}月${lunar.lDay}日`)
        },
        padZero(num) {
            return String(num).padStart(2, '0')
        },
        updateCurrentTime() {
            const now = new Date()
            this.currentTime = now.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        },
        formatFullDate(date) {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        },
        
        getWeekInfo() {
            const now = new Date()
            const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
            const weekDay = weekNames[now.getDay()]
            
            // 计算第几周
            const startOfYear = new Date(now.getFullYear(), 0, 1)
            const weekNumber = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7)
            
            return `${weekDay} 第${weekNumber}周`
        }
    }
}
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 320px;
  min-height: fit-content;  /* 改为自适应高度 */
}

::-webkit-scrollbar {
  display: none;
}

#app {
  width: 100%;
  height: auto;  /* 改为自适应 */
  overflow: hidden;
}

.popup-card {
  width: 100%;
  height: auto;  /* 改为自适应 */
  margin: 0;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 优化内容布局 */
.content-wrapper {
  height: auto;  /* 改为自适应 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 其他样式保持紧凑 */
.card-header {
  padding: 12px;
  margin-bottom: 12px;
}

.countdown-section {
  gap: 10px;
  display: flex;
  flex-direction: column;
}

.countdown-item {
  padding: 10px;
}

.progress-section {
  gap: 8px;
  display: flex;
  flex-direction: column;
}

.progress-item {
  padding: 8px 12px;
}

.section-title {
  margin: 12px 0 8px;
}

/* 确保内容不会被截断 */
.popup-card > *:last-child {
  margin-bottom: 0;
}
</style>

<style scoped>
.popup-card {
  width: 320px;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  border-radius: 24px;
  /* box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 0 80px rgba(255, 255, 255, 0.5); */
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

/* 装饰层 */
.decoration-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  top: -20px;
  right: -20px;
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  bottom: -30px;
  left: -30px;
  width: 120px;
  height: 120px;
  background: linear-gradient(45deg, #ec4899, #f472b6);
  animation: float 10s ease-in-out infinite reverse;
}

.deco-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transform-origin: left;
}

.line-1 {
  top: 20%;
  left: 0;
  width: 100%;
  height: 1px;
  animation: lineMove 15s linear infinite;
}

.line-2 {
  bottom: 30%;
  left: 0;
  width: 100%;
  height: 1px;
  animation: lineMove 20s linear infinite reverse;
}

.card-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.today-info {
  margin-bottom: 8px;
}

.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.current-date {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.week-info {
  font-size: 13px;
  color: #fff;
  background: linear-gradient(45deg, #ec4899, #f472b6);
  padding: 3px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
  position: relative;
  overflow: hidden;
}

.week-info::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 2s infinite;
}

.lunar-row {
  font-size: 14px;
  color: #64748b;
}

.time-row {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
}

.section-title {
  position: relative;
  display: inline-block;
  padding: 0 5px;
  margin: 16px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.section-title:first-of-type {
  margin-top: 4px;
}

.countdown-section {
  display: grid;
  gap: 12px;
  margin-bottom: 6px;
}

.countdown-item {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.05),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 12px;
}

.countdown-item:last-child {
  margin-bottom: 0;
}

.countdown-item:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 8px 20px rgba(99, 102, 241, 0.15),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.left-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.lunar-date {
  font-size: 12px;
  color: #64748b;
}

.target-date {
  font-size: 12px;
  color: #8b5cf6;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  padding: 3px 10px;
  border-radius: 12px;
}

.time-blocks {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

.time-block {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  min-width: 34px;
  text-align: center;
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.time-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 60%
  );
  transition: opacity 0.3s ease;
}

.progress-section {
  display: grid;
  gap: 10px;
  padding-bottom: 8px;
}

.progress-item {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.05),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.progress-item:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.days-passed {
  font-size: 12px;
  color: #64748b;
}

.progress-bar {
  height: 8px;
  background: rgba(226, 232, 240, 0.8);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #f472b6);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
}

/* 动画定义 */
@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(10px, 10px) rotate(5deg); }
}

@keyframes lineMove {
  0% { transform: translateX(-100%) scaleX(0.5); }
  100% { transform: translateX(100%) scaleX(1.5); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(100%) skewX(-15deg); }
}

@keyframes titleLine {
  0%, 100% { transform: scaleX(0.8); }
  50% { transform: scaleX(1); }
}

/* 优化滚动条样式 */
.content-wrapper::-webkit-scrollbar {
  width: 6px;
}

.content-wrapper::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.5);
  border-radius: 3px;
}

.content-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #6366f1, #8b5cf6);
  border-radius: 3px;
}

/* 添加更多精致的动画效果 */
.section-title {
  position: relative;
  display: inline-block;
  padding: 0 5px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #6366f1, #8b5cf6);
  border-radius: 2px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, transparent);
  transform-origin: left;
  animation: titleLine 3s ease-in-out infinite;
}

@keyframes titleLine {
  0%, 100% { transform: scaleX(0.8); }
  50% { transform: scaleX(1); }
}

/* 添加更多动画效果 */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
    filter: blur(5px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
    filter: blur(0);
  }
}

.countdown-item, .progress-item {
  animation: fadeIn 0.5s ease-out forwards;
}

/* 添加交错动画延迟 */
.countdown-item:nth-child(2) { animation-delay: 0.1s; }
.countdown-item:nth-child(3) { animation-delay: 0.2s; }
.progress-item:nth-child(2) { animation-delay: 0.1s; }
.progress-item:nth-child(3) { animation-delay: 0.2s; }

/* 移除内容包装器的滚动相关样式 */
.content-wrapper {
  position: relative;
  z-index: 1;
}

/* 自定义倒计时的特殊样式 */
.custom-countdown {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8));
  border: 1px solid rgba(236, 72, 153, 0.2);
}

.custom-countdown .item-header {
  border-bottom: 1px solid rgba(236, 72, 153, 0.1);
  padding-bottom: 8px;
}

.custom-countdown .target-date {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.1));
  color: #ec4899;
}

.days-only {
  font-size: 16px;
  font-weight: 600;
  color: #ec4899;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.1));
  padding: 8px 16px;
  border-radius: 12px;
  display: inline-block;
  margin-top: 4px;
  box-shadow: 
    0 2px 8px rgba(236, 72, 153, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.days-only::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 60%
  );
  transition: opacity 0.3s ease;
}

.custom-countdown:hover .days-only {
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(236, 72, 153, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.5);
}

/* 确保自定义倒计时的动画效果更柔和 */
.custom-countdown {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-countdown:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(236, 72, 153, 0.15),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
}
</style>