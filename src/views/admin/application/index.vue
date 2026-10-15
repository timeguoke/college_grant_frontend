<template>
  <div class="page-enter">
    <el-card>
      <template #header>
        <div class="header-bar"><span>申请管理</span></div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-select v-model="queryForm.typeId" placeholder="助学金类型" clearable style="width: 180px" @change="handleFilterChange">
            <el-option v-for="t in typeList" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.status" placeholder="状态" clearable style="width: 120px" @change="handleFilterChange">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已驳回" :value="2" />
            <el-option label="已评分" :value="3" />
            <el-option label="已评定" :value="4" />
            <el-option label="已公示" :value="5" />
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

      <div class="table-summary">共 <b>{{ total }}</b> 条申请</div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="studentNo" label="学号" min-width="120" sortable class-name="num-col" />
        <el-table-column prop="studentName" label="姓名" width="80" />
        <el-table-column prop="typeName" label="助学金类型" min-width="120" />
        <el-table-column prop="specialType" label="特殊类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.specialType === 1" type="danger">建档立卡</el-tag>
            <el-tag v-else-if="row.specialType === 2" type="warning">低保家庭</el-tag>
            <el-tag v-else-if="row.specialType === 3" type="info">孤儿</el-tag>
            <el-tag v-else-if="row.specialType === 4" type="primary">残疾</el-tag>
            <el-tag v-else type="info" effect="plain">普通</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span class="status-cell" :class="'status-' + row.status">
              <i class="status-dot"></i>{{ statusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reviewerName" label="审核人" min-width="80" />
        <el-table-column prop="createTime" label="申请时间" min-width="160" />
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

    <el-dialog v-model="detailVisible" title="申请详情" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="学号">{{ detail.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.studentName }}</el-descriptions-item>
        <el-descriptions-item label="助学金类型">{{ detail.typeName }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusText(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="特殊类型">
          <el-tag v-if="detail.specialType > 0" type="danger">{{ specialText(detail.specialType) }}</el-tag>
          <span v-else>普通</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核人">{{ detail.reviewerName }}</el-descriptions-item>
        <el-descriptions-item label="申请理由" :span="2">{{ detail.applyReason }}</el-descriptions-item>
        <el-descriptions-item label="家庭情况" :span="2">{{ detail.familySituation }}</el-descriptions-item>
        <el-descriptions-item label="家庭年收入">{{ detail.familyIncome != null ? detail.familyIncome + ' 元' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="家庭人口数">{{ detail.familyMembers != null ? detail.familyMembers + ' 人' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="人均年收入" :span="2">{{ detail.perCapitaIncome != null ? detail.perCapitaIncome + ' 元/人' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="证明材料" :span="2">
          <a v-if="detail.specialProof" :href="detail.specialProof" target="_blank">查看文件</a>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核意见" :span="2">{{ detail.reviewComment || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getApplicationPage, getApplicationDetail, getGrantTypeList } from '@/api/student'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const typeList = ref([])
const detailVisible = ref(false)
const detail = ref(null)

const queryForm = reactive({ page: 1, size: 10, typeId: null, status: null, keyword: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await getApplicationPage(queryForm)
    tableData.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {} finally {
    loading.value = false
  }
}

async function loadTypes() {
  const res = await getGrantTypeList()
  typeList.value = res.data || []
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
  queryForm.status = null
  queryForm.keyword = ''
  queryForm.page = 1
  loadData()
}

async function viewDetail(row) {
  const res = await getApplicationDetail(row.id)
  detail.value = res.data
  detailVisible.value = true
}

function statusText(status) {
  return ['待审核', '已通过', '已驳回', '已评分', '已评定', '已公示'][status] || ''
}
function statusTag(status) {
  return ['warning', 'success', 'danger', 'primary', 'info', 'success'][status] || ''
}
function specialText(type) {
  return ['', '建档立卡', '低保家庭', '孤儿', '残疾'][type] || ''
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

/* 状态语义色点 */
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-0 .status-dot { background: #e6a23c; }  /* 待审核-橙 */
.status-0 { color: #b88230; }
.status-1 .status-dot { background: #4f7d63; }  /* 已通过-绿 */
.status-1 { color: #4f7d63; }
.status-2 .status-dot { background: #ae4a45; }  /* 已驳回-红 */
.status-2 { color: #ae4a45; }
.status-3 .status-dot { background: #1d3a6e; }  /* 已评分-藏蓝 */
.status-3 { color: #1d3a6e; }
.status-4 .status-dot { background: #6b7280; }  /* 已评定-灰蓝 */
.status-4 { color: #6b7280; }
.status-5 .status-dot { background: #c9a24e; }  /* 已公示-金 */
.status-5 { color: #8d6e32; }

/* 学号等宽数字 */
.page-enter :deep(.num-col .cell) { font-variant-numeric: tabular-nums; letter-spacing: 0.3px; }
</style>
