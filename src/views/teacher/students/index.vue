<template>
  <div class="page-enter teacher-students">
    <!-- 页头 -->
    <div class="page-head reveal">
      <div class="kicker"><span class="kicker-bar"></span>MY STUDENTS</div>
      <h2 class="page-title">我的学生</h2>
      <p class="page-desc">我名下的学生总览，点击「查看申请」可了解每位学生的助学金申请情况</p>
    </div>

    <!-- 搜索 -->
    <div class="search-bar reveal">
      <el-input v-model="keyword" placeholder="学号/姓名" clearable style="width:180px" @clear="loadData" @keyup.enter="loadData" />
      <el-button type="primary" @click="loadData">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-card class="table-card reveal" v-loading="loading">
      <template #header><span class="card-header-text">共 <b>{{ total }}</b> 名学生</span></template>
      <el-table :data="list" border stripe size="small">
        <el-table-column prop="studentNo" label="学号" min-width="110" class-name="num-col" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="gender" label="性别" width="70">
          <template #default="{ row }">
            <span class="gender-cell" :class="row.gender === 1 ? 'is-male' : 'is-female'">
              <i class="gender-dot"></i>{{ row.gender === 1 ? '男' : '女' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="college" label="学院" min-width="140" show-overflow-tooltip />
        <el-table-column prop="className" label="班级" min-width="100" />
        <el-table-column prop="specialType" label="特殊类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.specialType === 1" type="danger" size="small">建档立卡</el-tag>
            <el-tag v-else-if="row.specialType === 2" type="warning" size="small">低保</el-tag>
            <el-tag v-else-if="row.specialType === 3" type="info" size="small">孤儿</el-tag>
            <el-tag v-else-if="row.specialType === 4" type="primary" size="small">残疾</el-tag>
            <el-tag v-else type="info" effect="plain" size="small">普通</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyCount" label="申请次数" width="90" align="center" class-name="num-col">
          <template #default="{ row }">
            <span class="apply-count" :class="{ 'is-zero': !row.applyCount }">{{ row.applyCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="latestStatus" label="最新状态" width="100">
          <template #default="{ row }">
            <template v-if="row.latestStatus !== null && row.latestStatus !== undefined">
              <span class="status-dot" :class="statusClass(row.latestStatus)"></span>
              <span class="status-text" :class="statusClass(row.latestStatus)">{{ statusText(row.latestStatus) }}</span>
            </template>
            <span v-else class="no-apply">暂无申请</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :disabled="!row.applyCount" @click="openApplications(row)">查看申请</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分页 -->
    <div class="pager reveal" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </div>

    <!-- 学生申请记录弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" append-to-body>
      <el-table v-if="appList.length" :data="appList" border stripe size="small" v-loading="appLoading">
        <el-table-column prop="typeName" label="助学金类型" min-width="120" />
        <el-table-column prop="specialType" label="特殊类型" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.specialType === 1" type="danger" size="small">建档立卡</el-tag>
            <el-tag v-else-if="row.specialType === 2" type="warning" size="small">低保</el-tag>
            <el-tag v-else-if="row.specialType === 3" type="info" size="small">孤儿</el-tag>
            <el-tag v-else-if="row.specialType === 4" type="primary" size="small">残疾</el-tag>
            <el-tag v-else type="info" effect="plain" size="small">普通</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span class="status-dot" :class="statusClass(row.status)"></span>
            <span class="status-text" :class="statusClass(row.status)">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="110" class-name="num-col">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="reviewComment" label="审核意见" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.reviewComment || '—' }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!appLoading" description="暂无申请记录" :image-size="80" />
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getMyStudentPage, getStudentApplications } from '@/api/teacher'

const keyword = ref('')
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const appList = ref([])
const appLoading = ref(false)

function statusClass(s) {
  if (s === 0) return 'pending'
  if (s === 1) return 'passed'
  if (s === 2) return 'rejected'
  if (s === 3) return 'scored'
  if (s === 4) return 'evaluated'
  if (s === 5) return 'published'
  return ''
}

function statusText(s) {
  const map = { 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已评分', 4: '已评定', 5: '已公示' }
  return map[s] || '未知'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getMyStudentPage({ page: currentPage.value, size: pageSize.value, keyword: keyword.value })
    list.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {
    console.error('加载学生列表失败', err)
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  keyword.value = ''
  currentPage.value = 1
  loadData()
}

async function openApplications(row) {
  dialogTitle.value = `${row.name}（${row.studentNo}）的申请记录`
  dialogVisible.value = true
  appLoading.value = true
  appList.value = []
  try {
    const res = await getStudentApplications(row.id)
    appList.value = res.data || []
  } catch (err) {
    console.error('加载申请记录失败', err)
  } finally {
    appLoading.value = false
  }
}

function setupReveal() {
  nextTick(() => {
    const els = document.querySelectorAll('.teacher-students .reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.05 })
    els.forEach(el => io.observe(el))
  })
}

onMounted(async () => {
  await loadData()
  setupReveal()
})
</script>

<style scoped>
.teacher-students { width: calc(100% - 100px) !important; margin: 0 auto; padding: 20px 0; }

/* 页头 */
.page-head { margin-bottom: 20px; }
.kicker { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 2px; color: #c9a24e; font-weight: 600; margin-bottom: 4px; }
.kicker-bar { width: 20px; height: 2px; background: #c9a24e; }
.page-title { font-family: 'Georgia', 'Noto Serif SC', serif; font-size: 22px; color: #1d3a6e; margin: 0 0 8px; }
.page-desc { font-size: 13px; color: #889; margin: 0; }

/* 搜索行 */
.search-bar { display: flex; gap: 10px; margin-bottom: 16px; }

/* 表格卡片 */
.table-card { border: 1px solid #e8ecf1; }
.card-header-text b { color: #1d3a6e; }

/* 等宽数字列 */
:deep(.num-col .cell) { font-variant-numeric: tabular-nums; }

/* 性别色点 */
.gender-cell { display: inline-flex; align-items: center; gap: 5px; }
.gender-dot { width: 6px; height: 6px; border-radius: 50%; }
.gender-cell.is-male .gender-dot { background: #409eff; }
.gender-cell.is-female .gender-dot { background: #f56c8e; }

/* 申请次数：金棕加粗等宽，作为视觉重心 */
.apply-count { font-weight: 700; color: #b8862b; font-variant-numeric: tabular-nums; font-size: 15px; }
.apply-count.is-zero { color: #c0c4cc; font-weight: 400; }

/* 状态语义色点 */
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.status-dot.pending { background: #e6a23c; }
.status-dot.passed { background: #67c23a; }
.status-dot.rejected { background: #f56c6c; }
.status-dot.scored { background: #409eff; }
.status-dot.evaluated { background: #1d3a6e; }
.status-dot.published { background: #c9a24e; }
.status-text.pending { color: #e6a23c; }
.status-text.passed { color: #67c23a; }
.status-text.rejected { color: #f56c6c; }
.status-text.scored { color: #409eff; }
.status-text.evaluated { color: #1d3a6e; }
.status-text.published { color: #c9a24e; }
.no-apply { color: #c0c4cc; font-size: 12px; }

/* 分页 */
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }

/* 入场动效 */
.reveal { opacity: 0; transform: translateY(12px); transition: opacity .5s ease, transform .5s ease; }
.reveal-in { opacity: 1; transform: none; }
</style>
