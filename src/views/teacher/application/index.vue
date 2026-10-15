<template>
  <div class="page-enter">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="kicker">APPLICATION REVIEW</span>
          <span class="card-title">申请审核</span>
          <span class="summary-badge" v-if="total > 0">待审核 <b>{{ total }}</b> 份</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-input v-model="queryForm.keyword" placeholder="学号/姓名" clearable style="width: 180px" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.typeId" placeholder="助学金类型" clearable style="width: 160px" @change="loadData">
            <el-option v-for="t in typeList" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.specialType" placeholder="特殊/普通" clearable style="width: 130px" @change="loadData">
            <el-option label="普通" :value="0" />
            <el-option label="特殊困难" :value="-1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">刷新</el-button>
        </el-form-item>
        <el-form-item v-if="selectedIds.length > 0">
          <el-button type="success" :icon="Check" @click="batchReview(1)">批量通过</el-button>
          <el-button type="danger" :icon="Close" @click="batchReview(2)">批量驳回</el-button>
          <span class="batch-count">已选 {{ selectedIds.length }} 项</span>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-panel">
              <div class="expand-item full">
                <span class="expand-label">申请理由</span>
                <span class="expand-value">{{ row.applyReason }}</span>
              </div>
              <div class="expand-item full" v-if="row.familySituation">
                <span class="expand-label">家庭情况</span>
                <span class="expand-value">{{ row.familySituation }}</span>
              </div>
              <div class="expand-item">
                <span class="expand-label">家庭年收入</span>
                <span class="expand-value money">{{ row.familyIncome != null ? '¥' + Number(row.familyIncome).toLocaleString() : '—' }}</span>
              </div>
              <div class="expand-item">
                <span class="expand-label">家庭人数</span>
                <span class="expand-value num">{{ row.familyMembers != null ? row.familyMembers + ' 人' : '—' }}</span>
              </div>
              <div class="expand-item">
                <span class="expand-label">人均收入</span>
                <span class="expand-value money">{{ row.perCapitaIncome != null ? '¥' + Number(row.perCapitaIncome).toLocaleString() : '—' }}</span>
              </div>
              <div class="expand-item">
                <span class="expand-label">证明材料</span>
                <span class="expand-value">
                  <a v-if="row.specialProof" :href="row.specialProof" target="_blank" class="proof-link">查看文件</a>
                  <span v-else>无</span>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="selection" width="45" />
        <el-table-column prop="studentNo" label="学号" width="115" class-name="num-col" />
        <el-table-column prop="studentName" label="姓名" width="80" />
        <el-table-column prop="typeName" label="助学金类型" width="125" />
        <el-table-column prop="specialType" label="特殊" width="80">
          <template #default="{ row }">
            <span v-if="row.specialType > 0" class="dot dot-red"></span>
            <span v-else class="dot dot-gray"></span>
            <span>{{ row.specialType > 0 ? '特殊' : '普通' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="perCapitaIncome" label="人均收入" width="100" class-name="num-col">
          <template #default="{ row }">
            <span class="income-val">{{ row.perCapitaIncome != null ? '¥' + Number(row.perCapitaIncome).toLocaleString() : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applyReason" label="申请理由" show-overflow-tooltip />
        <el-table-column prop="createTime" label="申请时间" width="160" class-name="num-col" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openReview(row)">审核</el-button>
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

    <el-dialog v-model="reviewVisible" title="申请审核" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="currentApp" style="margin-bottom: 20px">
        <el-descriptions-item label="学号">{{ currentApp.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentApp.studentName }}</el-descriptions-item>
        <el-descriptions-item label="助学金类型">{{ currentApp.typeName }}</el-descriptions-item>
        <el-descriptions-item label="特殊类型">{{ ['', '建档立卡', '低保', '孤儿', '残疾'][currentApp.specialType] || '普通' }}</el-descriptions-item>
        <el-descriptions-item label="申请理由" :span="2">{{ currentApp.applyReason }}</el-descriptions-item>
        <el-descriptions-item label="家庭情况" :span="2">{{ currentApp.familySituation }}</el-descriptions-item>
        <el-descriptions-item label="证明材料" :span="2">
          <a v-if="currentApp.specialProof" :href="currentApp.specialProof" target="_blank">查看文件</a>
          <span v-else>无</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="reviewForm.reviewComment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleReview">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量审核弹窗 -->
    <el-dialog v-model="batchVisible" :title="batchTitle" width="420px" append-to-body>
      <p style="margin-bottom: 16px">确认对选中的 {{ selectedIds.length }} 条申请执行「{{ batchTitle }}」？</p>
      <el-form>
        <el-form-item label="审核意见">
          <el-input v-model="batchComment" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button :type="batchStatus === 1 ? 'success' : 'danger'" :loading="submitting" @click="handleBatchReview">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Check, Close, Refresh } from '@element-plus/icons-vue'
import { getPendingApplications, getApplicationDetail, reviewApplication, getGrantTypeList } from '@/api/teacher'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const reviewVisible = ref(false)
const currentApp = ref(null)
const typeList = ref([])
const selectedIds = ref([])
const batchVisible = ref(false)
const batchStatus = ref(1)
const batchComment = ref('')

const queryForm = reactive({ page: 1, size: 10, keyword: '', status: 0, typeId: undefined, specialType: undefined })
const reviewForm = reactive({ status: 1, reviewComment: '' })

const batchTitle = ref('')

async function loadData() {
  loading.value = true
  try {
    const params = { page: queryForm.page, size: queryForm.size, keyword: queryForm.keyword, status: 0 }
    if (queryForm.typeId !== undefined && queryForm.typeId !== null) {
      params.typeId = queryForm.typeId
    }
    // 特殊/普通：0=普通，-1=特殊困难，后端过滤
    if (queryForm.specialType !== undefined && queryForm.specialType !== null) {
      params.specialType = queryForm.specialType
    }
    const res = await getPendingApplications(params)
    tableData.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {} finally {
    loading.value = false
  }
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.typeId = undefined
  queryForm.specialType = undefined
  queryForm.page = 1
  loadData()
}

async function loadTypes() {
  try {
    const res = await getGrantTypeList({ status: 1 })
    typeList.value = res.data || res.rows || res || []
  } catch (err) {}
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function batchReview(status) {
  batchStatus.value = status
  batchTitle.value = status === 1 ? '批量通过' : '批量驳回'
  batchComment.value = ''
  batchVisible.value = true
}

async function handleBatchReview() {
  submitting.value = true
  try {
    for (const id of selectedIds.value) {
      await reviewApplication(id, { status: batchStatus.value, reviewComment: batchComment.value || (batchStatus.value === 1 ? '审核通过' : '审核不通过') })
    }
    ElMessage.success(`已${batchStatus.value === 1 ? '通过' : '驳回'} ${selectedIds.value.length} 条申请`)
    batchVisible.value = false
    selectedIds.value = []
    loadData()
  } catch (err) {
    ElMessage.error('批量审核失败')
  } finally {
    submitting.value = false
  }
}

async function openReview(row) {
  const res = await getApplicationDetail(row.id)
  currentApp.value = res.data
  reviewForm.status = 1
  reviewForm.reviewComment = ''
  reviewVisible.value = true
}

async function handleReview() {
  submitting.value = true
  try {
    await reviewApplication(currentApp.value.id, reviewForm)
    ElMessage.success('审核成功')
    reviewVisible.value = false
    loadData()
  } catch (err) {} finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
  loadTypes()
})
</script>

<style scoped>
.page-enter { width: calc(100% - 100px) !important; margin: 0 auto; }
.card-header { display: flex; align-items: center; gap: 12px; }
.kicker { font-size: 11px; letter-spacing: 2px; color: #c9a24e; font-weight: 600; }
.card-title { font-size: 16px; font-weight: 600; color: #1d3a6e; }
.summary-text { font-size: 13px; color: #999; margin-left: auto; }
/* 待审核数量徽章 */
.summary-badge { margin-left: auto; font-size: 12px; color: #b8862b; background: #fdf8ec; border: 1px solid #f0e2c0; padding: 3px 12px; border-radius: 20px; font-weight: 600; }
.summary-badge b { font-size: 15px; font-variant-numeric: tabular-nums; margin: 0 2px; }
/* 人均收入列：金棕等宽 */
.income-val { color: #b8862b; font-weight: 600; font-variant-numeric: tabular-nums; }
/* 行内展开审核面板 */
.expand-panel { display: flex; flex-wrap: wrap; gap: 12px 32px; padding: 12px 24px; background: #fafbfc; }
.expand-item { display: flex; align-items: baseline; gap: 8px; min-width: 200px; }
.expand-item.full { width: 100%; }
.expand-label { font-size: 12px; color: #889; flex-shrink: 0; }
.expand-value { font-size: 13px; color: #334; line-height: 1.6; }
.expand-value.money { color: #b8862b; font-weight: 700; font-variant-numeric: tabular-nums; }
.expand-value.num { font-variant-numeric: tabular-nums; }
.proof-link { color: #1d3a6e; }
.query-form { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.batch-count { font-size: 13px; color: #c9a24e; margin-left: 8px; }
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.dot-red { background: #c0303f; }
.dot-gray { background: #bbb; }
:deep(.num-col) { font-variant-numeric: tabular-nums; }
</style>
