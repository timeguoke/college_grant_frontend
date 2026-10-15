<template>
  <div class="page-enter teacher-eval">
    <!-- 页头 -->
    <div class="page-head reveal">
      <div class="kicker"><span class="kicker-bar"></span>EVALUATION RESULTS</div>
      <h2 class="page-title">评定结果</h2>
      <div class="stats-row">
        <div class="stat-mini">
          <div class="stat-num">{{ total }}</div>
          <div class="stat-label">评定总人数</div>
        </div>
        <div class="stat-mini">
          <div class="stat-num gold-num">{{ firstClassCount }}</div>
          <div class="stat-label">一等奖人数</div>
        </div>
        <div class="stat-mini">
          <div class="stat-num">{{ avgScore }}</div>
          <div class="stat-label">平均总分</div>
        </div>
        <div class="stat-mini">
          <div class="stat-num amount-num">¥{{ totalAmount }}</div>
          <div class="stat-label">资助总金额</div>
        </div>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar reveal" style="margin-bottom:16px">
      <el-input v-model="keyword" placeholder="学号/姓名" clearable style="width:180px" @clear="loadData" @keyup.enter="loadData" />
      <el-select v-model="typeId" placeholder="助学金类型" clearable style="width:180px" @change="loadData">
        <el-option v-for="t in grantTypes" :key="t.id" :label="t.typeName" :value="t.id" />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
    </div>

    <!-- 表格 -->
    <el-card class="table-card reveal" v-loading="loading">
      <template #header><span class="card-header-text">共 {{ total }} 条评定结果</span></template>
      <el-table :data="list" border stripe size="small">
        <el-table-column prop="studentNo" label="学号" min-width="120" class-name="num-col" />
        <el-table-column prop="studentName" label="姓名" min-width="80" />
        <el-table-column prop="typeName" label="助学金类型" min-width="120" />
        <el-table-column prop="score" label="总分" min-width="80" class-name="num-col">
          <template #default="{ row }"><span class="score-val">{{ row.score }}</span></template>
        </el-table-column>
        <el-table-column prop="ranking" label="排名" min-width="80" class-name="num-col">
          <template #default="{ row }">
            <span v-if="row.ranking === 1" class="rank-tag rank-gold">第1名</span>
            <span v-else-if="row.ranking <= 3" class="rank-tag rank-silver">第{{ row.ranking }}名</span>
            <span v-else class="rank-num">第{{ row.ranking }}名</span>
          </template>
        </el-table-column>
        <el-table-column prop="levelName" label="等级" min-width="80">
          <template #default="{ row }">
            <span v-if="row.levelName" class="level-tag">{{ row.levelName }}</span>
            <span v-else class="no-level">未评上</span>
          </template>
        </el-table-column>
        <el-table-column prop="grantAmount" label="资助金额(元)" min-width="120" class-name="num-col">
          <template #default="{ row }"><span class="amount-val">{{ row.grantAmount != null ? '¥' + Number(row.grantAmount).toLocaleString() : '—' }}</span></template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分页 -->
    <div class="pager reveal" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getEvaluationList, getGrantTypeList } from '@/api/teacher'

const keyword = ref('')
const typeId = ref(null)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const grantTypes = ref([])

// 统计卡片：平均总分、资助总金额、一等奖人数（基于当前列表数据）
const avgScore = computed(() => {
  const scored = list.value.filter(i => i.score != null)
  if (!scored.length) return '—'
  return (scored.reduce((s, i) => s + Number(i.score), 0) / scored.length).toFixed(1)
})
const totalAmount = computed(() => {
  return list.value.reduce((s, i) => s + (Number(i.grantAmount) || 0), 0).toLocaleString()
})
const firstClassCount = computed(() => {
  return list.value.filter(i => i.levelName === '一等').length
})

async function loadData() {
  loading.value = true
  try {
    const res = await getEvaluationList({ page: currentPage.value, size: pageSize.value, typeId: typeId.value, keyword: keyword.value })
    list.value = res.rows || res.data?.rows || []
    total.value = res.total || res.data?.total || 0
  } catch (err) {
    console.error('加载评定结果失败', err)
  } finally {
    loading.value = false
  }
}

async function loadTypes() {
  try {
    const res = await getGrantTypeList()
    grantTypes.value = res.data || res || []
  } catch (err) {}
}

function setupReveal() {
  nextTick(() => {
    const els = document.querySelectorAll('.teacher-eval .reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.05 })
    els.forEach(el => io.observe(el))
  })
}

onMounted(async () => {
  await Promise.all([loadData(), loadTypes()])
  setupReveal()
})
</script>

<style scoped>
.teacher-eval { width: calc(100% - 100px) !important; margin: 0 auto; padding: 20px 0; }
.page-head { margin-bottom: 20px; }
.kicker { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 2px; color: #c9a24e; font-weight: 600; margin-bottom: 4px; }
.kicker-bar { width: 20px; height: 2px; background: #c9a24e; }
.page-title { font-family: 'Georgia', 'Noto Serif SC', serif; font-size: 22px; color: #1d3a6e; margin: 0 0 12px; }
.stats-row { display: flex; gap: 16px; flex-wrap: wrap; }
.stat-mini { background: #f8f9fb; border: 1px solid #e8ecf1; border-radius: 8px; padding: 8px 16px; min-width: 90px; }
.stat-num { font-family: Georgia, serif; font-size: 22px; color: #1d3a6e; font-weight: 700; font-variant-numeric: tabular-nums; }
.stat-num.amount-num { color: #b8862b; }
.stat-num.gold-num { color: #c9a24e; }
.stat-label { font-size: 12px; color: #889; }
.search-bar { display: flex; gap: 8px; }
.card-header-text { font-size: 13px; color: #889; }
.score-val { color: #b8860b; font-weight: 700; font-variant-numeric: tabular-nums; }
.amount-val { color: #b8860b; font-weight: 600; font-variant-numeric: tabular-nums; }
.rank-tag { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
.rank-gold { background: #c9a24e; color: #fff; }
.rank-silver { background: #fdf8ec; color: #c9a24e; border: 1px solid #c9a24e; }
.rank-num { font-size: 12px; color: #889; font-variant-numeric: tabular-nums; }
.level-tag { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #e8ecf1; color: #1d3a6e; }
.no-level { font-size: 12px; color: #aaa; }
:deep(.num-col) { font-variant-numeric: tabular-nums; }
.pager { display: flex; justify-content: center; margin: 20px 0; }
.reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
.reveal-in { opacity: 1; transform: translateY(0); }
</style>
