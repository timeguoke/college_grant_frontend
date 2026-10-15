<template>
  <div class="page-enter">
    <el-card>
      <template #header>
        <div class="header-bar">
          <span>助学金类型管理</span>
          <el-button type="primary" :icon="Plus" @click="openDialog()">新增类型</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-input v-model="queryForm.name" placeholder="类型名称" clearable style="width: 180px" @input="debounceSearch" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.status" placeholder="状态" clearable style="width: 130px" @change="handleFilterChange">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-summary">共 <b>{{ tableData.length }}</b> 个类型</div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="typeName" label="类型名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.description" class="desc-text">{{ row.description }}</span>
            <span v-else class="desc-empty">暂无描述</span>
          </template>
        </el-table-column>
        <el-table-column prop="levelCount" label="等级数" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.levelCount > 0" type="success" effect="plain">{{ row.levelCount }} 个</el-tag>
            <el-tag v-else type="danger" effect="plain">未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <span class="status-cell" :class="row.status === 1 ? 'is-active' : 'is-inactive'">
              <i class="status-dot"></i>{{ row.status === 1 ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="openLevelDialog(row)">等级配置</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" size="small" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑类型' : '新增类型'" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="typeName">
          <el-input v-model="form.typeName" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="levelDialogVisible" title="等级配置" width="680px" append-to-body>
      <div class="level-header">
        <span class="level-title">{{ currentTypeName }} · 等级列表</span>
        <el-button type="primary" :icon="Plus" @click="openLevelForm()">新增等级</el-button>
      </div>
      <el-table :data="levels" border stripe>
        <el-table-column prop="levelName" label="等级名称" min-width="120" />
        <el-table-column prop="amount" label="金额(元)" width="140" align="right" class-name="num-col">
          <template #default="{ row }"><span class="amount-val">¥ {{ Number(row.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span></template>
        </el-table-column>
        <el-table-column prop="minScore" label="最低分数线" width="130" align="center" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openLevelForm(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteLevel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="levelFormVisible" :title="levelForm.id ? '编辑等级' : '新增等级'" width="460px" append-to-body>
      <el-form ref="levelFormRef" :model="levelForm" :rules="levelRules" label-width="92px">
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="levelForm.levelName" placeholder="如：一等、二等" />
        </el-form-item>
        <el-form-item label="金额(元)" prop="amount">
          <el-input-number v-model="levelForm.amount" :min="0" :precision="2" :step="100" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最低分数线" prop="minScore">
          <el-input-number v-model="levelForm.minScore" :min="0" :max="100" :precision="2" :step="5" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="levelForm.sort" :min="1" :step="1" controls-position="right" style="width: 100%" />
          <div class="form-tip">数字越小等级越高，按从高到低填写</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="levelSubmitting" @click="submitLevel">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getGrantTypePage, addGrantType, updateGrantType, deleteGrantType, updateGrantTypeStatus, getLevelList, addLevel, updateLevel, deleteLevel } from '@/api/student'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const levelDialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()

const queryForm = reactive({ page: 1, size: 100, name: '', status: null })

const form = reactive({ typeName: '', description: '', status: 1 })
const rules = {
  typeName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }]
}

const levels = ref([])
const currentTypeId = ref(null)
const currentTypeName = ref('')

// 等级新增/编辑表单
const levelFormVisible = ref(false)
const levelSubmitting = ref(false)
const levelFormRef = ref()
const levelForm = reactive({ id: null, levelName: '', amount: 1000, minScore: 60, sort: 1 })
const levelRules = {
  levelName: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'change' }],
  minScore: [{ required: true, message: '请输入最低分数线', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }]
}

async function loadData() {
  loading.value = true
  try {
    const res = await getGrantTypePage(queryForm)
    tableData.value = res.rows || res.data?.rows || []
  } catch (err) {} finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.name = ''
  queryForm.status = null
  queryForm.page = 1
  loadData()
}

// 状态下拉切换后自动刷新
function handleFilterChange() {
  queryForm.page = 1
  loadData()
}

// 名称输入防抖自动查询
let searchTimer = null
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    queryForm.page = 1
    loadData()
  }, 300)
}
onBeforeUnmount(() => clearTimeout(searchTimer))

function openDialog(row) {
  editId.value = row?.id || null
  if (row) {
    Object.assign(form, { typeName: row.typeName, description: row.description || '', status: row.status })
  } else {
    Object.assign(form, { typeName: '', description: '', status: 1 })
  }
  dialogVisible.value = true
}

function handleToggleStatus(row) {
  const action = row.status === 1 ? '停用' : '启用'
  const nextStatus = row.status === 1 ? 0 : 1
  ElMessageBox.confirm(`确定${action}「${row.typeName}」吗？${action}后学生端将${action === '停用' ? '无法' : '可以'}申请该助学金。`, '提示', { type: 'warning' })
    .then(async () => {
      await updateGrantTypeStatus(row.id, nextStatus)
      ElMessage.success(`${action}成功`)
      loadData()
    })
    .catch(() => {})
}

function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      if (editId.value) {
        await updateGrantType(editId.value, form)
        ElMessage.success('修改成功')
      } else {
        await addGrantType(form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (err) {} finally {
      submitting.value = false
    }
  })
}

function handleDelete(row) {
  const hasLevels = row.levelCount > 0
  const tip = hasLevels
    ? `「${row.typeName}」下有 ${row.levelCount} 个等级，删除后等级将一并删除，确定删除吗？`
    : `确定删除「${row.typeName}」吗？`
  ElMessageBox.confirm(tip, '提示', { type: 'warning' })
    .then(async () => {
      await deleteGrantType(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
    .catch(() => {})
}

async function refreshLevels() {
  const res = await getLevelList(currentTypeId.value)
  levels.value = res.data || []
}

async function openLevelDialog(row) {
  currentTypeId.value = row.id
  currentTypeName.value = row.typeName
  levelDialogVisible.value = true
  await refreshLevels()
}

function openLevelForm(row) {
  if (row) {
    Object.assign(levelForm, {
      id: row.id,
      levelName: row.levelName,
      amount: Number(row.amount),
      minScore: Number(row.minScore),
      sort: row.sort
    })
  } else {
    Object.assign(levelForm, {
      id: null,
      levelName: '',
      amount: 1000,
      minScore: 60,
      sort: levels.value.length + 1
    })
  }
  levelFormVisible.value = true
  levelFormRef.value?.clearValidate?.()
}

function submitLevel() {
  levelFormRef.value.validate(async valid => {
    if (!valid) return
    levelSubmitting.value = true
    try {
      const data = {
        levelName: levelForm.levelName,
        amount: levelForm.amount,
        minScore: levelForm.minScore,
        sort: levelForm.sort
      }
      if (levelForm.id) {
        await updateLevel(levelForm.id, data)
        ElMessage.success('修改成功')
      } else {
        await addLevel(currentTypeId.value, data)
        ElMessage.success('新增成功')
      }
      levelFormVisible.value = false
      await refreshLevels()
      loadData()
    } catch (err) {} finally {
      levelSubmitting.value = false
    }
  })
}

function handleDeleteLevel(row) {
  ElMessageBox.confirm(`确定删除等级 ${row.levelName} 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteLevel(row.id)
      ElMessage.success('删除成功')
      await refreshLevels()
      loadData()
    })
    .catch(() => {})
}

onMounted(() => loadData())
</script>

<style scoped>
.header-bar { display: flex; justify-content: space-between; align-items: center; }
.query-form { margin-bottom: 16px; }
.form-tip { font-size: 12px; color: #909399; line-height: 1.4; margin-top: 4px; }

/* 表格概要 */
.table-summary { font-size: 13px; color: #5d6b80; margin-bottom: 12px; }
.table-summary b { color: #1d3a6e; font-weight: 600; }

/* 描述列 */
.desc-text { color: #5d6b80; }
.desc-empty { color: #c0c4cc; font-style: italic; font-size: 12px; }

/* 状态语义色点 */
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-cell.is-active { color: #4f7d63; }
.status-cell.is-active .status-dot { background: #4f7d63; }
.status-cell.is-inactive { color: #909399; }
.status-cell.is-inactive .status-dot { background: #c0c4cc; }

/* 金额等宽数字 */
.amount-val { font-variant-numeric: tabular-nums; color: #8d6e32; font-weight: 600; }

/* 页面入场渐入 */
.page-enter { animation: fadeUp 0.45s ease both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

/* 等级配置弹窗 header */
.level-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.level-title { font-size: 15px; font-weight: 600; color: #1d3a6e; }
</style>
