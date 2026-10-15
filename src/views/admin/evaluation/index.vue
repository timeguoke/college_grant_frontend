<template>
  <div class="page-enter">
    <!-- 评定操作 -->
    <el-card style="margin-bottom: 20px">
      <template #header>执行AHP评定</template>
      <div class="eval-layout">
        <!-- 左：表单 -->
        <div class="eval-form-side">
          <el-form :model="evalForm" label-width="110px">
            <el-form-item label="助学金类型">
              <el-select v-model="evalForm.typeId" placeholder="选择助学金类型" style="width: 100%">
                <el-option v-for="t in typeList" :key="t.id" :label="t.typeName" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-form>
          <!-- 预设方案 -->
          <div class="preset-bar">
            <span class="preset-label">快捷预设</span>
            <el-button size="small" :class="{ 'preset-active': activePreset === 'balanced' }" @click="applyPreset(25,25,25,25, 'balanced')">均衡型</el-button>
            <el-button size="small" :class="{ 'preset-active': activePreset === 'economic' }" @click="applyPreset(40,25,20,15, 'economic')">经济优先</el-button>
            <el-button size="small" :class="{ 'preset-active': activePreset === 'hardship' }" @click="applyPreset(30,20,30,20, 'hardship')">困难优先</el-button>
          </div>
          <el-form :model="evalForm" label-width="110px">
            <el-form-item label="经济权重(%)">
              <el-slider v-model="evalForm.economicWeight" show-input :max="100" class="slider-economic" @input="activePreset = ''" />
            </el-form-item>
            <el-form-item label="家庭负担(%)">
              <el-slider v-model="evalForm.familyBurdenWeight" show-input :max="100" class="slider-family" @input="activePreset = ''" />
            </el-form-item>
            <el-form-item label="特殊困难(%)">
              <el-slider v-model="evalForm.specialHardshipWeight" show-input :max="100" class="slider-special" @input="activePreset = ''" />
            </el-form-item>
            <el-form-item label="突发困难(%)">
              <el-slider v-model="evalForm.disasterWeight" show-input :max="100" class="slider-disaster" @input="activePreset = ''" />
            </el-form-item>
            <el-form-item>
              <div class="weight-sum-bar" :class="{ ok: weightSum === 100, over: weightSum > 100 }">
                <div class="weight-sum-track">
                  <div class="weight-sum-fill" :style="{ width: Math.min(weightSum, 100) + '%' }"></div>
                </div>
                <span class="weight-sum-text">{{ weightSum }}%{{ weightSum === 100 ? ' · 符合要求' : weightSum > 100 ? ' · 超出' + (weightSum - 100) + '%' : ' · 还差' + (100 - weightSum) + '%' }}</span>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="evaluating" @click="handleEvaluate">执行评定</el-button>
            </el-form-item>
          </el-form>
        </div>
        <!-- 右：权重分布环形图 -->
        <div class="eval-chart-side">
          <div class="weight-donut">
            <div class="donut-ring" :style="donutStyle"></div>
            <div class="donut-center">
              <span class="donut-pct" :class="{ ok: weightSum === 100 }">{{ weightSum }}%</span>
              <span class="donut-hint">{{ weightSum === 100 ? '符合要求' : '需调整至100' }}</span>
            </div>
          </div>
          <div class="weight-legend">
            <div class="legend-item"><i style="background:#1d3a6e"></i>经济状况 <b>{{ evalForm.economicWeight }}%</b></div>
            <div class="legend-item"><i style="background:#c9a24e"></i>家庭负担 <b>{{ evalForm.familyBurdenWeight }}%</b></div>
            <div class="legend-item"><i style="background:#3f9985"></i>特殊困难 <b>{{ evalForm.specialHardshipWeight }}%</b></div>
            <div class="legend-item"><i style="background:#c47330"></i>突发困难 <b>{{ evalForm.disasterWeight }}%</b></div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 评定结果 -->
    <el-card class="result-card">
      <template #header>
        <div class="header-bar">
          <span>评定结果</span>
          <el-button type="success" :icon="Download" @click="handleExport">导出Excel</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-select v-model="queryForm.typeId" placeholder="助学金类型" clearable style="width: 180px" @change="handleFilterChange">
            <el-option v-for="t in typeList" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="queryForm.keyword" placeholder="学号/姓名" clearable style="width: 180px" @input="debounceSearch" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-summary">共 <b>{{ total }}</b> 条评定结果</div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="ranking" label="排名" width="92">
          <template #default="{ row }">
            <el-tag v-if="row.isSpecial" type="warning" size="small">特殊困难</el-tag>
            <el-tag v-else-if="row.ranking === 1" type="warning" effect="dark" size="small">{{ row.ranking }}</el-tag>
            <el-tag v-else-if="row.ranking <= 3" type="warning" effect="plain" size="small">{{ row.ranking }}</el-tag>
            <span v-else class="rank-num">{{ row.ranking }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" min-width="120" class-name="num-col" />
        <el-table-column prop="studentName" label="姓名" width="80" />
        <el-table-column prop="typeName" label="助学金类型" min-width="120" />
        <el-table-column prop="score" label="总分" width="80" class-name="score-col" />
        <el-table-column prop="levelName" label="等级" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.levelName" type="success" effect="plain">{{ row.levelName }}</el-tag>
            <el-tag v-else type="info" effect="plain">未评上</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grantAmount" label="金额(元)" width="110" align="right" class-name="num-col">
          <template #default="{ row }"><span class="amount-val">{{ row.grantAmount != null ? '¥ ' + Number(row.grantAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- AHP 方法说明 -->
    <div class="ahp-info-card">
      <div class="ahp-info-title">AHP 层次分析法说明</div>
      <div class="ahp-info-steps">
        <div class="ahp-step"><b>① 四维加权</b><br/>经济状况、家庭负担、特殊困难、突发困难四个维度，权重之和须为 100%</div>
        <div class="ahp-arrow">→</div>
        <div class="ahp-step"><b>② 综合评分</b><br/>按教师四维打分 × 权重，计算每位申请学生的综合得分</div>
        <div class="ahp-arrow">→</div>
        <div class="ahp-step"><b>③ 排名分级</b><br/>按综合得分从高到低排名，结合助学金等级分数线匹配资助等级</div>
        <div class="ahp-arrow">→</div>
        <div class="ahp-step"><b>④ 公示归档</b><br/>评定结果进入公示管理流程，公示期满后归档备查</div>
      </div>
    </div>

    <!-- 评定详情 -->
    <el-dialog v-model="detailVisible" title="评定详情" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="学号">{{ detail.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.studentName }}</el-descriptions-item>
        <el-descriptions-item label="助学金类型">{{ detail.typeName }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ detail.score }}</el-descriptions-item>
        <el-descriptions-item label="排名">{{ detail.ranking }}</el-descriptions-item>
        <el-descriptions-item label="等级">{{ detail.levelName || '未评上' }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ detail.grantAmount || 0 }} 元</el-descriptions-item>
        <el-descriptions-item label="特殊学生">{{ detail.isSpecial ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="经济分">{{ detail.economicScore }}</el-descriptions-item>
        <el-descriptions-item label="家庭负担分">{{ detail.familyBurdenScore }}</el-descriptions-item>
        <el-descriptions-item label="特殊困难分">{{ detail.specialHardshipScore }}</el-descriptions-item>
        <el-descriptions-item label="突发困难分">{{ detail.disasterScore }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, Refresh } from '@element-plus/icons-vue'
import { getGrantTypeList, doEvaluate, getEvaluationPage, getEvaluationDetail, exportEvaluation } from '@/api/student'

const loading = ref(false)
const evaluating = ref(false)
const tableData = ref([])
const total = ref(0)
const typeList = ref([])
const detailVisible = ref(false)
const detail = ref(null)

const evalForm = reactive({
  typeId: null,
  economicWeight: 35,
  familyBurdenWeight: 25,
  specialHardshipWeight: 20,
  disasterWeight: 20
})

const queryForm = reactive({ page: 1, size: 10, typeId: null, keyword: '' })

const weightSum = computed(() =>
  evalForm.economicWeight + evalForm.familyBurdenWeight + evalForm.specialHardshipWeight + evalForm.disasterWeight
)

// 环形图 conic-gradient 样式（按权重比例分四色弧段）
const donutStyle = computed(() => {
  const e = evalForm.economicWeight
  const f = evalForm.familyBurdenWeight
  const s = evalForm.specialHardshipWeight
  const d = evalForm.disasterWeight
  const total = e + f + s + d || 1
  const pe = (e / total * 360).toFixed(1)
  const pf = (f / total * 360).toFixed(1)
  const ps = (s / total * 360).toFixed(1)
  const pd = (360 - parseFloat(pe) - parseFloat(pf) - parseFloat(ps)).toFixed(1)
  return {
    background: `conic-gradient(
      #1d3a6e 0deg ${pe}deg,
      #c9a24e ${pe}deg ${(parseFloat(pe)+parseFloat(pf)).toFixed(1)}deg,
      #3f9985 ${(parseFloat(pe)+parseFloat(pf)).toFixed(1)}deg ${(parseFloat(pe)+parseFloat(pf)+parseFloat(ps)).toFixed(1)}deg,
      #c47330 ${(parseFloat(pe)+parseFloat(pf)+parseFloat(ps)).toFixed(1)}deg 360deg
    )`
  }
})

const activePreset = ref('')

// 快捷预设
function applyPreset(e, f, s, d, name) {
  evalForm.economicWeight = e
  evalForm.familyBurdenWeight = f
  evalForm.specialHardshipWeight = s
  evalForm.disasterWeight = d
  activePreset.value = name
}

async function loadTypes() {
  const res = await getGrantTypeList()
  typeList.value = res.data || res.rows || []
}

async function loadData() {
  loading.value = true
  try {
    const res = await getEvaluationPage(queryForm)
    tableData.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {} finally {
    loading.value = false
  }
}

// 筛选变化自动刷新
function handleFilterChange() {
  queryForm.page = 1
  loadData()
}

// 关键词输入防抖自动查询
let searchTimer = null
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    queryForm.page = 1
    loadData()
  }, 300)
}
onBeforeUnmount(() => clearTimeout(searchTimer))

function resetQuery() {
  queryForm.typeId = null
  queryForm.keyword = ''
  queryForm.page = 1
  loadData()
}

function handleEvaluate() {
  if (!evalForm.typeId) {
    ElMessage.warning('请选择助学金类型')
    return
  }
  if (weightSum.value !== 100) {
    ElMessage.warning(`权重总和必须为100，当前为${weightSum.value}`)
    return
  }
  ElMessageBox.confirm('确定执行AHP评定吗？这将覆盖之前的评定结果。', '提示', { type: 'warning' })
    .then(async () => {
      evaluating.value = true
      try {
        const res = await doEvaluate(evalForm)
        ElMessage.success('评定成功')
        loadData()
      } catch (err) {} finally {
        evaluating.value = false
      }
    })
    .catch(() => {})
}

async function viewDetail(row) {
  const res = await getEvaluationDetail(row.id)
  detail.value = res.data
  detailVisible.value = true
}

async function handleExport() {
  if (!queryForm.typeId) {
    ElMessage.warning('请先选择助学金类型')
    return
  }
  try {
    const res = await exportEvaluation(queryForm.typeId)
    // 检查返回是否为错误JSON（后端报错时返回JSON而非Excel）
    if (res.data.type && res.data.type.includes('json')) {
      const text = await res.data.text()
      const err = JSON.parse(text)
      ElMessage.error(err.msg || '导出失败')
      return
    }
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = '评定结果.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出失败', err)
    ElMessage.error('导出失败，请重试')
  }
}

onMounted(() => {
  loadTypes()
  loadData()
})
</script>

<style scoped>
.header-bar { display: flex; justify-content: space-between; align-items: center; }
.query-form { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.page-enter { animation: fadeUp 0.45s ease both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
.table-summary { font-size: 13px; color: #5d6b80; margin-bottom: 12px; }
.table-summary b { color: #1d3a6e; font-weight: 600; }

/* 排名普通数字等宽 */
.rank-num { font-variant-numeric: tabular-nums; color: #5d6b80; }

/* 学号/金额等宽数字 */
.page-enter :deep(.num-col .cell) { font-variant-numeric: tabular-nums; letter-spacing: 0.3px; }

/* 总分列金棕加粗 */
.page-enter :deep(.score-col .cell) {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: #8d6e32;
  letter-spacing: 0.5px;
}

/* 金额金棕 */
.amount-val { font-variant-numeric: tabular-nums; color: #8d6e32; font-weight: 600; }
/* 结果卡不撑满，表格按条数自然展开，页面整体滚动 */
.result-card { flex: none !important; }
.result-card :deep(.el-card__body) { flex: none; display: block; }
.weight-tip {
  font-size: 13px;
  color: #8b3b37;
  font-weight: 500;
}
.weight-tip.ok {
  color: #3f644f;
}

/* 四色滑块：填充色与环形图颜色一一对应 */
.slider-economic :deep(.el-slider__bar) { background: #1d3a6e; }
.slider-economic :deep(.el-slider__button) { border-color: #1d3a6e; }
.slider-family :deep(.el-slider__bar) { background: #c9a24e; }
.slider-family :deep(.el-slider__button) { border-color: #c9a24e; }
.slider-special :deep(.el-slider__bar) { background: #3f9985; }
.slider-special :deep(.el-slider__button) { border-color: #3f9985; }
.slider-disaster :deep(.el-slider__bar) { background: #c47330; }
.slider-disaster :deep(.el-slider__button) { border-color: #c47330; }

/* 预设按钮激活态 */
.preset-active {
  border-color: #c9a24e !important;
  color: #8d6e32 !important;
  background: rgba(201, 162, 78, 0.1) !important;
}

/* 权重总和进度条 */
.weight-sum-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.weight-sum-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ebeef4;
  overflow: hidden;
}
.weight-sum-fill {
  height: 100%;
  border-radius: 3px;
  background: #ae4a45;
  transition: width 0.3s ease, background 0.3s ease;
}
.weight-sum-bar.ok .weight-sum-fill { background: #4f7d63; }
.weight-sum-bar.over .weight-sum-fill { background: #ae4a45; }
.weight-sum-text {
  font-size: 13px;
  font-weight: 600;
  color: #ae4a45;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.weight-sum-bar.ok .weight-sum-text { color: #4f7d63; }
.weight-sum-bar.over .weight-sum-text { color: #ae4a45; }

/* 两栏布局 */
.eval-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.eval-form-side { flex: 1; min-width: 0; }
.eval-chart-side {
  flex-shrink: 0;
  width: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}

/* 预设按钮栏 */
.preset-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-left: 110px;
}
.preset-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

/* 环形图 */
.weight-donut {
  position: relative;
  width: 160px;
  height: 160px;
}
.donut-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: background 0.3s ease;
}
.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.donut-pct {
  font-size: 24px;
  font-weight: 700;
  color: #8b3b37;
  font-variant-numeric: tabular-nums;
}
.donut-pct.ok { color: #3f644f; }
.donut-hint {
  font-size: 11px;
  color: #909399;
}

/* 图例 */
.weight-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #5d6b80;
}
.legend-item i {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}
.legend-item b {
  margin-left: auto;
  color: #1d3a6e;
  font-variant-numeric: tabular-nums;
}

/* AHP 说明卡 */
.ahp-info-card {
  margin-top: 16px;
  border: 1px solid #e2e7ef;
  border-radius: 12px;
  background: #fff;
  padding: 18px 20px;
}
.ahp-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d3a6e;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ahp-info-title::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: #c9a24e;
}
.ahp-info-steps {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.ahp-step {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #ebeef4;
  border-radius: 8px;
  background: #fafbfd;
  font-size: 12px;
  color: #67718a;
  line-height: 1.6;
}
.ahp-step b {
  color: #1d3a6e;
  font-size: 13px;
}
.ahp-arrow {
  display: flex;
  align-items: center;
  color: #c0c8d5;
  font-size: 16px;
}
@media (max-width: 900px) {
  .eval-layout { flex-direction: column; }
  .eval-chart-side { width: 100%; flex-direction: row; justify-content: center; }
}
@media (max-width: 768px) {
  .ahp-info-steps { flex-direction: column; }
  .ahp-arrow { justify-content: center; transform: rotate(90deg); }
  .preset-bar { padding-left: 0; flex-wrap: wrap; }
}
</style>
