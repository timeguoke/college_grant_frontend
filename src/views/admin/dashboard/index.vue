<template>
  <div class="dashboard">
    <!-- 欢迎横幅：墨绿底 + 金色装饰，呼应登录页 -->
    <section class="welcome-banner reveal">
      <div class="banner-ring"></div>
      <div class="welcome-content">
        <div>
          <div class="welcome-kicker">学生资助管理中心</div>
          <h2 class="welcome-title">{{ greeting }}，{{ userStore.username }}</h2>
          <p class="welcome-subtitle">
            欢迎使用助学金层次分析法（AHP）评定管理系统
            <span class="subtitle-divider">|</span>
            {{ termName }} · 第 {{ termWeek }} 周
          </p>
        </div>
        <div class="welcome-date">
          <el-popover placement="bottom" :width="300" trigger="click">
            <template #reference>
              <div class="date-trigger">
                <el-icon :size="16"><Calendar /></el-icon>
                <span>{{ todayStr }}</span>
              </div>
            </template>
            <div class="calendar-panel">
              <el-date-picker
                v-model="calendarDate"
                type="date"
                :clearable="false"
                style="width: 100%"
              />
            </div>
          </el-popover>
        </div>
      </div>
    </section>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row reveal">
      <el-col :span="6" v-for="item in statCards" :key="item.title">
        <el-card class="stat-card" shadow="never" @click="goTo(item.path)">
          <el-icon class="stat-arrow"><ArrowRight /></el-icon>
          <div class="stat-card-body">
            <div class="stat-icon-box" :style="{ background: item.bg, color: item.color }">
              <el-icon :size="26"><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-num">{{ item.value }}</div>
              <div class="stat-title">{{ item.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="20" class="chart-row reveal">
      <el-col :span="12" :xs="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">申请状态分布</div>
          </template>
          <div class="donut-wrap">
            <div class="donut">
              <svg class="donut-svg" viewBox="0 0 160 160" width="158" height="158">
                <circle cx="80" cy="80" r="64" fill="none" stroke="#eef1f6" stroke-width="18" />
                <circle
                  v-for="seg in donutSegments"
                  :key="seg.label"
                  cx="80" cy="80" r="64" fill="none"
                  :stroke="seg.color" stroke-width="18"
                  :stroke-dasharray="`${seg.dash} 402.1`"
                  :stroke-dashoffset="seg.offset"
                />
              </svg>
              <div class="donut-center">
                <div class="donut-num">{{ applicationTotal }}</div>
                <div class="donut-cap">总申请</div>
              </div>
            </div>
            <div class="donut-legend">
              <div
                v-for="item in applicationStats"
                :key="item.label"
                class="legend-item"
                :class="{ zero: !item.value }"
              >
                <span class="legend-dot" :style="{ background: item.color }"></span>
                <span>{{ item.label }}</span>
                <span class="legend-val">
                  {{ item.value }}人<small class="legend-pct">{{ item.percentage }}%</small>
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" :xs="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">各类型评定人数</div>
          </template>
          <div v-if="evaluationStats.length" class="hbars">
            <div v-for="(item, idx) in evaluationStats" :key="item.typeName" class="hbar-item" :class="{ zero: !item.count }">
              <div class="bar-top">
                <span class="bar-label">{{ item.typeName }}</span>
                <span class="bar-value" :style="{ color: barColors[idx % barColors.length] }">
                  {{ item.count }}人 · {{ item.percentage }}%
                </span>
              </div>
              <div class="hbar-track">
                <div
                  class="hbar-fill"
                  :style="{ width: item.percentage + '%', background: barColors[idx % barColors.length] }"
                ></div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="80" />
          <div v-if="evaluationStats.length" class="chart-total">
            <span>评定覆盖 {{ evaluationStats.length }} 个类型</span>
            <span>合计 <b>{{ evaluationTotal }}</b> 人</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新申请动态 + 待办提醒 -->
    <el-row :gutter="20" class="bottom-row reveal">
      <el-col :span="14" :xs="24">
        <el-card shadow="never" class="h-card">
          <template #header>
            <div class="card-header">
              <span>最新申请动态</span>
              <el-link type="primary" underline="never" @click="goTo('/admin/application')">查看全部 →</el-link>
            </div>
          </template>
          <ul v-if="recentApplications.length" class="feed-list">
            <li
              v-for="item in recentApplications"
              :key="item.id"
              class="feed-item"
              @click="goTo('/admin/application')"
            >
              <span class="feed-no">{{ item.studentNo }}</span>
              <span class="feed-name">{{ item.studentName }}</span>
              <span class="feed-type">{{ item.typeName }}</span>
              <span class="feed-tag" :class="feedTagClass(item.status)">{{ statusText(item.status) }}</span>
              <span class="feed-time">{{ shortTime(item.createTime) }}</span>
            </li>
          </ul>
          <el-empty v-else description="暂无申请" :image-size="70" />
        </el-card>
      </el-col>
      <el-col :span="10" :xs="24">
        <el-card shadow="never" class="h-card">
          <template #header>
            <div class="card-header">
              <span>待办提醒</span>
              <span v-if="todoList.length" class="todo-badge">共 {{ todoTotal }} 项</span>
            </div>
          </template>
          <div v-if="todoList.length" class="todo-list">
            <div
              v-for="td in todoList"
              :key="td.label"
              class="todo-item"
              @click="goTo(td.path)"
            >
              <span class="todo-num">{{ td.count }}</span>
              <span class="todo-label"><b>{{ td.label }}</b>{{ td.desc }}</span>
              <span class="todo-arrow">›</span>
            </div>
          </div>
          <div v-else class="todo-done">✓ 全部办结</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 评定进度漏斗 + 学期信息 -->
    <el-row :gutter="20" class="bottom-row reveal">
      <el-col :span="14" :xs="24">
        <el-card shadow="never" class="h-card">
          <template #header>
            <div class="card-header"><span>本学期评定进度</span></div>
          </template>
          <div v-if="funnelSteps.length" class="funnel">
            <div v-for="step in funnelSteps" :key="step.label" class="funnel-item">
              <span class="funnel-label">{{ step.label }}</span>
              <div class="funnel-track">
                <div class="funnel-bar" :style="{ width: step.pct + '%', background: step.color }">
                  {{ step.value }}
                </div>
              </div>
              <span class="funnel-pct">{{ step.pct }}%</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="70" />
        </el-card>
      </el-col>
      <el-col :span="10" :xs="24">
        <el-card shadow="never" class="h-card">
          <template #header>
            <div class="card-header"><span>学期信息</span></div>
          </template>
          <div class="term-info">
            <div class="term-item">
              <div class="term-k">当前学期</div>
              <div class="term-v">{{ termName }}</div>
            </div>
            <div class="term-item">
              <div class="term-k">教学周</div>
              <div class="term-v">第 {{ termWeek }} 周</div>
            </div>
            <div class="term-item">
              <div class="term-k">最近公示截止</div>
              <div v-if="noticeDeadline" class="term-v term-gold">
                {{ noticeDeadline.date }}<small>剩余 {{ noticeDeadline.days }} 天</small>
              </div>
              <div v-else class="term-v" style="font-size: 15px">暂无进行中的公示</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getDashboard } from '@/api/dashboard'
import { getApplicationPage, getNoticePage } from '@/api/student'

const router = useRouter()
const userStore = useUserStore()
const data = ref({})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayStr = computed(() => {
  const d = new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${week[d.getDay()]}`
})

const calendarDate = ref(new Date())

// 配色统一为学术瑞士风：藏蓝 / 学院绿 / 成就金 / 砖红 / 冷灰蓝的低饱和色系
const statCards = computed(() => [
  { title: '学生总数', value: data.value.studentCount || 0, icon: 'User', color: '#1d3a6e', bg: 'rgba(29,58,110,0.08)', path: '/admin/student' },
  { title: '教师总数', value: data.value.teacherCount || 0, icon: 'Avatar', color: '#3f644f', bg: 'rgba(79,125,99,0.14)', path: '/admin/teacher' },
  { title: '申请总数', value: data.value.applicationStats?.totalCount || 0, icon: 'Document', color: '#8d6e32', bg: 'rgba(176,138,62,0.14)', path: '/admin/application' },
  { title: '评定总数', value: (data.value.evaluationStatsList || []).reduce((sum, item) => sum + (item.awardedCount || 0) + (item.notAwardedCount || 0), 0), icon: 'Trophy', color: '#8b3b37', bg: 'rgba(174,74,69,0.12)', path: '/admin/evaluation' }
])

// 申请状态分布：后端返回对象（pendingCount/approvedCount/...），映射为图表数组
const applicationStats = computed(() => {
  const s = data.value.applicationStats || {}
  const items = [
    { label: '待审核', value: s.pendingCount || 0, color: '#7c8798' },
    { label: '已通过', value: s.approvedCount || 0, color: '#4f7d63' },
    { label: '已拒绝', value: s.rejectedCount || 0, color: '#ae4a45' },
    { label: '已评分', value: s.scoredCount || 0, color: '#8a9bb8' },
    { label: '已评定', value: s.evaluatedCount || 0, color: '#1d3a6e' },
    { label: '已公示', value: s.publishedCount || 0, color: '#c9a24e' }
  ]
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1
  return items.map(i => ({
    ...i,
    percentage: Math.round(i.value / total * 100)
  }))
})

// 各类型评定人数：后端字段为 evaluationStatsList（awardedCount/notAwardedCount）
const evaluationStats = computed(() => {
  const list = data.value.evaluationStatsList || []
  const countOf = i => (i.awardedCount || 0) + (i.notAwardedCount || 0)
  const total = list.reduce((sum, i) => sum + countOf(i), 0) || 1
  return list
    .map(i => ({
      ...i,
      count: countOf(i),
      percentage: Math.round(countOf(i) / total * 100)
    }))
    .sort((a, b) => b.count - a.count)
})

// 类型条形图调色板：成就金 / 学术藏蓝 / 学院绿 / 冷灰蓝 / 砖红
const barColors = ['#c9a24e', '#1d3a6e', '#4f7d63', '#8a9bb8', '#ae4a45']

// 申请总数（环形图中心数字）
const applicationTotal = computed(() => applicationStats.value.reduce((s, i) => s + i.value, 0))

// 环形图弧段：r=64 周长约 402.1，按状态比例切分，起点旋转至 12 点方向
const donutSegments = computed(() => {
  const total = applicationTotal.value
  if (!total) return []
  const C = 402.1
  let acc = 0
  return applicationStats.value
    .filter(i => i.value > 0)
    .map(i => {
      const frac = i.value / total
      const seg = { label: i.label, color: i.color, dash: frac * C, offset: -acc * C }
      acc += frac
      return seg
    })
})

// 评定总数（右卡合计行）
const evaluationTotal = computed(() => evaluationStats.value.reduce((s, i) => s + i.count, 0))

// ============ 最新申请动态 ============
const recentApplications = ref([])
const statusTextArr = ['待审核', '已通过', '已驳回', '已评分', '已评定', '已公示']
function statusText(s) {
  return statusTextArr[s] || ''
}
// 动态列表状态标签配色（与全站语义色一致）
function feedTagClass(s) {
  return ['t-gray', 't-green', 't-red', 't-blue', 't-navy', 't-gold'][s] || 't-gray'
}
// 2026-10-11 09:24:00 → 10-11 09:24
function shortTime(t) {
  if (!t) return ''
  return String(t).slice(5, 16).replace('T', ' ')
}

// ============ 待办提醒 ============
const todoList = computed(() => {
  const s = data.value.applicationStats || {}
  return [
    { label: '待审核申请', desc: '学生提交的申请等待初审', count: s.pendingCount || 0, path: '/admin/application' },
    { label: '待评分申请', desc: '已通过但尚未完成评分', count: s.approvedCount || 0, path: '/admin/score' },
    { label: '待评定申请', desc: '评分完成等待AHP评定', count: s.scoredCount || 0, path: '/admin/evaluation' }
  ].filter(i => i.count > 0)
})

// 待办总数（header 徽章）
const todoTotal = computed(() => todoList.value.reduce((sum, i) => sum + i.count, 0))

// ============ 评定进度漏斗（累计口径：到达该阶段及之后的申请都计入） ============
const funnelSteps = computed(() => {
  const s = data.value.applicationStats || {}
  const pending = s.pendingCount || 0
  const approved = s.approvedCount || 0
  const rejected = s.rejectedCount || 0
  const scored = s.scoredCount || 0
  const evaluated = s.evaluatedCount || 0
  const published = s.publishedCount || 0
  const total = pending + approved + rejected + scored + evaluated + published
  if (!total) return []
  const steps = [
    { label: '提交申请', value: total, color: '#1d3a6e' },
    { label: '初审通过', value: approved + scored + evaluated + published, color: '#3f5f94' },
    { label: '完成评分', value: scored + evaluated + published, color: '#4f7d63' },
    { label: 'AHP评定', value: evaluated + published, color: '#7a6437' },
    { label: '结果公示', value: published, color: '#c9a24e' }
  ]
  return steps.map(st => ({ ...st, pct: Math.round(st.value / total * 100) }))
})

// ============ 学期信息（学期周次为纯前端计算，改 TERM_START 常量即可） ============
const TERM_START = '2026-09-07' // 本学期教学周首日（周一）
const termName = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return m >= 9 ? `${y} - ${y + 1} 秋季学期` : `${y - 1} - ${y} 春季学期`
})
const termWeek = computed(() => {
  const start = new Date(`${TERM_START} 00:00:00`).getTime()
  const week = Math.floor((Date.now() - start) / 86400000 / 7) + 1
  return Math.max(1, Math.min(25, week))
})
const noticeList = ref([])
const noticeDeadline = computed(() => {
  const now = Date.now()
  const active = noticeList.value
    .filter(n => n.status === 1 && n.endTime && new Date(n.endTime).getTime() > now)
    .sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
  if (!active.length) return null
  const d = new Date(active[0].endTime)
  const days = Math.max(1, Math.ceil((d.getTime() - now) / 86400000))
  return { date: `${d.getMonth() + 1} 月 ${d.getDate()} 日`, days }
})

// ============ 滚动渐入动效：区块进入视口后一次性浮现 ============
function setupReveal() {
  const els = document.querySelectorAll('.dashboard .reveal')
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('revealed'))
    return
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed')
        io.unobserve(e.target)
      }
    })
  }, { threshold: 0.1 })
  els.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 90, 360)}ms`
    io.observe(el)
  })
}

function goTo(path) {
  router.push(path)
}

onMounted(async () => {
  try {
    const res = await getDashboard()
    data.value = res.data || {}
  } catch (err) {}
  try {
    const res = await getApplicationPage({ page: 1, size: 5 })
    recentApplications.value = res.rows || res.data?.rows || []
  } catch (err) {}
  try {
    const res = await getNoticePage({ page: 1, size: 20 })
    noticeList.value = res.rows || res.data?.rows || []
  } catch (err) {}
  setupReveal()
})
</script>

<style scoped>
.dashboard {
  flex: none !important;
  display: block !important;
  align-self: center !important;
  width: calc(100% - 160px);
  margin: 0 auto;
}

/* ============ 欢迎横幅 ============ */
.welcome-banner {
  position: relative;
  overflow: hidden;
  background: #0f1f3d;
  border-radius: 14px;
  padding: 30px 34px;
  margin-bottom: 20px;
  box-shadow: 0 6px 20px rgba(15, 31, 61, 0.18);
}
/* 细网格纹理，呼应登录页品牌区 */
.welcome-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}
/* 右下金色圆环装饰 */
.banner-ring {
  position: absolute;
  width: 300px;
  height: 300px;
  right: -120px;
  bottom: -150px;
  border-radius: 50%;
  border: 1px solid rgba(201, 162, 78, 0.3);
  pointer-events: none;
}
.banner-ring::after {
  content: '';
  position: absolute;
  inset: 26px;
  border-radius: 50%;
  border: 1px solid rgba(201, 162, 78, 0.18);
}
.welcome-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  color: #eef2f9;
}
.welcome-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  letter-spacing: 4px;
  color: #dcbc7a;
  margin-bottom: 12px;
}
.welcome-kicker::before {
  content: '';
  width: 28px;
  height: 1px;
  background: #c9a24e;
}
.welcome-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0 0 8px;
}
.welcome-subtitle {
  font-size: 13px;
  font-weight: 300;
  color: rgba(238, 242, 249, 0.65);
  margin: 0;
  letter-spacing: 0.5px;
}
.subtitle-divider {
  margin: 0 10px;
  color: rgba(201, 162, 78, 0.55);
}
.welcome-date {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.date-trigger {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: rgba(238, 242, 249, 0.75);
  padding: 8px 14px;
  border: 1px solid rgba(201, 162, 78, 0.3);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.2s;
}
.date-trigger:hover {
  background: rgba(201, 162, 78, 0.12);
  border-color: rgba(201, 162, 78, 0.5);
}

/* ============ 统计卡片 ============ */
.stat-row {
  margin-bottom: 20px;
}
.stat-card {
  position: relative;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(201, 162, 78, 0.55);
  box-shadow: 0 10px 24px rgba(15, 31, 61, 0.1);
}
.stat-arrow {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 14px;
  color: #c9cfdb;
  opacity: 0.6;
  transition: all 0.2s ease;
}
.stat-card:hover .stat-arrow {
  color: #c9a24e;
  transform: translateX(3px);
  opacity: 1;
}
.stat-card :deep(.el-card__body) {
  padding: 22px;
}
.stat-card-body {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-num {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  color: #1d3a6e;
}
.stat-title {
  font-size: 13px;
  color: #5d6b80;
  margin-top: 7px;
  letter-spacing: 0.5px;
}

/* ============ 图表区 ============ */
.chart-row {
  margin-bottom: 20px;
}
/* 两卡等高：卡片纵向 flex，右侧内容自动撑满 */
.chart-row :deep(.el-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chart-row :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
/* 卡片标题装饰复用 main.css 全局 .el-card__header 金色短竖线 */
/* 左卡：环形图 + 图例 */
.donut-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 8px 4px;
}
.donut {
  position: relative;
  width: 158px;
  height: 158px;
  flex-shrink: 0;
}
.donut-svg {
  display: block;
  transform: rotate(-90deg);
}
.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.donut-num {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  color: #1d3a6e;
}
.donut-cap {
  font-size: 12px;
  color: #5d6b80;
  margin-top: 6px;
  letter-spacing: 2px;
}
.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #5d6b80;
}
.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 3px;
  flex-shrink: 0;
}
.legend-val {
  margin-left: auto;
  font-weight: 600;
  color: #20241f;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.legend-pct {
  font-size: 11px;
  font-weight: 400;
  color: #8a94a6;
  margin-left: 7px;
}
.legend-item.zero {
  opacity: 0.4;
}
/* 右卡：横向条形图，均匀分布填充高度 */
.hbars {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 8px 4px 4px;
}
.hbar-item {
  margin-bottom: 4px;
}
.hbar-item.zero {
  opacity: 0.45;
}
.hbar-track {
  height: 13px;
  background: #eef1f6;
  border-radius: 99px;
  overflow: hidden;
}
.hbar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.45s ease;
}
.bar-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.bar-label {
  font-size: 13px;
  color: #4a4f45;
}
.bar-value {
  font-size: 13px;
  font-weight: 600;
  color: #20241f;
  font-variant-numeric: tabular-nums;
}
/* 右卡合计行 */
.chart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #ebeef3;
  margin-top: 16px;
  padding: 12px 4px 2px;
  font-size: 12.5px;
  color: #5d6b80;
}
.chart-total b {
  font-size: 14px;
  color: #1d3a6e;
  font-variant-numeric: tabular-nums;
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .stat-row .el-col {
    margin-bottom: 14px;
  }
}
@media (max-width: 992px) {
  .donut-wrap {
    flex-direction: column;
  }
  .donut-legend {
    width: 100%;
  }
}

/* ============ 滚动渐入动效 ============ */
.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal.revealed {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* ============ 最新申请动态 ============ */
.bottom-row {
  margin-bottom: 20px;
}
.bottom-row :deep(.el-card) {
  height: 100%;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.feed-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.feed-item:hover {
  background: #f6f8fb;
}
.feed-item + .feed-item {
  border-top: 1px dashed #ebeef3;
}
.feed-no {
  color: #5d6b80;
  font-variant-numeric: tabular-nums;
  width: 70px;
}
.feed-name {
  font-weight: 600;
  width: 56px;
}
.feed-type {
  color: #5d6b80;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-time {
  font-size: 12px;
  color: #8a94a6;
  font-variant-numeric: tabular-nums;
}
.feed-tag {
  font-size: 11.5px;
  padding: 2px 10px;
  border-radius: 99px;
  flex-shrink: 0;
}
.t-gray { background: rgba(90, 107, 132, 0.1); color: #5a6b84; }
.t-green { background: rgba(79, 125, 99, 0.12); color: #4f7d63; }
.t-red { background: rgba(174, 74, 69, 0.1); color: #ae4a45; }
.t-blue { background: rgba(138, 155, 184, 0.16); color: #5f7396; }
.t-navy { background: rgba(29, 58, 110, 0.1); color: #1d3a6e; }
.t-gold { background: rgba(201, 162, 78, 0.14); color: #8d6e32; }

/* ============ 待办提醒 ============ */
.todo-badge {
  font-size: 11.5px;
  font-weight: 600;
  color: #8d6e32;
  background: rgba(201, 162, 78, 0.14);
  border-radius: 99px;
  padding: 2px 10px;
}
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #ebeef3;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.todo-item:hover {
  border-color: rgba(201, 162, 78, 0.55);
  box-shadow: 0 4px 12px rgba(15, 31, 61, 0.06);
}
.todo-num {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1d3a6e;
  width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.todo-label {
  flex: 1;
  font-size: 12px;
  color: #8a94a6;
  line-height: 1.5;
}
.todo-label b {
  display: block;
  font-size: 13px;
  color: #20293a;
  margin-bottom: 2px;
}
.todo-arrow {
  color: #c3cbd8;
  font-size: 18px;
}
.todo-done {
  text-align: center;
  color: #4f7d63;
  background: rgba(79, 125, 99, 0.1);
  border-radius: 10px;
  padding: 20px;
  font-size: 13px;
}

/* ============ 评定进度漏斗 ============ */
.funnel {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 6px 0;
}
.funnel-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.funnel-label {
  width: 56px;
  font-size: 12.5px;
  color: #5d6b80;
  text-align: right;
  flex-shrink: 0;
}
.funnel-track {
  flex: 1;
  background: #eef1f6;
  border-radius: 6px;
  height: 22px;
  overflow: hidden;
}
.funnel-bar {
  height: 100%;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  min-width: 30px;
  transition: width 0.5s ease;
  font-variant-numeric: tabular-nums;
}
.funnel-pct {
  width: 44px;
  font-size: 12px;
  color: #8a94a6;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ============ 学期信息 ============ */
.term-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.term-item {
  background: #f6f8fb;
  border-radius: 10px;
  padding: 13px 15px;
}
.term-k {
  font-size: 12px;
  color: #8a94a6;
  margin-bottom: 5px;
}
.term-v {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 18px;
  font-weight: 700;
  color: #1d3a6e;
  font-variant-numeric: tabular-nums;
}
.term-v small {
  font-size: 12px;
  color: #8a94a6;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 400;
  margin-left: 8px;
}
.term-gold {
  color: #8d6e32;
}
</style>
