<template>
  <div class="page-enter profile-page">
    <!-- 开放页头 -->
    <header class="page-head reveal">
      <div class="head-left">
        <div class="page-kicker">MY PROFILE</div>
        <h2 class="page-title">我的资料</h2>
        <p class="page-sub">学籍信息由学校统一维护，如需变更请联系辅导员</p>
      </div>
      <div class="head-badge">
        <el-icon :size="22"><Postcard /></el-icon>
        <span>学籍档案</span>
      </div>
    </header>

    <div v-loading="loading" class="profile-wrap reveal">
      <!-- 加载失败/未关联 -->
      <el-card v-if="!loading && !profile" shadow="never" class="empty-card">
        <el-empty description="未找到学籍信息，请联系管理员核对账号关联" />
      </el-card>

      <!-- 分屏档案卡 -->
      <div v-else-if="profile" class="profile-card">
        <!-- 左：藏蓝身份面板 -->
        <div class="p-side">
          <div class="p-avatar">{{ avatarChar }}</div>
          <div class="p-name">{{ profile.name }}</div>
          <div class="p-no">{{ profile.studentNo }}</div>
          <div class="p-tags">
            <span class="p-tag">{{ genderText }}</span>
            <span v-if="profile.specialType > 0" class="p-tag p-tag-warn">{{ specialNames[profile.specialType] }}</span>
            <span v-else class="p-tag p-tag-plain">普通生</span>
          </div>
        </div>
        <!-- 右：信息网格 -->
        <div class="p-main">
          <div class="p-grid">
            <div class="p-item">
              <div class="p-label">姓名</div>
              <div class="p-value">{{ profile.name || '—' }}</div>
            </div>
            <div class="p-item">
              <div class="p-label">学号</div>
              <div class="p-value">{{ profile.studentNo || '—' }}</div>
            </div>
            <div class="p-item">
              <div class="p-label">性别</div>
              <div class="p-value">{{ genderText }}</div>
            </div>
            <div class="p-item">
              <div class="p-label">学院</div>
              <div class="p-value">{{ profile.college || '—' }}</div>
            </div>
            <div class="p-item">
              <div class="p-label">专业</div>
              <div class="p-value">{{ profile.major || '—' }}</div>
            </div>
            <div class="p-item">
              <div class="p-label">班级</div>
              <div class="p-value">{{ profile.className || '—' }}</div>
            </div>
            <div class="p-item">
              <div class="p-label">联系电话</div>
              <div class="p-value">{{ profile.phone || '—' }}</div>
            </div>
            <div class="p-item">
              <div class="p-label">特殊困难类型</div>
              <div class="p-value">{{ profile.specialType > 0 ? specialNames[profile.specialType] : '无' }}</div>
            </div>
          </div>
          <div class="p-note">
            <el-icon><InfoFilled /></el-icon>
            <span>以上信息来自学校学籍库，如有错误请联系辅导员更正；申请资助时家庭经济信息在申请表中填写。</span>
          </div>
        </div>
      </div>

      <!-- 下方双卡：资助概览 + 快捷入口 -->
      <div v-if="profile" class="bottom-grid">
        <!-- 资助概览 -->
        <div class="panel-card">
          <div class="panel-kicker">OVERVIEW</div>
          <h3 class="panel-title">资助概览</h3>
          <div class="ov-grid">
            <div class="ov-item" :class="{ 'is-todo': overview.available > 0 }">
              <div class="ov-num">{{ overview.available }}</div>
              <div class="ov-label">可申请项目</div>
            </div>
            <div class="ov-item">
              <div class="ov-num">{{ overview.myApplications }}</div>
              <div class="ov-label">我的申请</div>
            </div>
            <div class="ov-item">
              <div class="ov-num">{{ overview.notices }}</div>
              <div class="ov-label">公示批次</div>
            </div>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="panel-card">
          <div class="panel-kicker">SHORTCUTS</div>
          <h3 class="panel-title">快捷入口</h3>
          <div class="shortcut-list">
            <div class="shortcut-item" @click="$router.push('/student/apply')">
              <div class="sc-text">
                <div class="sc-name">申请资助</div>
                <div class="sc-desc">{{ overview.available > 0 ? `${overview.available} 个项目可申请` : '暂无开放项目' }}</div>
              </div>
              <span class="sc-arrow">›</span>
            </div>
            <div class="shortcut-item" @click="$router.push('/student/application')">
              <div class="sc-text">
                <div class="sc-name">我的申请</div>
                <div class="sc-desc">已提交 {{ overview.myApplications }} 份申请</div>
              </div>
              <span class="sc-arrow">›</span>
            </div>
            <div class="shortcut-item" @click="$router.push('/student/notice')">
              <div class="sc-text">
                <div class="sc-name">公示查看</div>
                <div class="sc-desc">查看评定结果公示</div>
              </div>
              <span class="sc-arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { Postcard, InfoFilled } from '@element-plus/icons-vue'
import { getStudentProfile, getGrantTypeList, getMyApplications, getNoticePage } from '@/api/studentUser'

const loading = ref(false)
const profile = ref(null)

// 资助概览统计
const overview = reactive({ available: 0, myApplications: 0, notices: 0 })

async function loadOverview() {
  try {
    const [typeRes, appRes, noticeRes] = await Promise.all([
      getGrantTypeList(),
      getMyApplications({ page: 1, size: 1 }),
      getNoticePage({ page: 1, size: 1 })
    ])
    const typeData = typeRes.data || typeRes || []
    overview.available = Array.isArray(typeData) ? typeData.length : 0
    overview.myApplications = appRes.total ?? appRes.data?.total ?? 0
    overview.notices = noticeRes.total ?? noticeRes.data?.total ?? 0
  } catch (err) {}
}

const specialNames = { 1: '建档立卡', 2: '低保家庭', 3: '孤儿', 4: '残疾' }

const genderText = computed(() => (profile.value ? ({ 1: '男', 2: '女' }[profile.value.gender] || '—') : '—'))
const avatarChar = computed(() => (profile.value?.name || '学').charAt(0))

async function loadData() {
  loading.value = true
  try {
    const res = await getStudentProfile()
    profile.value = res.data
  } catch (err) {} finally {
    loading.value = false
  }
  nextTick(setupReveal)
}

// ============ 滚动渐入动效 ============
function setupReveal() {
  const els = document.querySelectorAll('.profile-page .reveal')
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('revealed'))
    return
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed')
        io.unobserve(e.target)
      }
    })
  }, { threshold: 0.1 })
  els.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 90, 360)}ms`
    io.observe(el)
  })
}

onMounted(() => {
  loadData()
  loadOverview()
})
</script>

<style scoped>
/* ============ 开放页头 ============ */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 6px 4px 20px;
  border-bottom: 1px solid #e2e7ef;
  margin-bottom: 22px;
}
.page-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 4px;
  color: #a1792f;
  margin-bottom: 10px;
}
.page-kicker::before {
  content: '';
  width: 26px;
  height: 2px;
  background: #c9a24e;
}
.page-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1d3a6e;
  margin: 0 0 8px;
}
.page-sub {
  font-size: 13px;
  color: #5d6b80;
  margin: 0;
  letter-spacing: 0.5px;
}
.head-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1d3a6e;
  background: rgba(29, 58, 110, 0.07);
  border: 1px solid rgba(29, 58, 110, 0.12);
  border-radius: 99px;
  padding: 8px 18px;
  flex-shrink: 0;
}

/* ============ 分屏档案卡 ============ */
.profile-wrap {
  width: 100%;
}
.empty-card {
  border-radius: 12px;
}
.profile-card {
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(15, 31, 61, 0.06);
}
.p-side {
  width: 280px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #1d3a6e 0%, #16294f 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 24px;
  position: relative;
}
.p-side::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #c9a24e;
}
.p-avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: rgba(201, 162, 78, 0.18);
  border: 2px solid rgba(201, 162, 78, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 34px;
  font-weight: 700;
  color: #e8cf9a;
  margin-bottom: 16px;
}
.p-name {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}
.p-no {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 6px;
  letter-spacing: 1px;
}
.p-tags {
  display: flex;
  gap: 8px;
  margin-top: 18px;
  flex-wrap: wrap;
  justify-content: center;
}
.p-tag {
  font-size: 12px;
  border-radius: 99px;
  padding: 3px 12px;
  letter-spacing: 0.5px;
}
.p-tag-warn {
  color: #e8cf9a;
  background: rgba(201, 162, 78, 0.2);
  border: 1px solid rgba(201, 162, 78, 0.45);
}
.p-tag-plain {
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.p-main {
  flex: 1;
  padding: 36px 36px 28px;
  min-width: 0;
}
.p-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px 32px;
}
.p-label {
  font-size: 12px;
  color: #8a94a6;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.p-value {
  font-size: 15px;
  color: #22344f;
  font-weight: 600;
}
.p-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 30px;
  padding-top: 18px;
  border-top: 1px dashed #ebeef3;
  font-size: 12px;
  color: #8a94a6;
  line-height: 1.7;
}
.p-note .el-icon {
  color: #c9a24e;
  margin-top: 2px;
}

/* ============ 下方双卡 ============ */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
.panel-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e7ef;
  padding: 20px 24px;
}
.panel-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 2px;
  color: #a1792f;
  margin-bottom: 8px;
}
.panel-kicker::before {
  content: '';
  width: 20px;
  height: 2px;
  background: #c9a24e;
}
.panel-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 17px;
  font-weight: 700;
  color: #1d3a6e;
  margin: 0 0 16px;
}

/* 资助概览 */
.ov-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ov-item {
  background: #f8f9fb;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 14px 16px;
}
.ov-item.is-todo {
  background: #fdf8ec;
  border-color: #f0e2c0;
}
.ov-num {
  font-family: Georgia, serif;
  font-size: 26px;
  font-weight: 700;
  color: #1d3a6e;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.ov-item.is-todo .ov-num {
  color: #b8862b;
}
.ov-label {
  font-size: 12px;
  color: #8a94a6;
  margin-top: 4px;
}

/* 快捷入口 */
.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  cursor: pointer;
  transition: all .25s;
}
.shortcut-item:hover {
  border-color: #c9a24e;
  background: #fdfbf5;
  transform: translateX(2px);
}
.sc-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d3a6e;
}
.sc-desc {
  font-size: 12px;
  color: #8a94a6;
  margin-top: 2px;
}
.sc-arrow {
  font-size: 20px;
  color: #ccc;
  transition: color .25s;
}
.shortcut-item:hover .sc-arrow {
  color: #c9a24e;
}

@media (max-width: 900px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .profile-card {
    flex-direction: column;
  }
  .p-side {
    width: 100%;
    padding: 32px 24px;
  }
}

/* ============ 滚动渐入动效 ============ */
.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal.revealed {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
