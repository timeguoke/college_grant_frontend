<template>
  <div class="page-enter">
    <el-card>
      <template #header>
        <div class="header-bar"><span>评分管理</span></div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-input v-model="queryForm.keyword" placeholder="学号/姓名" clearable style="width: 180px" @input="debounceSearch" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-summary">共 <b>{{ total }}</b> 条评分记录</div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="studentNo" label="学号" min-width="120" sortable class-name="num-col" />
        <el-table-column prop="studentName" label="姓名" width="80" />
        <el-table-column prop="typeName" label="助学金类型" min-width="130" />
        <el-table-column prop="economicScore" label="经济分" width="90" align="center" class-name="score-col" />
        <el-table-column prop="familyBurdenScore" label="家庭负担" width="100" align="center" class-name="score-col" />
        <el-table-column prop="specialHardshipScore" label="特殊困难" width="100" align="center" class-name="score-col" />
        <el-table-column prop="disasterScore" label="突发困难" width="100" align="center" class-name="score-col" />
        <el-table-column prop="scorerName" label="评分人" min-width="90" />
        <el-table-column prop="scoreTime" label="评分时间" min-width="160" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getScoreList } from '@/api/student'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const queryForm = reactive({ page: 1, size: 10, keyword: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await getScoreList(queryForm)
    tableData.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {} finally {
    loading.value = false
  }
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
  queryForm.keyword = ''
  queryForm.page = 1
  loadData()
}

onMounted(() => loadData())
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

/* 学号等宽数字 */
.page-enter :deep(.num-col .cell) { font-variant-numeric: tabular-nums; letter-spacing: 0.3px; }

/* 分数列等宽 + 金棕衬线，四个维度视觉统一 */
.page-enter :deep(.score-col .cell) {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #8d6e32;
  letter-spacing: 0.5px;
}
</style>
