<template>
  <div class="page-enter application-page">
    <!-- 开放页头：kicker + 标题 + 视图切换 + 统计摘要 -->
    <header class="page-head reveal">
      <div class="head-left">
        <div class="page-kicker">MY APPLICATIONS</div>
        <h2 class="page-title">我的申请</h2>
        <p class="page-sub">查看每条申请的审核进度与评定结果</p>
      </div>
      <div class="head-right">
        <el-radio-group v-model="viewMode" class="view-switch">
          <el-radio-button label="card">
            <el-icon><Postcard /></el-icon> 卡片
          </el-radio-button>
          <el-radio-button label="timeline">
            <el-icon><Clock /></el-icon> 时间线
          </el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Plus" @click="openDialog">提交申请</el-button>
        <div class="head-summary">
          <div class="summary-item">
            <div class="summary-num">{{ tableData.length }}</div>
            <div class="summary-label">总申请</div>
          </div>
          <div class="summary-item">
            <div class="summary-num">{{ processingCount }}</div>
            <div class="summary-label">流程中</div>
          </div>
          <div class="summary-item">
            <div class="summary-num">{{ publishedCount }}</div>
            <div class="summary-label">已公示</div>
          </div>
        </div>
      </div>
    </header>

    <el-card shadow="never" class="reveal">
      <!-- 空状态引导 -->
      <div v-if="!loading && !tableData.length" class="empty-guide">
        <div class="empty-icon">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <h3 class="empty-title">还没有申请记录</h3>
        <p class="empty-desc">浏览可申请的助学金类型，开启你的第一次申请</p>
        <el-button type="primary" @click="goApply">去申请资助</el-button>
      </div>

      <template v-else>
        <!-- ============ 卡片网格视图（默认） ============ -->
        <div v-if="viewMode === 'card'" v-loading="loading" class="card-grid">
          <div v-for="row in tableData" :key="row.id" class="app-card" @click="viewDetail(row)">
            <div class="tl-top">
              <span class="tl-name">{{ row.typeName }}</span>
              <span class="tl-tag" :class="tagCls(row)">{{ statusNames[row.status] || '未知' }}</span>
            </div>
            <div class="step-bar">
              <template v-for="(sn, i) in stageNames" :key="i">
                <span class="st" :class="dotClass(row, i)"></span>
                <span class="st-name">{{ sn }}</span>
                <span v-if="i < 3" class="stl" :class="{ done: stageOf(row) > i }"></span>
              </template>
            </div>
            <div class="tl-meta">
              <span v-if="amountOf(row)" class="tl-amount">{{ amountOf(row).label }} ¥{{ fmtAmount(amountOf(row).v) }}</span>
              <span class="tl-time">申请于 {{ (row.createTime || '').slice(0, 10) }}</span>
            </div>
            <div v-if="row.reviewComment" class="tl-op"><b>审核意见：</b>{{ row.reviewComment }}</div>
            <div class="card-foot">
              <span class="tl-link">查看详情 →</span>
            </div>
          </div>
        </div>

        <!-- ============ 时间线视图 ============ -->
        <div v-else v-loading="loading" class="timeline-view">
          <div class="tl">
            <div v-for="row in sortedData" :key="row.id" class="tl-item">
              <span class="tl-dot" :class="nodeCls(row)"></span>
              <div class="tl-card" @click="viewDetail(row)">
                <div class="tl-top">
                  <span class="tl-name">{{ row.typeName }}</span>
                  <span class="tl-tag" :class="tagCls(row)">{{ statusNames[row.status] || '未知' }}</span>
                </div>
                <div class="step-bar">
                  <template v-for="(sn, i) in stageNames" :key="i">
                    <span class="st" :class="dotClass(row, i)"></span>
                    <span class="st-name">{{ sn }}</span>
                    <span v-if="i < 3" class="stl" :class="{ done: stageOf(row) > i }"></span>
                  </template>
                </div>
                <div class="tl-meta">
                  <span v-if="amountOf(row)" class="tl-amount">{{ amountOf(row).label }} ¥{{ fmtAmount(amountOf(row).v) }}</span>
                  <span class="tl-time">申请于 {{ (row.createTime || '').slice(0, 10) }}</span>
                  <span class="tl-link">查看详情 →</span>
                </div>
                <div v-if="row.reviewComment" class="tl-op"><b>审核意见：</b>{{ row.reviewComment }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-card>

    <el-dialog v-model="dialogVisible" title="提交申请" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="助学金类型" prop="typeId">
          <el-select v-model="form.typeId" placeholder="选择助学金类型" style="width: 100%">
            <el-option v-for="t in typeList" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请理由" prop="applyReason">
          <el-input v-model="form.applyReason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="家庭情况" prop="familySituation">
          <el-input v-model="form.familySituation" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="家庭年收入" prop="familyIncome">
          <el-input-number v-model="form.familyIncome" :min="0" :max="99999999" :precision="2" :step="1000" controls-position="right" style="width: 100%" placeholder="本次申请填报" />
        </el-form-item>
        <el-form-item label="家庭人口数" prop="familyMembers">
          <el-input-number v-model="form.familyMembers" :min="1" :max="30" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="人均年收入">
          <span class="per-capita">{{ perCapita === null ? '填写后自动计算' : perCapita + ' 元/人' }}</span>
        </el-form-item>
        <el-form-item label="特殊困难类型">
          <el-select v-model="form.specialType" placeholder="无特殊困难" clearable>
            <el-option label="无" :value="0" />
            <el-option label="建档立卡" :value="1" />
            <el-option label="低保家庭" :value="2" />
            <el-option label="孤儿" :value="3" />
            <el-option label="残疾" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料" v-if="form.specialType > 0">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <el-button type="primary" :icon="Upload">上传文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png/pdf 格式，不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="申请详情" width="500px" append-to-body>
      <el-descriptions :column="1" border v-if="detail">
        <el-descriptions-item label="助学金类型">{{ detail.typeName }}</el-descriptions-item>
        <el-descriptions-item label="申请理由">{{ detail.applyReason }}</el-descriptions-item>
        <el-descriptions-item label="家庭情况">{{ detail.familySituation }}</el-descriptions-item>
        <el-descriptions-item label="家庭年收入">{{ detail.familyIncome != null ? detail.familyIncome + ' 元' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="家庭人口数">{{ detail.familyMembers != null ? detail.familyMembers + ' 人' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="人均年收入">{{ detail.perCapitaIncome != null ? detail.perCapitaIncome + ' 元/人' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="特殊困难">{{ ['', '建档立卡','低保','孤儿','残疾'][detail.specialType] || '无' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusNames[detail.status] || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="审核意见">{{ detail.reviewComment || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Upload, Document, Clock, Postcard } from '@element-plus/icons-vue'
import { getMyApplications, getApplicationDetail, getGrantTypeList, submitApplication, uploadFile } from '@/api/studentUser'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const typeList = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const detail = ref(null)
const formRef = ref()
const currentFile = ref(null)
const viewMode = ref('card')

const statusNames = ['待审核', '已通过', '已驳回', '已评分', '已评定', '已公示']
const stageNames = ['提交', '评分', '评定', '公示']

const form = reactive({
  typeId: null,
  applyReason: '',
  familySituation: '',
  familyIncome: null,
  familyMembers: null,
  specialType: 0,
  specialProof: ''
})
const rules = {
  typeId: [{ required: true, message: '请选择助学金类型', trigger: 'change' }],
  applyReason: [{ required: true, message: '请填写申请理由', trigger: 'blur' }],
  familyIncome: [{ required: true, message: '请填写家庭年收入', trigger: 'change' }],
  familyMembers: [{ required: true, message: '请填写家庭人口数', trigger: 'change' }]
}

// 人均年收入自动计算展示
const perCapita = computed(() => {
  if (form.familyIncome == null || !form.familyMembers) return null
  return (form.familyIncome / form.familyMembers).toFixed(2)
})

// ============ 统计摘要 ============
const processingCount = computed(() => tableData.value.filter(r => [0, 1, 3, 4].includes(r.status)).length)
const publishedCount = computed(() => tableData.value.filter(r => r.status === 5).length)

// ============ 时间线排序（最新在前） ============
const sortedData = computed(() =>
  [...tableData.value].sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
)

// ============ 进度阶段（status: 0待审核 1已通过 2已驳回 3已评分 4已评定 5已公示） ============
// 返回已到达的阶段索引 0-3；驳回返回 -1
function stageOf(row) {
  return { 0: 0, 1: 0, 2: -1, 3: 1, 4: 2, 5: 3 }[row.status] ?? 0
}
function dotClass(row, i) {
  const s = stageOf(row)
  if (s === -1) return i === 0 ? 'reject' : 'future'
  if (i < s) return 'done'
  if (i === s) return s === 3 ? 'done final' : 'current'
  return 'future'
}
// 时间线左侧轴节点颜色
function nodeCls(row) {
  if (row.status === 5) return 's-final'
  if (row.status === 2) return 's-rej'
  if (row.status === 3 || row.status === 4) return 's-doing'
  return 's-wait'
}
// 状态标签语义色
function tagCls(row) {
  return ['t-amber', 't-green', 't-red', 't-blue', 't-blue', 't-green'][row.status] || 't-blue'
}
// 金额展示：优先人均年收入，其次家庭年收入
function amountOf(row) {
  if (row.perCapitaIncome != null) return { label: '人均年收入', v: row.perCapitaIncome }
  if (row.familyIncome != null) return { label: '家庭年收入', v: row.familyIncome }
  return null
}
function fmtAmount(v) {
  return Number(v).toLocaleString('zh-CN')
}

function goApply() {
  router.push('/student/apply')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getMyApplications({ page: 1, size: 20 })
    tableData.value = res.rows || res.data?.rows || []
  } catch (err) {} finally {
    loading.value = false
  }
  nextTick(setupReveal)
}

async function loadTypes() {
  const res = await getGrantTypeList()
  typeList.value = res.data || res.rows || []
}

function openDialog() {
  Object.assign(form, { typeId: null, applyReason: '', familySituation: '', familyIncome: null, familyMembers: null, specialType: 0, specialProof: '' })
  currentFile.value = null
  dialogVisible.value = true
}

function handleFileChange(file) {
  currentFile.value = file.raw
}

async function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      // 如果有特殊困难且上传了文件，先上传
      if (form.specialType > 0 && currentFile.value) {
        const uploadRes = await uploadFile(currentFile.value)
        form.specialProof = uploadRes.data || uploadRes.url || ''
      }
      await submitApplication(form)
      ElMessage.success('申请提交成功')
      dialogVisible.value = false
      loadData()
    } catch (err) {} finally {
      submitting.value = false
    }
  })
}

async function viewDetail(row) {
  const res = await getApplicationDetail(row.id)
  detail.value = res.data
  detailVisible.value = true
}

// ============ 滚动渐入动效 ============
function setupReveal() {
  const els = document.querySelectorAll('.application-page .reveal')
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

onMounted(() => {
  loadTypes()
  loadData()
})
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
.head-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
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

/* ============ 卡片网格视图 ============ */
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  min-height: 160px;
}
.app-card {
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-top: 3px solid #1d3a6e;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.app-card:hover {
  transform: translateY(-3px);
  border-top-color: #c9a24e;
  box-shadow: 0 10px 24px rgba(15, 31, 61, 0.1);
}
.card-foot {
  margin-top: auto;
  padding-top: 12px;
  text-align: right;
}
.app-card:hover .tl-link { color: #8d6e32; }

/* ============ 时间线视图 ============ */
.timeline-view {
  padding: 8px 4px 4px;
  min-height: 160px;
}
.tl {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
}
.tl::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 16px;
  bottom: 16px;
  width: 2px;
  background: #e2e7ef;
  border-radius: 1px;
}
.tl-item {
  position: relative;
  display: flex;
  padding: 8px 0 8px 36px;
}
.tl-dot {
  position: absolute;
  left: 2px;
  top: 30px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 3px solid #ffffff;
  box-sizing: content-box;
  z-index: 1;
}
.tl-dot.s-final { background: #c9a24e; box-shadow: 0 0 0 3px rgba(201, 162, 78, 0.2); }
.tl-dot.s-cur { background: #c9a24e; box-shadow: 0 0 0 3px rgba(201, 162, 78, 0.2); }
.tl-dot.s-doing { background: #1d3a6e; }
.tl-dot.s-wait { background: #b07d3a; }
.tl-dot.s-rej { background: #c4564f; }
.tl-card {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}
.tl-card:hover {
  transform: translateY(-2px);
  border-color: rgba(201, 162, 78, 0.55);
  box-shadow: 0 8px 20px rgba(15, 31, 61, 0.08);
}
.tl-card:hover .tl-link { color: #8d6e32; }

/* ============ 卡片/时间线共用元素 ============ */
.tl-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.tl-name {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 16px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 0.5px;
}
.tl-tag {
  font-size: 12px;
  border-radius: 99px;
  padding: 2px 10px;
  letter-spacing: 0.5px;
}
.t-green { color: #4f7d63; background: rgba(79, 125, 99, 0.12); }
.t-blue { color: #5f7396; background: rgba(138, 155, 184, 0.16); }
.t-amber { color: #b07d3a; background: rgba(176, 125, 58, 0.14); }
.t-red { color: #c4564f; background: rgba(196, 86, 79, 0.14); }

.step-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 6px;
  margin-bottom: 12px;
}
.st {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid #c9cfdb;
  background: #ffffff;
  box-sizing: border-box;
  flex-shrink: 0;
}
.st.done { background: #1d3a6e; border-color: #1d3a6e; }
.st.current { background: #c9a24e; border-color: #c9a24e; box-shadow: 0 0 0 3px rgba(201, 162, 78, 0.2); }
.st.final { background: #c9a24e; border-color: #c9a24e; box-shadow: 0 0 0 3px rgba(201, 162, 78, 0.2); }
.st.reject { background: #c4564f; border-color: #c4564f; }
.st-name {
  font-size: 12px;
  color: #8a94a6;
  margin: 0 10px 0 6px;
}
.stl {
  width: 26px;
  height: 2px;
  background: #e2e7ef;
  margin-right: 10px;
}
.stl.done { background: #1d3a6e; }

.tl-meta {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}
.tl-amount {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 14px;
  font-weight: 700;
  color: #8d6e32;
  font-variant-numeric: tabular-nums;
}
.tl-time {
  font-size: 12px;
  color: #8a94a6;
}
.tl-link {
  font-size: 12px;
  color: #1d3a6e;
  transition: color 0.12s ease;
}
.tl-card .tl-link { margin-left: auto; }
.tl-op {
  font-size: 12px;
  color: #8a94a6;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef3;
}
.tl-op b { color: #5d6b80; font-weight: 600; }

/* ============ 空状态引导 ============ */
.empty-guide {
  padding: 56px 0 48px;
  text-align: center;
}
.empty-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: rgba(29, 58, 110, 0.06);
  color: #1d3a6e;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 17px;
  font-weight: 700;
  color: #1d3a6e;
  margin: 0 0 8px;
}
.empty-desc {
  font-size: 13px;
  color: #8a94a6;
  margin: 0 0 20px;
  letter-spacing: 0.5px;
}

/* ============ 弹窗 ============ */
.per-capita { color: #1d3a6e; font-weight: 600; }

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .head-summary {
    display: none;
  }
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .card-grid {
    grid-template-columns: 1fr;
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
