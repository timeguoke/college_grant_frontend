<template>
  <div class="page-enter teacher-profile">
    <!-- 分屏卡片 -->
    <div class="profile-card reveal" v-loading="loading">
      <!-- 左侧藏蓝面板 -->
      <div class="profile-left">
        <div class="avatar-circle">{{ avatarText }}</div>
        <div class="profile-name">{{ profile?.name || '教师' }}</div>
        <div class="profile-id">{{ profile?.teacherNo || '' }}</div>
        <div class="profile-divider"></div>
        <div class="profile-tag">{{ titleText }}</div>
      </div>
      <!-- 右侧信息网格 -->
      <div class="profile-right">
        <div class="kicker"><span class="kicker-bar"></span>PROFILE</div>
        <h2 class="page-title">我的资料</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">姓名</div>
            <div class="info-value">{{ profile?.name || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">工号</div>
            <div class="info-value">{{ profile?.teacherNo || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">性别</div>
            <div class="info-value">
              <span class="gender-dot" :class="profile?.gender === 0 ? 'male' : 'female'"></span>
              {{ profile?.gender === 0 ? '男' : '女' }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">职称</div>
            <div class="info-value">{{ titleText }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">所在学院</div>
            <div class="info-value">{{ profile?.college || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">联系电话</div>
            <div class="info-value">{{ profile?.phone || '-' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下方双卡：工作概览 + 快捷入口 -->
    <div class="bottom-grid">
      <!-- 工作概览 -->
      <div class="panel-card reveal">
        <div class="kicker"><span class="kicker-bar"></span>OVERVIEW</div>
        <h3 class="panel-title">工作概览</h3>
        <div class="ov-grid">
          <div class="ov-item" :class="{ 'is-todo': overview.pendingReview > 0 }">
            <div class="ov-num">{{ overview.pendingReview }}</div>
            <div class="ov-label">待审核申请</div>
          </div>
          <div class="ov-item" :class="{ 'is-todo': overview.pendingScore > 0 }">
            <div class="ov-num">{{ overview.pendingScore }}</div>
            <div class="ov-label">待评分</div>
          </div>
          <div class="ov-item">
            <div class="ov-num">{{ overview.scored }}</div>
            <div class="ov-label">已评分</div>
          </div>
          <div class="ov-item">
            <div class="ov-num">{{ overview.students }}</div>
            <div class="ov-label">所带学生</div>
          </div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="panel-card reveal">
        <div class="kicker"><span class="kicker-bar"></span>SHORTCUTS</div>
        <h3 class="panel-title">快捷入口</h3>
        <div class="shortcut-list">
          <div class="shortcut-item" @click="$router.push('/teacher/application')">
            <div class="sc-text">
              <div class="sc-name">申请审核</div>
              <div class="sc-desc">{{ overview.pendingReview > 0 ? `${overview.pendingReview} 份待处理` : '暂无待办' }}</div>
            </div>
            <span class="sc-arrow">›</span>
          </div>
          <div class="shortcut-item" @click="$router.push('/teacher/score')">
            <div class="sc-text">
              <div class="sc-name">学生评分</div>
              <div class="sc-desc">{{ overview.pendingScore > 0 ? `${overview.pendingScore} 份待评分` : '暂无待办' }}</div>
            </div>
            <span class="sc-arrow">›</span>
          </div>
          <div class="shortcut-item" @click="$router.push('/teacher/students')">
            <div class="sc-text">
              <div class="sc-name">我的学生</div>
              <div class="sc-desc">共 {{ overview.students }} 名学生</div>
            </div>
            <span class="sc-arrow">›</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { getTeacherProfile, getPendingApplications, getPendingScorePage, getMyScoreList, getMyStudentPage } from '@/api/teacher'

const profile = ref(null)
const loading = ref(false)

// 工作概览统计
const overview = reactive({ pendingReview: 0, pendingScore: 0, scored: 0, students: 0 })

function getTotal(res) {
  return res.total ?? res.data?.total ?? 0
}

async function loadOverview() {
  try {
    const [reviewRes, scoreRes, scoredRes, studentRes] = await Promise.all([
      getPendingApplications({ page: 1, size: 1, status: 0 }),
      getPendingScorePage({ page: 1, size: 1 }),
      getMyScoreList({ page: 1, size: 1 }),
      getMyStudentPage({ page: 1, size: 1 })
    ])
    overview.pendingReview = getTotal(reviewRes)
    overview.pendingScore = getTotal(scoreRes)
    overview.scored = getTotal(scoredRes)
    overview.students = getTotal(studentRes)
  } catch (err) {
    console.error('加载工作概览失败', err)
  }
}

const avatarText = computed(() => {
  const name = profile.value?.name || ''
  return name.charAt(0).toUpperCase()
})

const titleText = computed(() => {
  const map = { 0: '助教', 1: '讲师', 2: '副教授', 3: '教授' }
  return map[profile.value?.title] || '未设置'
})

async function loadData() {
  loading.value = true
  try {
    const res = await getTeacherProfile()
    profile.value = res.data || res
  } catch (err) {
    console.error('加载个人资料失败', err)
  } finally {
    loading.value = false
  }
}

function setupReveal() {
  nextTick(() => {
    const els = document.querySelectorAll('.teacher-profile .reveal')
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
  loadOverview()
  setupReveal()
})
</script>

<style scoped>
.teacher-profile { width: calc(100% - 100px) !important; margin: 0 auto; padding: 20px 0; }
.profile-card { width: 100%; display: flex; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.profile-left { width: 340px; background: #0f1f3d; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 12px; }
.avatar-circle { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.15); border: 2px solid #c9a24e; display: flex; align-items: center; justify-content: center; font-size: 32px; font-family: Georgia, serif; font-weight: 700; color: #c9a24e; }
.profile-name { font-family: Georgia, 'Noto Serif SC', serif; font-size: 22px; font-weight: 600; }
.profile-id { font-size: 14px; color: rgba(255,255,255,.6); }
.profile-divider { width: 40px; height: 2px; background: #c9a24e; }
.profile-tag { font-size: 13px; color: #c9a24e; background: rgba(201,162,78,.15); padding: 4px 12px; border-radius: 12px; }
.profile-right { flex: 1; padding: 32px; }
.kicker { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 2px; color: #c9a24e; font-weight: 600; margin-bottom: 4px; }
.kicker-bar { width: 20px; height: 2px; background: #c9a24e; }
.page-title { font-family: 'Georgia', 'Noto Serif SC', serif; font-size: 22px; color: #1d3a6e; margin: 0 0 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #889; }
.info-value { font-size: 15px; color: #1d3a6e; display: flex; align-items: center; gap: 4px; }
.gender-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
.gender-dot.male { background: #1d3a6e; }
.gender-dot.female { background: #c0584a; }

/* 下方双卡 */
.bottom-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; margin-top: 16px; }
.panel-card { background: #fff; border-radius: 12px; border: 1px solid #e8ecf1; padding: 20px 24px; }
.panel-title { font-family: Georgia, 'Noto Serif SC', serif; font-size: 17px; color: #1d3a6e; margin: 0 0 16px; }

/* 工作概览 */
.ov-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ov-item { background: #f8f9fb; border: 1px solid #e8ecf1; border-radius: 10px; padding: 14px 16px; }
.ov-item.is-todo { background: #fdf8ec; border-color: #f0e2c0; }
.ov-num { font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #1d3a6e; font-variant-numeric: tabular-nums; line-height: 1.1; }
.ov-item.is-todo .ov-num { color: #b8862b; }
.ov-label { font-size: 12px; color: #889; margin-top: 4px; }

/* 快捷入口 */
.shortcut-list { display: flex; flex-direction: column; gap: 10px; }
.shortcut-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid #e8ecf1; border-radius: 10px; cursor: pointer; transition: all .25s; }
.shortcut-item:hover { border-color: #c9a24e; background: #fdfbf5; transform: translateX(2px); }
.sc-name { font-size: 14px; font-weight: 600; color: #1d3a6e; }
.sc-desc { font-size: 12px; color: #889; margin-top: 2px; }
.sc-arrow { font-size: 20px; color: #ccc; transition: color .25s; }
.shortcut-item:hover .sc-arrow { color: #c9a24e; }
.reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
.reveal-in { opacity: 1; transform: translateY(0); }
</style>
