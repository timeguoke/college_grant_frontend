<template>
  <div class="page-enter">
    <el-card>
      <template #header>
        <div class="header-bar">
          <span>教师管理</span>
          <div class="header-actions">
            <el-button :icon="Download" @click="handleExport">导出</el-button>
            <el-button :icon="Upload" @click="importDialogVisible = true">导入</el-button>
            <el-button type="primary" :icon="Plus" @click="openDialog()">新增教师</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-input v-model="queryForm.keyword" placeholder="工号/姓名" clearable style="width: 180px" @input="debounceSearch" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.college" placeholder="院系" clearable filterable style="width: 170px" @change="handleFilterChange">
            <el-option v-for="c in colleges" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-summary">共 <b>{{ total }}</b> 名教师</div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="teacherNo" label="工号" min-width="120" class-name="num-col" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="gender" label="性别" width="70">
          <template #default="{ row }">
            <span class="gender-cell" :class="row.gender === 0 ? 'is-male' : 'is-female'">
              <i class="gender-dot"></i>{{ row.gender === 0 ? '男' : '女' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="college" label="院系" min-width="150">
          <template #default="{ row }">{{ row.college || '—' }}</template>
        </el-table-column>
        <el-table-column prop="title" label="职称" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.title === 3" type="warning" effect="dark" size="small">教授</el-tag>
            <el-tag v-else-if="row.title === 2" type="primary" effect="plain" size="small">副教授</el-tag>
            <el-tag v-else-if="row.title === 1" type="info" effect="plain" size="small">讲师</el-tag>
            <el-tag v-else-if="row.title === 0" type="info" effect="plain" size="small">助教</el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="120" class-name="num-col" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑教师' : '新增教师'" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工号" prop="teacherNo">
          <el-input v-model="form.teacherNo" :disabled="!!editId" placeholder="工号将作为登录账号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">男</el-radio>
            <el-radio :value="1">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="院系" prop="college">
          <el-input v-model="form.college" placeholder="如：信息学院" />
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="form.title" placeholder="选择职称">
            <el-option label="助教" :value="0" />
            <el-option label="讲师" :value="1" />
            <el-option label="副教授" :value="2" />
            <el-option label="教授" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="批量导入教师" width="520px" @closed="resetImport" append-to-body>
      <el-alert type="info" :closable="false" show-icon class="import-tip">
        <template #title>
          请按模板格式填写后上传（.xlsx）。导入成功的教师将自动创建登录账号（工号登录，初始密码 123456）。
          <el-link type="primary" underline="never" @click="handleDownloadTemplate">下载导入模板</el-link>
        </template>
      </el-alert>
      <el-upload
        drag
        accept=".xlsx"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-remove="() => (importFileRaw = null)"
        class="import-upload"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击选择</em></div>
      </el-upload>

      <div v-if="importResult" class="import-result" :class="importResult.failCount ? 'has-fail' : 'all-ok'">
        <div class="import-summary">
          共 {{ importResult.total }} 条：成功 <b>{{ importResult.successCount }}</b> 条，失败 <b>{{ importResult.failCount }}</b> 条
        </div>
        <ul v-if="importResult.failMessages && importResult.failMessages.length" class="fail-list">
          <li v-for="(msg, i) in importResult.failMessages" :key="i">{{ msg }}</li>
        </ul>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importing" :disabled="!importFileRaw" @click="handleImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import {
  getTeacherPage, addTeacher, updateTeacher, deleteTeacher,
  importTeachers, exportTeachers, downloadTeacherTemplate,
  getCollegeList
} from '@/api/student'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()

const queryForm = reactive({ page: 1, size: 10, keyword: '', college: '' })

// 院系筛选下拉选项（复用学生管理去重学院接口）
const colleges = ref([])

const form = reactive({
  teacherNo: '', name: '', gender: 0, college: '', title: 0, phone: ''
})

const rules = {
  teacherNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  college: [{ required: true, message: '请输入院系', trigger: 'blur' }]
}

async function loadData() {
  loading.value = true
  try {
    const res = await getTeacherPage(queryForm)
    tableData.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {} finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.keyword = ''
  queryForm.college = ''
  queryForm.page = 1
  loadData()
}

// 院系下拉切换后自动刷新（回到第1页）
function handleFilterChange() {
  queryForm.page = 1
  loadData()
}

// 输入防抖：停顿 300ms 后自动查询
let searchTimer = null
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    queryForm.page = 1
    loadData()
  }, 300)
}
onBeforeUnmount(() => clearTimeout(searchTimer))

// ===== Excel 导出 =====
function saveBlob(res, filename) {
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  try {
    const res = await exportTeachers({ keyword: queryForm.keyword, college: queryForm.college })
    saveBlob(res, '教师名单.xlsx')
    ElMessage.success('导出成功')
  } catch (err) {}
}

// ===== Excel 批量导入 =====
const importDialogVisible = ref(false)
const importing = ref(false)
const importFileRaw = ref(null)
const importResult = ref(null)

function handleFileChange(file) {
  importFileRaw.value = file.raw
  importResult.value = null
}

async function handleDownloadTemplate() {
  try {
    const res = await downloadTeacherTemplate()
    saveBlob(res, '教师导入模板.xlsx')
  } catch (err) {}
}

async function handleImport() {
  if (!importFileRaw.value) return
  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFileRaw.value)
    const res = await importTeachers(formData)
    importResult.value = res.data
    if (res.data && res.data.successCount > 0) loadData()
  } catch (err) {} finally {
    importing.value = false
  }
}

function resetImport() {
  importFileRaw.value = null
  importResult.value = null
}

function openDialog(row) {
  editId.value = row?.id || null
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { teacherNo: '', name: '', gender: 0, college: '', title: 0, phone: '' })
  }
  dialogVisible.value = true
}

function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      if (editId.value) {
        await updateTeacher(editId.value, form)
        ElMessage.success('修改成功')
      } else {
        await addTeacher(form)
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
  ElMessageBox.confirm(`确定删除教师 ${row.name} 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteTeacher(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
    .catch(() => {})
}

function handleResetPwd(row) {
  ElMessageBox.confirm(`确定重置 ${row.name} 的密码吗？`, '提示', { type: 'warning' })
    .then(async () => {
      ElMessage.success('重置成功，默认密码为123456')
    })
    .catch(() => {})
}

onMounted(() => {
  loadData()
  // 加载院系筛选下拉选项
  getCollegeList().then(res => { colleges.value = res.data || [] }).catch(() => {})
})
</script>

<style scoped>
.header-bar { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
.query-form { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

/* 表格概要 */
.table-summary { font-size: 13px; color: #5d6b80; margin-bottom: 12px; }
.table-summary b { color: #1d3a6e; font-weight: 600; }

/* 性别语义色点：藏蓝=男 / 砖红=女（教师端 0=男, 1=女） */
.gender-cell { display: inline-flex; align-items: center; gap: 6px; }
.gender-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.gender-cell.is-male .gender-dot { background: #1d3a6e; }
.gender-cell.is-female .gender-dot { background: #ae4a45; }

/* 工号/手机号等宽数字，纵向严格对齐 */
.page-enter :deep(.num-col .cell) { font-variant-numeric: tabular-nums; letter-spacing: 0.3px; }

/* 页面入场渐入 */
.page-enter { animation: fadeUp 0.45s ease both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

/* 导入弹窗 */
.import-tip { margin-bottom: 14px; }
.import-upload { width: 100%; }
.import-result { margin-top: 14px; border-radius: 8px; padding: 10px 14px; font-size: 13px; background: #f6f8fb; }
.import-result.all-ok { background: rgba(79, 125, 99, 0.1); }
.import-result.has-fail { background: rgba(174, 74, 69, 0.06); }
.import-result .import-summary b { color: #1d3a6e; }
.fail-list { margin: 8px 0 0; padding-left: 18px; max-height: 120px; overflow-y: auto; font-size: 12px; color: #ae4a45; }
</style>
