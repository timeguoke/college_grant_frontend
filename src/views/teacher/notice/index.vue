<template>
  <div class="page-enter teacher-notice">
    <!-- 页头 -->
    <div class="page-head reveal">
      <div class="kicker"><span class="kicker-bar"></span>PUBLIC NOTICES</div>
      <h2 class="page-title">公示查看</h2>
      <div class="stats-row">
        <div class="stat-mini">
          <div class="stat-num">{{ total }}</div>
          <div class="stat-label">全部批次</div>
        </div>
        <div class="stat-mini">
          <div class="stat-num">{{ activeCount }}</div>
          <div class="stat-label">公示中</div>
        </div>
        <div class="stat-mini">
          <div class="stat-num">{{ endedCount }}</div>
          <div class="stat-label">已结束</div>
        </div>
        <div class="stat-mini">
          <div class="stat-num gold-num">{{ studentTotal }}</div>
          <div class="stat-label">覆盖学生</div>
        </div>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar reveal" style="margin-bottom:16px">
      <el-input v-model="keyword" placeholder="搜索公示标题" clearable style="width:180px" @clear="loadData" @keyup.enter="loadData" />
      <el-select v-model="statusFilter" placeholder="公示状态" clearable style="width:180px" @change="loadData">
        <el-option label="公示中" value="active" />
        <el-option label="已结束" value="ended" />
        <el-option label="未开始" value="pending" />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
    </div>

    <!-- 公示卡片列表 -->
    <div class="notice-list reveal" v-loading="loading">
      <div v-for="item in noticeList" :key="item.id" class="notice-card" :class="getStatusClass(item)" @click="showDetail(item)">
        <div class="card-left-bar" :class="getStatusClass(item)"></div>
        <div class="card-body">
          <div class="card-top">
            <div class="notice-title">{{ item.title }}</div>
            <div class="notice-tags">
              <span class="status-dot" :class="getStatusClass(item)"></span>
              <span class="status-text" :class="getStatusClass(item)">{{ getStatusText(item) }}</span>
              <span v-if="isAlive(item)" class="countdown">{{ getCountdown(item) }}</span>
            </div>
          </div>
          <div class="card-info">
            <span class="info-item">公示期：{{ formatDate(item.startTime) }} ~ {{ formatDate(item.endTime) }}</span>
            <span class="info-sep">|</span>
            <span class="info-item">发布人：{{ item.publisherName || '资助管理中心' }}</span>
            <template v-if="item.studentCount">
              <span class="info-sep">|</span>
              <span class="info-item count-badge">名单 {{ item.studentCount }} 人</span>
            </template>
          </div>
          <!-- 名单预览：前3名 -->
          <div v-if="item.preview && item.preview.length" class="card-preview">
            <div v-for="(stu, idx) in item.preview" :key="stu.studentNo" class="preview-item">
              <span class="preview-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</span>
              <span class="preview-name">{{ stu.studentName }}</span>
              <span class="preview-level" :class="levelClass(stu.levelName)">{{ stu.levelName }}</span>
            </div>
            <span class="preview-more">查看全部 ›</span>
          </div>
        </div>
        <div class="card-arrow">›</div>
      </div>
      <el-empty v-if="!loading && noticeList.length === 0" description="暂无公示" />
    </div>

    <!-- 分页 -->
    <div class="pager reveal" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </div>

    <!-- 底部流程指引 -->
    <div class="process-guide reveal">
      <div class="guide-title">公示与异议流程</div>
      <div class="guide-steps">
        <div class="guide-step"><span class="step-num">01</span><span class="step-text">成绩汇总</span></div>
        <div class="step-divider"></div>
        <div class="guide-step"><span class="step-num">02</span><span class="step-text">AHP 评定</span></div>
        <div class="step-divider"></div>
        <div class="guide-step"><span class="step-num">03</span><span class="step-text">名单公示</span></div>
        <div class="step-divider"></div>
        <div class="guide-step"><span class="step-num">04</span><span class="step-text">异议反馈</span></div>
      </div>
      <div class="guide-note">对公示名单有异议，可在公示期内通过辅导员提交书面反馈</div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="公示详情" width="720px" class="notice-dialog" append-to-body>
      <div v-if="currentDetail" class="detail-content">
        <h3 class="detail-title">{{ currentDetail.title }}</h3>
        <div class="detail-info">
          <span>公示期：{{ formatDate(currentDetail.startTime) }} ~ {{ formatDate(currentDetail.endTime) }}</span>
          <span>发布人：{{ currentDetail.publisherName || '资助管理中心' }}</span>
        </div>
        <el-divider />
        <div class="detail-body" v-html="currentDetail.content"></div>
        <div v-if="currentDetail.students && currentDetail.students.length" class="student-list">
          <h4 class="list-title">受助学生名单</h4>
          <el-table :data="currentDetail.students" border stripe size="small">
            <el-table-column prop="studentNo" label="学号" min-width="120" class-name="num-col" />
            <el-table-column prop="studentName" label="姓名" min-width="80" />
            <el-table-column prop="typeName" label="助学金类型" min-width="120" />
            <el-table-column prop="levelName" label="等级" min-width="80" />
            <el-table-column prop="amount" label="资助金额(元)" min-width="120" class-name="num-col amount-col">
              <template #default="{ row }"><span class="amount-val">¥{{ formatAmount(row.amount) }}</span></template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getNoticeList, getNoticeDetail } from '@/api/teacher'

const keyword = ref('')
const statusFilter = ref('')
const noticeList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const detailVisible = ref(false)
const currentDetail = ref(null)

const activeCount = ref(0)
const endedCount = ref(0)

// 覆盖学生总数（各批次名单预览加载后自动更新）
const studentTotal = computed(() => noticeList.value.reduce((s, i) => s + (i.studentCount || 0), 0))

function levelClass(lv) {
  if (lv === '一等') return 'lv-1'
  if (lv === '二等') return 'lv-2'
  if (lv === '三等') return 'lv-3'
  return ''
}

function getStatusClass(item) {
  const now = new Date()
  const start = new Date(item.startTime)
  const end = new Date(item.endTime)
  if (now < start) return 'pending'
  if (now >= start && now <= end) return 'active'
  return 'ended'
}

function getStatusText(item) {
  const cls = getStatusClass(item)
  if (cls === 'pending') return '未开始'
  if (cls === 'active') return '公示中'
  return '已结束'
}

function isAlive(item) {
  return getStatusClass(item) === 'active'
}

function getCountdown(item) {
  const end = new Date(item.endTime)
  const now = new Date()
  const diff = end - now
  if (diff <= 0) return ''
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `剩余 ${days} 天`
  if (hours > 0) return `剩余 ${hours} 小时`
  return '今日截止'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function formatAmount(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString()
}

async function loadData() {
  loading.value = true
  try {
    const res = await getNoticeList({ page: currentPage.value, size: pageSize.value, keyword: keyword.value })
    let rows = res.rows || res.data?.rows || []
    if (statusFilter.value) {
      rows = rows.filter(i => getStatusClass(i) === statusFilter.value)
    }
    noticeList.value = rows
    total.value = statusFilter.value ? rows.length : (res.total || res.data?.total || 0)
    activeCount.value = noticeList.value.filter(i => getStatusClass(i) === 'active').length
    endedCount.value = noticeList.value.filter(i => getStatusClass(i) === 'ended').length
    // 异步加载各批次名单预览（前3名）
    loadPreviews(noticeList.value)
  } catch (err) {
    console.error('加载公示失败', err)
  } finally {
    loading.value = false
  }
}

// 逐个批次拉取名单，取前3名做卡片预览，同时统计名单总人数
async function loadPreviews(rows) {
  for (const item of rows) {
    try {
      const res = await getNoticeDetail(item.id)
      const detail = res.data?.[0] || res.data || {}
      const students = detail.students || []
      item.preview = students.slice(0, 3)
      item.studentCount = students.length
    } catch (e) {
      // 单个批次预览失败不影响页面
    }
  }
}

async function showDetail(item) {
  try {
    const res = await getNoticeDetail(item.id)
    currentDetail.value = res.data?.[0] || res.data || res.rows?.[0] || item
    detailVisible.value = true
  } catch (err) {
    currentDetail.value = item
    detailVisible.value = true
  }
}

function setupReveal() {
  nextTick(() => {
    const els = document.querySelectorAll('.teacher-notice .reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-in')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.05 })
    els.forEach(el => io.observe(el))
  })
}

onMounted(async () => {
  await loadData()
  setupReveal()
})
</script>

<style scoped>
.teacher-notice { width: calc(100% - 100px) !important; margin: 0 auto; padding: 20px 0; }
.page-head { margin-bottom: 20px; }
.kicker { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 2px; color: #c9a24e; font-weight: 600; margin-bottom: 4px; }
.kicker-bar { width: 20px; height: 2px; background: #c9a24e; }
.page-title { font-family: 'Georgia', 'Noto Serif SC', serif; font-size: 22px; color: #1d3a6e; margin: 0 0 12px; }
.stats-row { display: flex; gap: 16px; }
.stat-mini { background: #f8f9fb; border: 1px solid #e8ecf1; border-radius: 8px; padding: 8px 16px; }
.stat-num { font-family: Georgia, serif; font-size: 22px; color: #1d3a6e; font-weight: 700; font-variant-numeric: tabular-nums; }
.stat-num.gold-num { color: #c9a24e; }
.stat-label { font-size: 12px; color: #889; }
.search-bar { display: flex; gap: 8px; }
.notice-list { display: flex; flex-direction: column; gap: 12px; }
.notice-card { display: flex; align-items: center; gap: 0; background: #fff; border: 1px solid #e8ecf1; border-radius: 10px; overflow: hidden; cursor: pointer; transition: all .25s; padding-right: 16px; }
.notice-card:hover { box-shadow: 0 4px 16px rgba(29,58,110,.08); transform: translateY(-1px); }
.card-left-bar { width: 4px; align-self: stretch; }
.card-left-bar.active { background: #c9a24e; }
.card-left-bar.pending { background: #b0c4de; }
.card-left-bar.ended { background: #ccc; }
.card-body { flex: 1; padding: 14px 16px; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.notice-title { font-family: Georgia, 'Noto Serif SC', serif; font-size: 15px; color: #1d3a6e; font-weight: 600; }
.notice-tags { display: flex; align-items: center; gap: 6px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; }
.status-dot.active { background: #c9a24e; animation: pulse 2s infinite; }
.status-dot.pending { background: #b0c4de; }
.status-dot.ended { background: #ccc; }
.status-text { font-size: 12px; font-weight: 600; }
.status-text.active { color: #c9a24e; }
.status-text.pending { color: #7b9; }
.status-text.ended { color: #aaa; }
.countdown { font-size: 11px; color: #c9a24e; background: #fdf8ec; padding: 2px 8px; border-radius: 10px; }
.card-info { font-size: 12px; color: #889; display: flex; gap: 8px; align-items: center; }
.count-badge { color: #c9a24e; font-weight: 700; font-variant-numeric: tabular-nums; }

/* 名单预览：前3名 */
.card-preview { display: flex; align-items: center; gap: 14px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #eef0f3; flex-wrap: wrap; }
.preview-item { display: flex; align-items: center; gap: 5px; font-size: 12px; }
.preview-rank { width: 16px; height: 16px; border-radius: 50%; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-variant-numeric: tabular-nums; }
.preview-rank.rank-1 { background: linear-gradient(135deg, #f5d576, #c9a24e); }
.preview-rank.rank-2 { background: linear-gradient(135deg, #e3e8ee, #aeb6c2); }
.preview-rank.rank-3 { background: linear-gradient(135deg, #dba27e, #b06b42); }
.preview-name { color: #334; font-weight: 600; }
.preview-level { font-size: 11px; padding: 1px 6px; border-radius: 3px; }
.preview-level.lv-1 { background: #fdf3dc; color: #b8862b; }
.preview-level.lv-2 { background: #eef1f5; color: #8a919e; }
.preview-level.lv-3 { background: #f9ece4; color: #a5694b; }
.preview-more { margin-left: auto; font-size: 12px; color: #c9a24e; font-weight: 600; }
.info-sep { color: #ddd; }
.card-arrow { font-size: 20px; color: #ccc; }
.notice-card:hover .card-arrow { color: #c9a24e; }
.pager { display: flex; justify-content: center; margin: 20px 0; }
.process-guide { background: #f8f9fb; border: 1px solid #e8ecf1; border-radius: 10px; padding: 20px; margin-top: 20px; }
.guide-title { font-family: Georgia, 'Noto Serif SC', serif; font-size: 15px; color: #1d3a6e; font-weight: 600; margin-bottom: 14px; }
.guide-steps { display: flex; align-items: center; gap: 0; }
.guide-step { display: flex; align-items: center; gap: 8px; }
.step-num { font-family: Georgia, serif; font-size: 20px; color: #c9a24e; font-weight: 700; }
.step-text { font-size: 13px; color: #1d3a6e; }
.step-divider { width: 40px; height: 1px; background: #ddd; margin: 0 12px; }
.guide-note { font-size: 12px; color: #889; margin-top: 12px; }
.amount-val { color: #b8860b; font-weight: 600; font-variant-numeric: tabular-nums; }
:deep(.num-col) { font-variant-numeric: tabular-nums; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
.reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
.reveal-in { opacity: 1; transform: translateY(0); }
</style>
