<template>
  <div class="page-enter">
    <el-card>
      <template #header>
        <div class="header-bar">
          <span>公示管理</span>
          <el-button type="primary" :icon="Plus" @click="openDialog()">新增公示</el-button>
        </div>
      </template>

      <!-- 状态统计条（点击按状态筛选） -->
      <div class="stat-row">
        <div class="stat-chip" :class="{ active: queryForm.status === null }" @click="filterByStatus(null)">
          <span class="stat-num">{{ stats.unpublished + stats.publishing + stats.ended }}</span>
          <span class="stat-label">全部公示</span>
        </div>
        <div class="stat-chip" :class="{ active: queryForm.status === 0 }" @click="filterByStatus(0)">
          <span class="stat-num">{{ stats.unpublished }}</span>
          <span class="stat-label">未发布</span>
        </div>
        <div class="stat-chip" :class="{ active: queryForm.status === 1 }" @click="filterByStatus(1)">
          <span class="stat-num">{{ stats.publishing }}</span>
          <span class="stat-label">公示中</span>
        </div>
        <div class="stat-chip" :class="{ active: queryForm.status === 2 }" @click="filterByStatus(2)">
          <span class="stat-num">{{ stats.ended }}</span>
          <span class="stat-label">已结束</span>
        </div>
      </div>

      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-input v-model="queryForm.keyword" placeholder="公示标题" clearable style="width: 180px" @input="debounceSearch" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.status" placeholder="状态" clearable style="width: 130px" @change="handleFilterChange">
            <el-option label="未发布" :value="0" />
            <el-option label="公示中" :value="1" />
            <el-option label="已结束" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-summary">共 <b>{{ total }}</b> 条公示</div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="typeName" label="助学金类型" min-width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span class="status-cell" :class="'status-' + row.status">
              <i class="status-dot"></i>{{ ['未发布','公示中','已结束'][row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" min-width="150" class-name="num-col">
          <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" min-width="150" class-name="num-col">
          <template #default="{ row }">{{ formatTime(row.endTime) || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="175" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 0" link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 0" link type="success" size="small" @click="handlePublish(row)">发布</el-button>
            <el-button v-if="row.status === 0" link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            <el-button v-if="row.status === 1" link type="warning" size="small" @click="handleEnd(row)">结束公示</el-button>
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

    <!-- 公示办理流程说明 -->
    <div class="flow-card">
      <div class="flow-title">公示办理流程</div>
      <div class="flow-steps">
        <div class="flow-step">
          <div class="step-num">01</div>
          <div class="step-name">创建公示</div>
          <div class="step-desc">选择助学金类型，填写标题、内容与公示期，保存为未发布草稿</div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-num">02</div>
          <div class="step-name">发布公示</div>
          <div class="step-desc">确认发布后进入公示中状态，学生端同步展示，已评定申请自动标记为已公示</div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-num">03</div>
          <div class="step-name">异议受理</div>
          <div class="step-desc">公示期内学生可在学生端查看拟资助名单，如有异议可联系资助管理中心</div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-num">04</div>
          <div class="step-name">结束归档</div>
          <div class="step-desc">公示期满后点击结束，公示转为已结束状态，名单可随时导出备查</div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑公示' : '新增公示'" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="助学金类型" prop="typeId">
          <el-select v-model="form.typeId" placeholder="选择助学金类型" style="width: 100%">
            <el-option v-for="t in typeList" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="公示期" prop="timeRange">
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            start-placeholder="公示开始时间"
            end-placeholder="公示结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <div class="form-tip">可选。发布时若未填写，开始时间自动取发布时刻</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="公示详情" width="720px" append-to-body>
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="助学金类型">{{ detail.typeName }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ ['未发布','公示中','已结束'][detail.status] }}</el-descriptions-item>
        <el-descriptions-item label="发布人">{{ detail.publisherName }}</el-descriptions-item>
        <el-descriptions-item label="公示期" :span="2">
          {{ formatTime(detail.startTime) || '—' }} ~ {{ formatTime(detail.endTime) || '至今' }}
        </el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">{{ detail.content }}</el-descriptions-item>
      </el-descriptions>

      <!-- 名单栏：人数/总金额 + 导出 -->
      <div class="list-bar">
        <span class="list-title">
          拟资助名单 · 共 <b>{{ detail?.students?.length || 0 }}</b> 人 · 合计 <b>¥{{ totalAmount }}</b>
        </span>
        <el-button type="primary" size="small" :icon="Download" @click="handleExportList">导出名单</el-button>
      </div>
      <el-table :data="detail?.students || []" border stripe max-height="360" style="margin-top: 12px">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="姓名" min-width="100" />
        <el-table-column prop="studentNo" label="学号" min-width="140" class-name="num-col" />
        <el-table-column prop="levelName" label="资助等级" min-width="100" />
        <el-table-column label="资助金额" min-width="120" align="right" class-name="num-col">
          <template #default="{ row }"><span class="amount-val">¥{{ fmtAmount(row.grantAmount) }}</span></template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Download } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getNoticePage, addNotice, updateNotice, getNoticeDetail, deleteNotice,
  publishNotice, endNotice, getNoticeStats, exportNoticeStudents, getGrantTypeList
} from '@/api/student'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const typeList = ref([])
const dialogVisible = ref(false)
const editId = ref(null)
const detailVisible = ref(false)
const detail = ref(null)
const formRef = ref()

// 状态统计
const stats = reactive({ unpublished: 0, publishing: 0, ended: 0 })

const queryForm = reactive({ page: 1, size: 10, keyword: '', status: null })
const form = reactive({ title: '', typeId: null, content: '', timeRange: null })
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  typeId: [{ required: true, message: '请选择助学金类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
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
}

async function loadStats() {
  try {
    const res = await getNoticeStats()
    Object.assign(stats, res.data || {})
  } catch (err) {}
}

async function loadTypes() {
  const res = await getGrantTypeList()
  typeList.value = res.data || res.rows || []
}

// 筛选变化自动刷新
function handleFilterChange() {
  queryForm.page = 1
  loadData()
}

// 点击统计块按状态筛选（再次点击取消）
function filterByStatus(status) {
  queryForm.status = queryForm.status === status ? null : status
  handleFilterChange()
}

// 标题输入防抖自动查询
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
  queryForm.keyword = ''
  queryForm.status = null
  queryForm.page = 1
  loadData()
}

function openDialog() {
  editId.value = null
  Object.assign(form, { title: '', typeId: null, content: '', timeRange: null })
  dialogVisible.value = true
}

function handleEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    title: row.title,
    typeId: row.typeId,
    content: row.content || '',
    timeRange: row.startTime && row.endTime
      ? [formatTime(row.startTime, true), formatTime(row.endTime, true)]
      : (row.startTime ? [formatTime(row.startTime, true), null] : null)
  })
  dialogVisible.value = true
}

function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      const data = {
        title: form.title,
        typeId: form.typeId,
        content: form.content,
        startTime: form.timeRange?.[0] || null,
        endTime: form.timeRange?.[1] || null
      }
      if (editId.value) {
        await updateNotice(editId.value, data)
        ElMessage.success('修改成功')
      } else {
        await addNotice(data)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadData()
      loadStats()
    } catch (err) {} finally {
      submitting.value = false
    }
  })
}

async function viewDetail(row) {
  const res = await getNoticeDetail(row.id)
  detail.value = res.data
  detailVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该公示吗？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteNotice(row.id)
      ElMessage.success('删除成功')
      loadData()
      loadStats()
    })
    .catch(() => {})
}

function handlePublish(row) {
  ElMessageBox.confirm('发布后将无法修改，确定发布吗？', '提示', { type: 'warning' })
    .then(async () => {
      await publishNotice(row.id)
      ElMessage.success('发布成功，该类型已评定的申请已同步为"已公示"')
      loadData()
      loadStats()
    })
    .catch(() => {})
}

function handleEnd(row) {
  ElMessageBox.confirm('结束后学生端将停止展示该公示，确定结束吗？', '结束公示', { type: 'warning' })
    .then(async () => {
      await endNotice(row.id)
      ElMessage.success('公示已结束')
      loadData()
      loadStats()
    })
    .catch(() => {})
}

// ===== 时间/金额格式化 =====
function formatTime(t, full = false) {
  if (!t) return ''
  return dayjs(t).format(full ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm')
}

function fmtAmount(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 名单合计金额
const totalAmount = computed(() => {
  const list = detail.value?.students || []
  const sum = list.reduce((acc, s) => acc + Number(s.grantAmount || 0), 0)
  return fmtAmount(sum)
})

// ===== 导出名单 =====
function saveBlob(res, filename) {
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExportList() {
  try {
    const res = await exportNoticeStudents(detail.value.id)
    saveBlob(res, `公示名单-${detail.value.title}.xlsx`)
    ElMessage.success('导出成功')
  } catch (err) {}
}

onMounted(() => {
  loadTypes()
  loadData()
  loadStats()
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
.form-tip { font-size: 12px; color: #909399; line-height: 1.4; margin-top: 4px; }

/* 状态语义色点：灰=未发布 / 绿=公示中 / 金=已结束 */
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-0 .status-dot { background: #909399; }
.status-0 { color: #909399; }
.status-1 .status-dot { background: #4f7d63; }
.status-1 { color: #4f7d63; }
.status-2 .status-dot { background: #c9a24e; }
.status-2 { color: #8d6e32; }

/* 等宽数字列（时间、学号） */
.page-enter :deep(.num-col .cell) { font-variant-numeric: tabular-nums; letter-spacing: 0.3px; }

/* 金额金棕加粗 */
.amount-val { font-variant-numeric: tabular-nums; color: #8d6e32; font-weight: 600; }

/* 状态统计条 */
.stat-row { display: flex; gap: 12px; margin-bottom: 16px; }
.stat-chip {
  flex: 1; padding: 12px 18px; border: 1px solid #e5e8ef; border-radius: 8px;
  background: #fafbfd; cursor: pointer; display: flex; align-items: baseline; gap: 8px;
  transition: all .2s ease; user-select: none;
}
.stat-chip:hover { border-color: #c9a24e; background: #fdfaf2; }
.stat-chip.active { border-color: #1d3a6e; background: #f0f3f9; box-shadow: inset 3px 0 0 #1d3a6e; }
.stat-num { font-size: 22px; font-weight: 700; color: #1d3a6e; font-variant-numeric: tabular-nums; }
.stat-label { font-size: 13px; color: #5d6b80; }

/* 详情名单栏 */
.list-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.list-title { font-size: 13px; color: #5d6b80; }
.list-title b { color: #1d3a6e; font-weight: 700; }

/* 公示办理流程卡 */
.flow-card {
  margin-top: 16px;
  border: 1px solid #e2e7ef;
  border-radius: 12px;
  background: #fff;
  padding: 18px 20px;
}
.flow-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d3a6e;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.flow-title::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: #c9a24e;
}
.flow-steps {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.flow-step {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #ebeef4;
  border-radius: 8px;
  background: #fafbfd;
}
.step-num {
  font-size: 18px;
  font-weight: 700;
  color: #c9a24e;
  font-family: 'Georgia', 'Noto Serif SC', serif;
  line-height: 1;
  margin-bottom: 4px;
}
.step-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d3a6e;
  margin-bottom: 4px;
}
.step-desc {
  font-size: 12px;
  color: #67718a;
  line-height: 1.5;
}
.flow-arrow {
  display: flex;
  align-items: center;
  color: #c0c8d5;
  font-size: 16px;
}
@media (max-width: 768px) {
  .flow-steps { flex-direction: column; }
  .flow-arrow { justify-content: center; transform: rotate(90deg); }
}
</style>
