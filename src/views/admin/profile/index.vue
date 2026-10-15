<template>
  <div class="admin-profile">
    <div v-loading="loading">
      <!-- 分屏资料卡 -->
      <div v-if="true" class="profile-card reveal">
        <!-- 左侧：藏蓝身份面板 -->
        <div class="left-panel">
          <div class="kicker light"><span class="kicker-bar gold"></span>ADMIN PROFILE</div>
          <div class="avatar-circle">{{ avatarLetter }}</div>
          <h2 class="name-serif">{{ userStore.username || '管理员' }}</h2>
          <div class="role-badge">系统管理员</div>
          <div class="perm-list">
            <div class="perm-item"><span class="perm-dot"></span>学生 / 教师数据管理</div>
            <div class="perm-item"><span class="perm-dot"></span>申请审核与评定业务</div>
            <div class="perm-item"><span class="perm-dot"></span>AHP 评定与公示发布</div>
            <div class="perm-item"><span class="perm-dot"></span>系统配置与账号管理</div>
          </div>
        </div>

        <!-- 右侧：账号信息 -->
        <div class="right-info">
          <div class="kicker"><span class="kicker-bar"></span>ACCOUNT INFO</div>
          <h3 class="info-title">账号信息</h3>

          <div class="info-grid">
            <div class="field">
              <label class="field-label">登录账号</label>
              <div class="field-value num">{{ userStore.username || 'admin' }}</div>
            </div>
            <div class="field">
              <label class="field-label">角色</label>
              <div class="field-value"><span class="role-tag">系统管理员</span></div>
            </div>
            <div class="field">
              <label class="field-label">数据权限</label>
              <div class="field-value">全校数据</div>
            </div>
            <div class="field">
              <label class="field-label">账号状态</label>
              <div class="field-value"><span class="status-ok"><i class="ok-dot"></i>正常</span></div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="form-actions">
            <el-button color="#1d3a6e" @click="$router.push('/admin/password')">修改密码</el-button>
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
            <div class="ov-item">
              <div class="ov-num">{{ overview.students }}</div>
              <div class="ov-label">学生总数</div>
            </div>
            <div class="ov-item">
              <div class="ov-num">{{ overview.teachers }}</div>
              <div class="ov-label">教师总数</div>
            </div>
            <div class="ov-item">
              <div class="ov-num">{{ overview.applications }}</div>
              <div class="ov-label">申请总数</div>
            </div>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="panel-card reveal">
          <div class="kicker"><span class="kicker-bar"></span>SHORTCUTS</div>
          <h3 class="panel-title">快捷入口</h3>
          <div class="shortcut-list">
            <div class="shortcut-item" @click="$router.push('/admin/application')">
              <div class="sc-text">
                <div class="sc-name">申请管理</div>
                <div class="sc-desc">{{ overview.pendingReview > 0 ? `${overview.pendingReview} 份待审核` : '暂无待办' }}</div>
              </div>
              <span class="sc-arrow">›</span>
            </div>
            <div class="shortcut-item" @click="$router.push('/admin/student')">
              <div class="sc-text">
                <div class="sc-name">学生管理</div>
                <div class="sc-desc">共 {{ overview.students }} 名学生</div>
              </div>
              <span class="sc-arrow">›</span>
            </div>
            <div class="shortcut-item" @click="$router.push('/admin/notice')">
              <div class="sc-text">
                <div class="sc-name">公示管理</div>
                <div class="sc-desc">发布与维护公示批次</div>
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
import { useUserStore } from '@/store/user'
import { getDashboard } from '@/api/dashboard'

const userStore = useUserStore()
const loading = ref(false)

const avatarLetter = computed(() => (userStore.username || 'A').charAt(0).toUpperCase())

// 工作概览统计（复用首页 dashboard 接口）
const overview = reactive({ pendingReview: 0, students: 0, teachers: 0, applications: 0 })

async function loadOverview() {
  loading.value = true
  try {
    const res = await getDashboard()
    const d = res.data || res || {}
    overview.pendingReview = d.applicationStats?.pendingCount || 0
    overview.students = d.studentCount || 0
    overview.teachers = d.teacherCount || 0
    overview.applications = d.applicationStats?.totalCount || 0
  } catch (err) {
    console.error('加载工作概览失败', err)
  } finally {
    loading.value = false
  }
}

// 进场动效
function setupReveal() {
  nextTick(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 80)
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.1 })
    els.forEach((el) => obs.observe(el))
  })
}

onMounted(async () => {
  await loadOverview()
  setupReveal()
})
</script>

<style scoped>
.admin-profile { width: calc(100% - 100px) !important; margin: 0 auto; padding: 20px 0; }
.profile-card { width: 100%; display: flex; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.06); }

/* 左侧藏蓝面板 */
.left-panel { width: 340px; flex-shrink: 0; background: linear-gradient(160deg, #0f1f3d 0%, #1d3a6e 100%); color: #fff; padding: 36px 32px; }
.kicker { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 2px; color: #8fa3c8; margin-bottom: 24px; }
.kicker-bar { width: 24px; height: 2px; background: #c9a24e; display: inline-block; }
.avatar-circle { width: 72px; height: 72px; border-radius: 50%; background: #c9a24e; color: #0f1f3d; font-family: Georgia, serif; font-size: 30px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.name-serif { font-family: Georgia, 'Noto Serif SC', serif; font-size: 24px; margin: 0 0 10px; letter-spacing: 1px; }
.role-badge { display: inline-block; padding: 3px 14px; border: 1px solid rgba(201,162,78,.5); border-radius: 20px; font-size: 12px; color: #e6c989; margin-bottom: 24px; }

.perm-list { display: flex; flex-direction: column; gap: 10px; }
.perm-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #c3cee2; }
.perm-dot { width: 6px; height: 6px; border-radius: 50%; background: #c9a24e; flex-shrink: 0; }

/* 右侧信息 */
.right-info { flex: 1; padding: 36px 40px; }
.right-info .kicker { color: #98a2b3; margin-bottom: 8px; }
.info-title { font-family: Georgia, 'Noto Serif SC', serif; font-size: 20px; color: #1d3a6e; margin: 0 0 24px; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.field-label { font-size: 12px; color: #98a2b3; margin-bottom: 6px; }
.field-value { font-size: 15px; color: #1d3a6e; font-weight: 500; }
.field-value.num { font-variant-numeric: tabular-nums; }
.role-tag { display: inline-block; padding: 2px 12px; background: rgba(29,58,110,.08); border-radius: 4px; font-size: 13px; color: #1d3a6e; }
.status-ok { display: inline-flex; align-items: center; gap: 6px; color: #4f7d63; font-size: 14px; }
.ok-dot { width: 8px; height: 8px; border-radius: 50%; background: #4f7d63; }

.divider { height: 1px; background: #eef1f4; margin: 28px 0 20px; }
.form-actions { display: flex; justify-content: flex-end; }

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

/* 进场动效 */
.reveal { opacity: 0; transform: translateY(12px); transition: all 0.5s ease; }
.reveal.visible { opacity: 1; transform: none; }
</style>
