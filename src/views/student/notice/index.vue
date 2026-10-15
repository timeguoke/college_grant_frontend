<template>
  <div class="page-enter notice-page">
    <!-- 开放页头：kicker + 标题 + 统计摘要 -->
    <header class="page-head reveal">
      <div class="head-left">
        <div class="page-kicker">PUBLIC NOTICES</div>
        <h2 class="page-title">公示查看</h2>
        <p class="page-sub">助学金评定结果公示与受助名单查询</p>
      </div>
      <div class="head-summary">
        <div class="summary-item">
          <div class="summary-num">{{ tableData.length }}</div>
          <div class="summary-label">全部批次</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ activeCount }}</div>
          <div class="summary-label">公示中</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ endedCount }}</div>
          <div class="summary-label">已结束</div>
        </div>
      </div>
    </header>

    <el-card shadow="never" class="reveal">
      <!-- 公示卡片列表 -->
      <div v-loading="loading" class="notice-list">
        <el-empty v-if="!loading && !tableData.length" description="暂无公示信息" />
        <div
          v-for="row in tableData"
          :key="row.id"
          class="notice-card"
          :class="'is-' + noticeState(row)"
          @click="viewDetail(row)"
        >
          <div class="nc-main">
            <div class="nc-top">
              <span class="nc-state" :class="'st-' + noticeState(row)">
                <span v-if="noticeState(row) === 'active'" class="pulse"></span>
                {{ noticeState(row) === 'active' ? '公示中' : noticeState(row) === 'pending' ? '未开始' : '已结束' }}
              </span>
              <span v-if="noticeState(row) === 'active' && remainText(row)" class="nc-remain">{{ remainText(row) }}</span>
              <span class="nc-type">{{ row.typeName }}</span>
            </div>
            <h3 class="nc-title">{{ row.title }}</h3>
            <div class="nc-meta">
              <span class="nc-period">公示期 {{ (row.startTime || '').slice(0, 10) }} ~ {{ (row.endTime || '').slice(0, 10) }}</span>
              <span class="nc-sep">·</span>
              <span class="nc-publisher">发布人 {{ row.publisherName || '—' }}</span>
            </div>
          </div>
          <el-button link type="primary" class="nc-btn">查看详情 →</el-button>
        </div>
      </div>

      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <!-- 公示与异议流程指引 -->
    <el-card shadow="never" class="flow-card reveal">
      <div class="flow-title">公示与异议流程</div>
      <div class="flow-steps">
        <div class="flow-step">
          <div class="flow-num">01</div>
          <div class="flow-body">
            <div class="flow-name">成绩汇总</div>
            <div class="flow-desc">任课教师完成综合评分</div>
          </div>
        </div>
        <div class="flow-divider"></div>
        <div class="flow-step">
          <div class="flow-num">02</div>
          <div class="flow-body">
            <div class="flow-name">AHP 评定</div>
            <div class="flow-desc">按权重模型计算排名</div>
          </div>
        </div>
        <div class="flow-divider"></div>
        <div class="flow-step">
          <div class="flow-num">03</div>
          <div class="flow-body">
            <div class="flow-name">名单公示</div>
            <div class="flow-desc">公示期内接受全校监督</div>
          </div>
        </div>
        <div class="flow-divider"></div>
        <div class="flow-step">
          <div class="flow-num">04</div>
          <div class="flow-body">
            <div class="flow-name">异议反馈</div>
            <div class="flow-desc">对名单有异议，可在公示期内通过辅导员提交书面反馈</div>
          </div>
        </div>
      </div>
    </el-card>

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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { getNoticePage, getNoticeDetail } from '@/api/studentUser'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const detailVisible = ref(false)
const detail = ref(null)

const queryForm = reactive({ page: 1, size: 10 })

// ============ 统计摘要 ============
const activeCount = computed(() => tableData.value.filter(r => noticeState(r) === 'active').length)
const endedCount = computed(() => tableData.value.filter(r => noticeState(r) === 'ended').length)

// ============ 公示状态（由时间推算，不依赖后端字段） ============
function parseTime(str) {
  if (!str) return null
  const d = new Date(String(str).replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d.getTime()
}
function noticeState(row) {
  const now = Date.now()
  const s = parseTime(row.startTime)
  const e = parseTime(row.endTime)
  if (s && now < s) return 'pending'
  if (e && now > e) return 'ended'
  return 'active'
}
// 公示中倒计时文案
function remainText(row) {
  const e = parseTime(row.endTime)
  if (!e) return ''
  const diff = e - Date.now()
  if (diff <= 0) return ''
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days >= 1) return `剩余 ${days} 天`
  if (hours >= 1) return `剩余 ${hours} 小时`
  return '今日截止'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getNoticePage(queryForm)
    tableData.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {} finally {
    loading.value = false
  }
  nextTick(setupReveal)
}

async function viewDetail(row) {
  const res = await getNoticeDetail(row.id)
  detail.value = res.data
  detailVisible.value = true
}

// ============ 滚动渐入动效 ============
function setupReveal() {
  const els = document.querySelectorAll('.notice-page .reveal')
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

onMounted(() => loadData())
</script>

<style scoped>
/* ============ 开放页头 ============ */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 6px 4px 20px;
  border-bottom: 1px solid #e2e7ef;
  margin-bottom: 22px;
}
.page-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 4px;
  color: #a1792f;
  margin-bottom: 10px;
}
.page-kicker::before {
  content: '';
  width: 26px;
  height: 2px;
  background: #c9a24e;
}
.page-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1d3a6e;
  margin: 0 0 8px;
}
.page-sub {
  font-size: 13px;
  color: #5d6b80;
  margin: 0;
  letter-spacing: 0.5px;
}
.head-summary {
  display: flex;
  gap: 14px;
}
.summary-item {
  min-width: 86px;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 10px;
  padding: 12px 18px;
  text-align: center;
}
.summary-num {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  color: #1d3a6e;
  font-variant-numeric: tabular-nums;
}
.summary-label {
  font-size: 12px;
  color: #8a94a6;
  margin-top: 6px;
  letter-spacing: 0.5px;
}

/* ============ 公示卡片列表 ============ */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 160px;
}
.notice-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-left: 4px solid #c9cfdb;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.notice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 31, 61, 0.08);
}
.notice-card.is-active {
  border-left-color: #c9a24e;
}
.notice-card.is-active:hover {
  border-color: rgba(201, 162, 78, 0.55);
}
.notice-card.is-ended {
  opacity: 0.88;
}
.nc-main {
  flex: 1;
  min-width: 0;
}
.nc-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.nc-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  border-radius: 99px;
  padding: 2px 10px;
  letter-spacing: 0.5px;
}
.st-active { color: #8d6e32; background: rgba(201, 162, 78, 0.16); }
.st-pending { color: #5f7396; background: rgba(138, 155, 184, 0.16); }
.st-ended { color: #8a94a6; background: rgba(138, 148, 166, 0.14); }
.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c9a24e;
  animation: pulse 1.8s ease-out infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(201, 162, 78, 0.45); }
  70% { box-shadow: 0 0 0 6px rgba(201, 162, 78, 0); }
  100% { box-shadow: 0 0 0 0 rgba(201, 162, 78, 0); }
}
.nc-remain {
  font-size: 12px;
  color: #8d6e32;
  font-weight: 600;
}
.nc-type {
  margin-left: auto;
  font-size: 12px;
  color: #1d3a6e;
  background: rgba(29, 58, 110, 0.07);
  border-radius: 99px;
  padding: 2px 10px;
}
.nc-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 16px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8a94a6;
}
.nc-sep { color: #c9cfdb; }
.nc-btn { flex-shrink: 0; }
.notice-card:hover .nc-btn { color: #8d6e32; }

/* ============ 分页 ============ */
.pagination { margin-top: 18px; display: flex; justify-content: flex-end; }

/* ============ 公示与异议流程卡 ============ */
.flow-card {
  margin-top: 18px;
}
.flow-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 1px;
  margin-bottom: 16px;
}
.flow-steps {
  display: flex;
  align-items: stretch;
  gap: 14px;
}
.flow-step {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.flow-num {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 22px;
  font-weight: 700;
  color: #c9a24e;
  line-height: 1.1;
}
.flow-body {
  flex: 1;
  min-width: 0;
}
.flow-name {
  font-size: 13px;
  font-weight: 600;
  color: #1d3a6e;
  margin-bottom: 4px;
}
.flow-desc {
  font-size: 12px;
  color: #8a94a6;
  line-height: 1.6;
}
.flow-divider {
  width: 1px;
  background: #e2e7ef;
  align-self: stretch;
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .head-summary {
    align-self: stretch;
    justify-content: flex-start;
  }
  .flow-steps {
    flex-direction: column;
    gap: 12px;
  }
  .flow-divider {
    width: auto;
    height: 1px;
    align-self: stretch;
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
