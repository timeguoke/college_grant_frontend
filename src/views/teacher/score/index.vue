<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="kicker">SCORING</span>
          <span class="card-title">学生评分</span>
          <span class="todo-badge" v-if="total > 0">待评分 <b>{{ total }}</b> 份</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-input v-model="queryForm.keyword" placeholder="学号/姓名" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.typeId" placeholder="助学金类型" clearable style="width: 160px" @change="loadData">
            <el-option v-for="t in typeList" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 评分维度权重提示 -->
      <div class="weight-tip">
        <span class="tip-icon">i</span>
        评分将按 <b>家庭经济 35%</b> + <b>家庭负担 25%</b> + <b>特殊困难 20%</b> + <b>突发困难 20%</b> 加权计入 AHP 评定总分
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <template #empty>
          <el-empty description="本轮评分已全部完成" :image-size="90" />
        </template>
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="80" />
        <el-table-column prop="typeName" label="助学金类型" width="120" />
        <el-table-column prop="specialType" label="特殊" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.specialType > 0" type="danger">特殊</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyReason" label="申请理由" show-overflow-tooltip />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openScore(row)">评分</el-button>
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

    <el-dialog v-model="scoreVisible" title="学生评分" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="currentApp" style="margin-bottom: 20px">
        <el-descriptions-item label="学号">{{ currentApp.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentApp.studentName }}</el-descriptions-item>
        <el-descriptions-item label="助学金类型">{{ currentApp.typeName }}</el-descriptions-item>
        <el-descriptions-item label="申请理由">{{ currentApp.applyReason }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="scoreForm" label-width="100px">
        <el-form-item label="经济情况(0-100)">
          <el-input-number v-model="scoreForm.economicScore" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="家庭负担(0-100)">
          <el-input-number v-model="scoreForm.familyBurdenScore" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="特殊困难(0-100)">
          <el-input-number v-model="scoreForm.specialHardshipScore" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="突发困难(0-100)">
          <el-input-number v-model="scoreForm.disasterScore" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交评分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getPendingScorePage, submitScore, getGrantTypeList } from '@/api/teacher'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const scoreVisible = ref(false)
const currentApp = ref(null)
const typeList = ref([])

const queryForm = reactive({ page: 1, size: 10, keyword: '', typeId: null })
const scoreForm = reactive({
  applicationId: null,
  economicScore: 50,
  familyBurdenScore: 50,
  specialHardshipScore: 50,
  disasterScore: 50
})

async function loadData() {
  loading.value = true
  try {
    const res = await getPendingScorePage(queryForm)
    tableData.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {} finally {
    loading.value = false
  }
}

function openScore(row) {
  currentApp.value = row
  scoreForm.applicationId = row.id
  scoreForm.economicScore = 50
  scoreForm.familyBurdenScore = 50
  scoreForm.specialHardshipScore = 50
  scoreForm.disasterScore = 50
  scoreVisible.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    await submitScore(scoreForm)
    ElMessage.success('评分成功')
    scoreVisible.value = false
    loadData()
  } catch (err) {} finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loadData()
  try {
    const res = await getGrantTypeList()
    typeList.value = res.data || res.rows || []
  } catch (err) {}
})
</script>

<style scoped>
.query-form { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.card-header { display: flex; align-items: center; gap: 12px; }
.kicker { font-size: 11px; letter-spacing: 2px; color: #c9a24e; font-weight: 600; }
.card-title { font-size: 16px; font-weight: 600; color: #1d3a6e; }
/* 待评分数量徽章 */
.todo-badge { margin-left: auto; font-size: 12px; color: #b8862b; background: #fdf8ec; border: 1px solid #f0e2c0; padding: 3px 12px; border-radius: 20px; font-weight: 600; }
.todo-badge b { font-size: 15px; font-variant-numeric: tabular-nums; margin: 0 2px; }
/* 评分维度权重提示条 */
.weight-tip { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #8a6d3b; background: #fdf8ec; border: 1px solid #f0e2c0; border-radius: 8px; padding: 8px 14px; margin-bottom: 14px; }
.weight-tip b { color: #b8862b; }
.tip-icon { width: 16px; height: 16px; border-radius: 50%; background: #c9a24e; color: #fff; font-size: 11px; font-style: italic; font-family: Georgia, serif; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>
