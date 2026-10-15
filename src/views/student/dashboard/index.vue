<template>
  <div class="dashboard">
    <!-- 欢迎横幅：藏蓝底 + 金色装饰，与管理端同风格 -->
    <section class="welcome-banner reveal">
      <div class="banner-ring"></div>
      <div class="welcome-content">
        <div>
          <div class="welcome-kicker">学生工作台</div>
          <h2 class="welcome-title">{{ greeting }}，{{ userStore.username }}</h2>
          <p class="welcome-subtitle">{{ termName }} · 资助申请与评定进度都在这里</p>
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

    <!-- 我的申请状态概览 -->
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

    <!-- 快捷入口：直达各功能页 -->
    <section class="quick-section reveal">
      <div class="section-head">
        <span class="section-title">快捷入口</span>
        <span class="section-en">QUICK LINKS</span>
      </div>
      <div class="quick-grid">
        <div v-for="q in quickLinks" :key="q.title" class="quick-item" @click="goTo(q.path)">
          <div class="q-icon-box" :style="{ background: q.bg, color: q.color }">
            <el-icon :size="20"><component :is="q.icon" /></el-icon>
          </div>
          <div class="q-text">
            <div class="q-title">{{ q.title }}</div>
            <div class="q-desc">{{ q.desc }}</div>
          </div>
          <el-icon class="q-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </section>

    <!-- 评定进度 + 最新公示速报 -->
    <el-row :gutter="20" class="bottom-row reveal">
      <el-col :span="14" :xs="24">
        <el-card shadow="never" class="h-card">
          <template #header>
            <div class="card-header">
              <span>我的评定进度</span>
              <el-link type="primary" underline="never" @click="goTo('/student/application')">查看全部申请 →</el-link>
            </div>
          </template>
          <div v-if="hasApplication" class="steps-wrap">
            <el-steps :active="activeStep" align-center finish-status="success">
              <el-step title="提交申请" description="提交资助申请材料" />
              <el-step title="教师评分" description="辅导员综合评分" />
              <el-step title="AHP评定" description="层次分析法评定等级" />
              <el-step title="结果公示" description="评定结果统一公示" />
            </el-steps>
            <div v-if="rejectedCount > 0" class="reject-tip">
              <el-icon :size="14"><WarningFilled /></el-icon>
              有 {{ rejectedCount }} 条申请被驳回，可查看审核意见后调整重新提交
            </div>
            <div v-else-if="activeStep >= 4" class="done-tip">
              <el-icon :size="14"><CircleCheckFilled /></el-icon>
              您的申请已完成全部评定流程，结果已公示
            </div>
            <div v-else-if="nextTip" class="next-tip">
              <el-icon :size="14"><InfoFilled /></el-icon>
              {{ nextTip }}
            </div>
          </div>
          <el-empty v-else description="本学期暂未提交申请，可前往「我的申请」发起" :image-size="80">
            <el-button type="primary" @click="goTo('/student/application')">去申请</el-button>
          </el-empty>
        </el-card>
      </el-col>
      <el-col :span="10" :xs="24">
        <el-card shadow="never" class="h-card">
          <template #header>
            <div class="card-header">
              <span>最新公示速报</span>
              <el-link type="primary" underline="never" @click="goTo('/student/notice')">查看全部 →</el-link>
            </div>
          </template>
          <ul v-if="notices.length" class="notice-list">
            <li
              v-for="item in notices"
              :key="item.id"
              class="notice-item"
              @click="viewNotice(item)"
            >
              <div class="notice-main">
                <div class="notice-title">{{ item.title }}</div>
                <div class="notice-meta">{{ item.typeName }} · {{ item.publisherName }}</div>
              </div>
              <span class="notice-tag" :class="noticeTagClass(item)">{{ noticeTagText(item) }}</span>
            </li>
          </ul>
          <el-empty v-else description="暂无公示信息" :image-size="70" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 公示详情弹窗（首页直达） -->
    <el-dialog v-model="detailVisible" title="公示详情" width="700px" append-to-body>
      <el-descriptions :column="2" border v-if="detail" style="margin-bottom: 20px">
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="助学金类型">{{ detail.typeName }}</el-descriptions-item>
        <el-descriptions-item label="发布人">{{ detail.publisherName }}</el-descriptions-item>
        <el-descriptions-item label="公示时间">{{ detail.startTime }} ~ {{ detail.endTime }}</el-descriptions-item>
        <el-descriptions-item label="公示内容" :span="2">{{ detail.content }}</el-descriptions-item>
      </el-descriptions>
      <h3 style="margin-bottom: 12px">受助学生名单</h3>
      <el-table :data="detail?.students || []" border>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="studentName" label="姓名" />
        <el-table-column prop="studentNo" label="学号" />
        <el-table-column prop="levelName" label="等级" />
        <el-table-column prop="grantAmount" label="资助金额(元)" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getMyApplications, getNoticePage, getNoticeDetail } from '@/api/studentUser'

const router = useRouter()
const userStore = useUserStore()

const applications = ref([])
const notices = ref([])

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

// 学期信息（与管理端一致的计算规则）
const TERM_START = '2026-09-07'
const termName = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return m >= 9 ? `${y} - ${y + 1} 秋季学期` : `${y - 1} - ${y} 春季学期`
})

// ============ 申请状态汇总（status: 0待审核 1已通过 2已驳回 3已评分 4已评定 5已公示） ============
const totalCount = computed(() => applications.value.length)
const pendingCount = computed(() => applications.value.filter(a => a.status === 0).length)
const rejectedCount = computed(() => applications.value.filter(a => a.status === 2).length)
const evaluatingCount = computed(() => applications.value.filter(a => [1, 3, 4].includes(a.status)).length)
const publishedCount = computed(() => applications.value.filter(a => a.status === 5).length)
const hasApplication = computed(() => totalCount.value > 0)

const statCards = computed(() => [
  { title: '我的申请', value: totalCount.value, icon: 'Document', color: '#1d3a6e', bg: 'rgba(29,58,110,0.08)', path: '/student/application' },
  { title: '审核中', value: pendingCount.value, icon: 'Clock', color: '#5f7396', bg: 'rgba(138,155,184,0.16)', path: '/student/application' },
  { title: '评定进行中', value: evaluatingCount.value, icon: 'EditPen', color: '#3f644f', bg: 'rgba(79,125,99,0.14)', path: '/student/application' },
  { title: '已公示', value: publishedCount.value, icon: 'Bell', color: '#8d6e32', bg: 'rgba(176,138,62,0.14)', path: '/student/notice' }
])

// ============ 快捷入口：直达各功能页 ============
const quickLinks = [
  { title: '申请资助', desc: '浏览可申请的助学金类型', icon: 'Money', color: '#1d3a6e', bg: 'rgba(29,58,110,0.08)', path: '/student/apply' },
  { title: '我的申请', desc: '跟踪评定四步进度', icon: 'Document', color: '#3f644f', bg: 'rgba(79,125,99,0.14)', path: '/student/application' },
  { title: '公示查看', desc: '最新公示与受助名单', icon: 'Bell', color: '#8d6e32', bg: 'rgba(176,138,62,0.14)', path: '/student/notice' },
  { title: '政策须知', desc: '评定办法与评分权重', icon: 'Reading', color: '#1d3a6e', bg: 'rgba(29,58,110,0.08)', path: '/student/policy' },
  { title: '帮助中心', desc: '常见问题解答', icon: 'QuestionFilled', color: '#3f644f', bg: 'rgba(79,125,99,0.14)', path: '/student/faq' },
  { title: '我的资料', desc: '学籍信息查询', icon: 'Postcard', color: '#5f7396', bg: 'rgba(138,155,184,0.16)', path: '/student/profile' }
]

// ============ 评定进度步骤条：取所有申请中最超前的阶段 ============
// status → 已完成步骤数：0/2→1（提交完成） 3→2 4→3 5→4
const activeStep = computed(() => {
  const map = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 3, 5: 4 }
  return applications.value.reduce((max, a) => Math.max(max, map[a.status] ?? 0), 0)
})

// ============ "下一步"动态状态提示 ============
const nextTip = computed(() => {
  if (activeStep.value === 1) return '申请已提交，等待辅导员综合评分'
  if (activeStep.value === 2) return '评分已完成，进入 AHP 评定阶段'
  if (activeStep.value === 3) return '评定已完成，等待学校统一公示'
  return ''
})

// ============ 公示详情弹窗（首页直达） ============
const detailVisible = ref(false)
const detail = ref(null)
async function viewNotice(item) {
  const res = await getNoticeDetail(item.id)
  detail.value = res.data
  detailVisible.value = true
}

// ============ 公示速报标签 ============
function noticeTagClass(item) {
  if (item.status === 1) return 'n-active'
  if (item.status === 2) return 'n-ended'
  return 'n-wait'
}
function noticeTagText(item) {
  if (item.status === 1) return '公示中'
  if (item.status === 2) return '已结束'
  return '未发布'
}

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
    const res = await getMyApplications({ page: 1, size: 50 })
    applications.value = res.rows || res.data?.rows || []
  } catch (err) {}
  try {
    const res = await getNoticePage({ page: 1, size: 3 })
    notices.value = res.rows || res.data?.rows || []
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
  top: 18px;
  right: 18px;
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

/* ============ 快捷入口 ============ */
.quick-section {
  margin-bottom: 20px;
}
.section-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #c9a24e;
}
.section-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 1px;
}
.section-en {
  font-size: 10px;
  letter-spacing: 3px;
  color: #a1792f;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.quick-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 12px;
  padding: 16px 18px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.quick-item:hover {
  transform: translateY(-2px);
  border-color: rgba(201, 162, 78, 0.55);
  box-shadow: 0 8px 20px rgba(15, 31, 61, 0.08);
}
.q-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.q-text {
  flex: 1;
  min-width: 0;
}
.q-title {
  font-size: 14px;
  font-weight: 600;
  color: #22344f;
}
.q-desc {
  font-size: 12px;
  color: #8a94a6;
  margin-top: 3px;
}
.q-arrow {
  color: #c9cfdb;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.quick-item:hover .q-arrow {
  color: #c9a24e;
  transform: translateX(3px);
}

/* ============ 进度 + 速报 ============ */
.bottom-row :deep(.el-card) {
  height: 100%;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.steps-wrap {
  padding: 18px 6px 8px;
}
.reject-tip {
  margin-top: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ae4a45;
  background: rgba(174, 74, 69, 0.08);
  border-radius: 8px;
  padding: 10px 14px;
}
.done-tip {
  margin-top: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4f7d63;
  background: rgba(79, 125, 99, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
}
.next-tip {
  margin-top: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1d3a6e;
  background: rgba(29, 58, 110, 0.06);
  border-radius: 8px;
  padding: 10px 14px;
}

/* ============ 公示速报 ============ */
.notice-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.notice-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.notice-item:hover {
  background: #f6f8fb;
}
.notice-item + .notice-item {
  border-top: 1px dashed #ebeef3;
}
.notice-main {
  flex: 1;
  min-width: 0;
}
.notice-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #20293a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notice-meta {
  font-size: 12px;
  color: #8a94a6;
  margin-top: 4px;
}
.notice-tag {
  flex-shrink: 0;
  font-size: 11.5px;
  padding: 2px 10px;
  border-radius: 99px;
}
.n-active { background: rgba(201, 162, 78, 0.14); color: #8d6e32; }
.n-ended { background: rgba(90, 107, 132, 0.1); color: #5a6b84; }
.n-wait { background: rgba(90, 107, 132, 0.1); color: #5a6b84; }

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .quick-grid {
    grid-template-columns: 1fr 1fr;
  }
  .stat-row .el-col {
    margin-bottom: 14px;
  }
  .bottom-row .el-col + .el-col {
    margin-top: 14px;
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
