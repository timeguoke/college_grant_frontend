<template>
  <div class="page-enter apply-page">
    <!-- 页头：kicker + 标题 + 概况摘要 -->
    <header class="page-head reveal">
      <div class="head-left">
        <div class="page-kicker">STUDENT AID APPLICATION</div>
        <h2 class="page-title">申请资助</h2>
        <p class="page-sub">选择适合你的助学金类型，点击卡片即可开始申请</p>
      </div>
      <div class="head-summary">
        <div class="summary-item">
          <div class="summary-num">{{ cardList.length }}</div>
          <div class="summary-label">可申请类型</div>
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
    </header>

    <!-- 卡片网格 -->
    <div v-loading="loading" class="type-grid reveal">
      <div
        v-for="(t, i) in cardList"
        :key="t.id"
        class="type-card"
        :class="{ disabled: !canApply(t) }"
        @click="canApply(t) && openDialog(t)"
      >
        <div class="card-top">
          <div class="card-icon" :style="{ background: iconColors[i % 3][1], color: iconColors[i % 3][0] }">
            <el-icon :size="22"><component :is="cardIcons[i % cardIcons.length]" /></el-icon>
          </div>
          <span class="card-tag" :class="tagClass(t)">{{ tagText(t) }}</span>
        </div>
        <h3 class="card-name">{{ t.typeName }}</h3>
        <p class="card-desc">{{ t.description || '暂无简介' }}</p>
        <div v-if="t.levels && t.levels.length" class="card-levels">
          <div v-for="lv in t.levels" :key="lv.id" class="level-row">
            <span class="level-name">{{ lv.levelName }}</span>
            <span class="level-dots"></span>
            <span class="level-amount">¥{{ formatAmount(lv.amount) }}</span>
          </div>
        </div>
        <div class="card-foot">
          <el-button v-if="canApply(t)" type="primary" @click.stop="openDialog(t)">立即申请</el-button>
          <el-button v-else @click.stop="goMyApplication">查看进度</el-button>
        </div>
      </div>

      <el-empty v-if="!loading && !cardList.length" description="暂无可申请的助学金类型" :image-size="90" />
    </div>

    <!-- 申请流程指引 -->
    <section v-if="cardList.length" class="flow-card reveal">
      <div class="flow-title">申请流程</div>
      <div class="flow-steps">
        <div v-for="(s, i) in flowSteps" :key="s.title" class="flow-step">
          <span class="flow-no">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="flow-info">
            <div class="flow-name">{{ s.title }}</div>
            <div class="flow-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 申请表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="`申请 - ${currentType?.typeName || ''}`" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="助学金类型">
          <span class="type-readonly">{{ currentType?.typeName }}</span>
        </el-form-item>
        <el-form-item label="申请理由" prop="applyReason">
          <el-input v-model="form.applyReason" type="textarea" :rows="3" placeholder="请说明申请该助学金的原因" />
        </el-form-item>
        <el-form-item label="家庭情况" prop="familySituation">
          <el-input v-model="form.familySituation" type="textarea" :rows="3" placeholder="请描述家庭经济状况" />
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
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { getAvailableGrantTypes, getMyApplications, submitApplication, uploadFile } from '@/api/studentUser'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const cardList = ref([])
const myApps = ref([])
const dialogVisible = ref(false)
const currentType = ref(null)
const formRef = ref()
const currentFile = ref(null)

// 卡片图标与配色轮换：藏蓝 / 学院绿 / 成就金
const cardIcons = ['Coin', 'Medal', 'School', 'Wallet', 'Trophy', 'Present']
const iconColors = [
  ['#1d3a6e', 'rgba(29,58,110,0.08)'],
  ['#3f644f', 'rgba(79,125,99,0.14)'],
  ['#8d6e32', 'rgba(176,138,62,0.14)']
]

const flowSteps = [
  { title: '选择类型', desc: '浏览可申请的助学金，点击卡片' },
  { title: '填写信息', desc: '如实填写申请理由与家庭经济情况' },
  { title: '审核评定', desc: '辅导员审核评分，AHP 综合评定' },
  { title: '结果公示', desc: '评定结果统一公示，可查看进度' }
]

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
  applyReason: [{ required: true, message: '请填写申请理由', trigger: 'blur' }],
  familyIncome: [{ required: true, message: '请填写家庭年收入', trigger: 'change' }],
  familyMembers: [{ required: true, message: '请填写家庭人口数', trigger: 'change' }]
}

// 人均年收入自动计算展示
const perCapita = computed(() => {
  if (form.familyIncome == null || !form.familyMembers) return null
  return (form.familyIncome / form.familyMembers).toFixed(2)
})

// 页头概况统计
const processingCount = computed(() => cardList.value.filter(t => tagText(t) === '流程中').length)
const publishedCount = computed(() => cardList.value.filter(t => tagText(t) === '已公示').length)

// ============ 卡片状态判定（status: 0待审核 1已通过 2已驳回 3已评分 4已评定 5已公示） ============
function appsOfType(typeId) {
  return myApps.value.filter(a => a.typeId === typeId)
}
// 可申请：无记录，或仅有被驳回的记录（可重新申请）
function canApply(t) {
  const apps = appsOfType(t.id)
  if (!apps.length) return true
  return !apps.some(a => a.status !== 2)
}
function tagText(t) {
  const apps = appsOfType(t.id)
  if (!apps.length || !apps.some(a => a.status !== 2)) return '可申请'
  if (apps.some(a => a.status === 5)) return '已公示'
  return '流程中'
}
function tagClass(t) {
  const apps = appsOfType(t.id)
  if (!apps.length || !apps.some(a => a.status !== 2)) return 'tag-apply'
  if (apps.some(a => a.status === 5)) return 'tag-published'
  return 'tag-processing'
}

function formatAmount(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('zh-CN')
}

function goMyApplication() {
  router.push('/student/application')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getAvailableGrantTypes({ page: 1, size: 50 })
    cardList.value = res.rows || res.data?.rows || []
  } catch (err) {}
  try {
    const res = await getMyApplications({ page: 1, size: 50 })
    myApps.value = res.rows || res.data?.rows || []
  } catch (err) {} finally {
    loading.value = false
  }
  setupReveal()
}

function openDialog(t) {
  currentType.value = t
  Object.assign(form, { typeId: t.id, applyReason: '', familySituation: '', familyIncome: null, familyMembers: null, specialType: 0, specialProof: '' })
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

// ============ 滚动渐入动效：区块进入视口后一次性浮现 ============
function setupReveal() {
  const els = document.querySelectorAll('.apply-page .reveal')
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

onMounted(loadData)
</script>

<style scoped>
/* ============ 页头 ============ */
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
  flex-shrink: 0;
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

/* ============ 卡片网格 ============ */
.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  min-height: 120px;
  margin-bottom: 22px;
}
.type-card {
  border: 1px solid #e2e7ef;
  border-top: 3px solid #1d3a6e;
  border-radius: 12px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  background: #ffffff;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.type-card:hover {
  transform: translateY(-4px);
  border-top-color: #c9a24e;
  box-shadow: 0 12px 28px rgba(15, 31, 61, 0.12);
}
.type-card.disabled {
  cursor: default;
}
.type-card.disabled:hover {
  transform: none;
  border-top-color: #1d3a6e;
  box-shadow: none;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-icon {
  width: 46px;
  height: 46px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-tag {
  flex-shrink: 0;
  font-size: 11.5px;
  padding: 3px 12px;
  border-radius: 99px;
  letter-spacing: 0.5px;
}
.tag-apply { background: rgba(201, 162, 78, 0.14); color: #8d6e32; }
.tag-published { background: rgba(79, 125, 99, 0.12); color: #4f7d63; }
.tag-processing { background: rgba(138, 155, 184, 0.16); color: #5f7396; }

.card-name {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 18px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
}
.card-desc {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #5d6b80;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

/* 等级金额：价目表式行布局（点线引导 + 衬线金棕金额） */
.card-levels {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 16px;
}
.level-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.level-name {
  font-size: 13px;
  color: #5d6b80;
  flex-shrink: 0;
}
.level-dots {
  flex: 1;
  border-bottom: 1px dotted #c9cfdb;
  transform: translateY(-3px);
}
.level-amount {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 16px;
  font-weight: 700;
  color: #8d6e32;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.card-foot {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
  border-top: 1px dashed #ebeef3;
}

/* ============ 申请流程指引 ============ */
.flow-card {
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 12px;
  padding: 22px 28px;
}
.flow-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 1px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.flow-title::before {
  content: '';
  width: 3px;
  height: 15px;
  border-radius: 2px;
  background: #c9a24e;
}
.flow-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
.flow-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-right: 18px;
}
.flow-step + .flow-step {
  border-left: 1px solid #ebeef3;
  padding-left: 22px;
}
.flow-no {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 21px;
  font-weight: 700;
  color: #c9a24e;
  line-height: 1.1;
  flex-shrink: 0;
}
.flow-name {
  font-size: 14px;
  font-weight: 600;
  color: #20293a;
  margin-bottom: 4px;
}
.flow-desc {
  font-size: 12px;
  line-height: 1.6;
  color: #8a94a6;
}

/* ============ 弹窗 ============ */
.type-readonly {
  font-weight: 600;
  color: #1d3a6e;
}
.per-capita { color: #1d3a6e; font-weight: 600; }

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .flow-steps {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .flow-step:nth-child(3) {
    border-left: none;
    padding-left: 0;
  }
  .head-summary {
    display: none;
  }
}
@media (max-width: 768px) {
  .type-grid {
    grid-template-columns: 1fr;
  }
  .page-head {
    flex-direction: column;
    align-items: flex-start;
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
