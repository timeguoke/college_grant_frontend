<template>
  <div class="dashboard">
    <!-- 欢迎横幅：藏蓝底 + 金色装饰，与管理端统一 -->
    <section class="welcome-banner reveal">
      <div class="banner-ring"></div>
      <div class="welcome-content">
        <div>
          <div class="welcome-kicker">教师评定工作台</div>
          <h2 class="welcome-title">{{ greeting }}，{{ userStore.username }}老师</h2>
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

    <!-- 待审核申请动态 + 待办提醒 -->
    <el-row :gutter="20" class="bottom-row reveal">
      <el-col :span="14" :xs="24">
        <el-card shadow="never" class="h-card">
          <template #header>
            <div class="card-header">
              <span>待审核申请动态</span>
              <el-link type="primary" underline="never" @click="goTo('/teacher/application')">查看全部 →</el-link>
            </div>
          </template>
          <ul v-if="recentApplications.length" class="feed-list">
            <li
              v-for="item in recentApplications"
              :key="item.id"
              class="feed-item"
              @click="goTo('/teacher/application')"
            >
              <span class="feed-no">{{ item.studentNo }}</span>
              <span class="feed-name">{{ item.studentName }}</span>
              <span class="feed-type">{{ item.typeName }}</span>
              <span class="feed-tag t-gray">待审核</span>
              <span class="feed-time">{{ shortTime(item.createTime) }}</span>
            </li>
          </ul>
          <el-empty v-else description="暂无待审核申请" :image-size="70" />
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
            <div class="card-header"><span>教师评定工作流程</span></div>
          </template>
          <div v-if="funnelStats.total" class="funnel">
            <div v-for="step in workflowSteps" :key="step.label" class="funnel-item">
              <span class="funnel-label">{{ step.label }}</span>
              <div class="funnel-track">
                <div class="funnel-bar" :style="{ width: Math.max(step.pct, 6) + '%', background: step.color }">
                  {{ step.count }} 人
                </div>
              </div>
              <span class="funnel-pct">{{ step.role }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无申请数据" :image-size="70" />
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
              <div class="term-k">教师职责</div>
              <div class="term-v term-gold">审核申请 · 综合评分</div>
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
import { getPendingApplications, getPendingScorePage, getMyScoreList, getGrantTypeList } from '@/api/teacher'
import { Calendar, ArrowRight, Document, EditPen, CircleCheck, User, Trophy } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const calendarDate = ref(new Date())
const reviewTotal = ref(0)
const scoreTotal = ref(0)
const scoredTotal = ref(0)
const grantTypeCount = ref(0)
const recentApplications = ref([])
const noticeList = ref([])
const funnelStats = ref({ total: 0, passed: 0, scored: 0, evaluated: 0, published: 0 })

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

const TERM_START = '2026-09-07'
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

const statCards = computed(() => [
  { title: '待审核申请', value: reviewTotal.value, icon: 'Document', color: '#1d3a6e', bg: 'rgba(29,58,110,0.08)', path: '/teacher/application' },
  { title: '待评分', value: scoreTotal.value, icon: 'EditPen', color: '#8d6e32', bg: 'rgba(176,138,62,0.14)', path: '/teacher/score' },
  { title: '已完成评分', value: scoredTotal.value, icon: 'CircleCheck', color: '#4f7d63', bg: 'rgba(79,125,99,0.14)', path: '/teacher/score' },
  { title: '助学金类型', value: grantTypeCount.value, icon: 'Trophy', color: '#8b3b37', bg: 'rgba(174,74,69,0.12)', path: '/teacher/evaluation' }
])

const todoList = computed(() => {
  const list = [
    { label: '待审核申请', desc: '学生提交的申请等待初审', count: reviewTotal.value, path: '/teacher/application' },
    { label: '待评分申请', desc: '已通过但尚未完成评分', count: scoreTotal.value, path: '/teacher/score' }
  ]
  return list.filter(i => i.count > 0)
})

const todoTotal = computed(() => todoList.value.reduce((sum, i) => sum + i.count, 0))

// 评定流程漏斗：按当前辅导员名下全部申请的状态累计计算，宽度取真实占比
const workflowSteps = computed(() => {
  const f = funnelStats.value
  const pct = n => (f.total ? Math.round((n / f.total) * 100) : 0)
  return [
    { label: '审核申请', count: f.passed, pct: pct(f.passed), color: '#1d3a6e', role: '教师' },
    { label: '综合评分', count: f.scored, pct: pct(f.scored), color: '#3f5f94', role: '教师' },
    { label: 'AHP评定', count: f.evaluated, pct: pct(f.evaluated), color: '#4f7d63', role: '管理员' },
    { label: '结果公示', count: f.published, pct: pct(f.published), color: '#c9a24e', role: '管理员' }
  ]
})

function shortTime(t) {
  if (!t) return ''
  return String(t).slice(5, 16).replace('T', ' ')
}

function goTo(path) {
  if (path) router.push(path)
}

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

onMounted(async () => {
  // 待审核申请（status=0）：统计卡片数值 + 待审核动态列表
  try {
    const res = await getPendingApplications({ page: 1, size: 5, status: 0 })
    const rows = res.rows || res.data?.rows || []
    reviewTotal.value = res.total || res.data?.total || 0
    recentApplications.value = rows
  } catch (err) {}
  // 评定流程漏斗：拉取名下全部申请，按状态累计统计各阶段人数
  try {
    const res = await getPendingApplications({ page: 1, size: 1000 })
    const rows = res.rows || res.data?.rows || []
    const c = rows.reduce((acc, r) => {
      if (acc[r.status] !== undefined) acc[r.status]++
      return acc
    }, { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
    funnelStats.value = {
      total: rows.length,
      passed: c[1] + c[3] + c[4] + c[5],
      scored: c[3] + c[4] + c[5],
      evaluated: c[4] + c[5],
      published: c[5]
    }
  } catch (err) {}
  try {
    const res = await getPendingScorePage({ page: 1, size: 1 })
    scoreTotal.value = res.total || res.data?.total || 0
  } catch (err) {}
  // 已完成评分：我提交过的评分记录数
  try {
    const res = await getMyScoreList({ page: 1, size: 1 })
    scoredTotal.value = res.total || res.data?.total || 0
  } catch (err) {}
  // 助学金类型：当前启用中的类型数量
  try {
    const res = await getGrantTypeList()
    grantTypeCount.value = (res.data || res || []).length
  } catch (err) {}
  setupReveal()
})
</script>

<style scoped>
.dashboard {
  flex: none !important;
  display: block !important;
  align-self: center !important;
  width: calc(100% - 100px);
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
  font-size: 12px;
  color: #8a94a6;
  width: 40px;
  flex-shrink: 0;
}

/* ============ 学期信息 ============ */
.term-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}
.term-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 12px;
}
.term-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.term-k {
  font-size: 13px;
  color: #8a94a6;
}
.term-v {
  font-size: 14px;
  font-weight: 600;
  color: #20293a;
  font-variant-numeric: tabular-nums;
}
.term-gold {
  color: #8d6e32;
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .stat-row .el-col {
    margin-bottom: 14px;
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
</style>
