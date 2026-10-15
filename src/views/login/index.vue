<template>
  <div class="login-page">
    <!-- ============ 左侧品牌叙事区 ============ -->
    <aside class="brand">
      <div class="ring ring-2"></div>

      <!-- AHP 层次结构示意（纯装饰，仅宽屏展示） -->
      <svg class="ahp-figure" viewBox="0 0 236 218" fill="none" aria-hidden="true">
        <!-- 目标层 -->
        <rect x="88" y="4" width="60" height="34" rx="4" class="af-node af-goal" />
        <text x="118" y="26" text-anchor="middle" class="af-t af-t-goal">目标层</text>
        <!-- 连接线：目标层 → 准则层 -->
        <path d="M118 38 V54 M24 54 H210 M24 54 V68 M86 54 V68 M148 54 V68 M210 54 V68" class="af-line" />
        <!-- 准则层：四个评价维度 -->
        <rect x="0" y="68" width="48" height="46" rx="4" class="af-node" />
        <text x="24" text-anchor="middle" class="af-t"><tspan x="24" y="88">经济</tspan><tspan x="24" y="105">状况</tspan></text>
        <rect x="62" y="68" width="48" height="46" rx="4" class="af-node" />
        <text x="86" text-anchor="middle" class="af-t"><tspan x="86" y="88">家庭</tspan><tspan x="86" y="105">负担</tspan></text>
        <rect x="124" y="68" width="48" height="46" rx="4" class="af-node" />
        <text x="148" text-anchor="middle" class="af-t"><tspan x="148" y="88">特殊</tspan><tspan x="148" y="105">困难</tspan></text>
        <rect x="186" y="68" width="48" height="46" rx="4" class="af-node" />
        <text x="210" text-anchor="middle" class="af-t"><tspan x="210" y="88">突发</tspan><tspan x="210" y="105">变故</tspan></text>
        <!-- 连接线：准则层 → 方案层 -->
        <path d="M24 114 V130 M86 114 V130 M148 114 V130 M210 114 V130 M24 130 H210 M34 130 V134 M118 130 V134 M202 130 V134" class="af-line" />
        <!-- 方案层：三个资助等级 -->
        <rect x="4" y="134" width="60" height="40" rx="4" class="af-node" />
        <text x="34" y="159" text-anchor="middle" class="af-t">一等资助</text>
        <rect x="88" y="134" width="60" height="40" rx="4" class="af-node" />
        <text x="118" y="159" text-anchor="middle" class="af-t">二等资助</text>
        <rect x="172" y="134" width="60" height="40" rx="4" class="af-node" />
        <text x="202" y="159" text-anchor="middle" class="af-t">三等资助</text>
        <!-- 图题 -->
        <text x="118" y="198" text-anchor="middle" class="af-cap">AHP 层次结构模型</text>
      </svg>

      <div class="brand-top">
        <svg class="emblem" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#b8924a" stroke-width="1.5" />
          <path d="M24 12 L34 17 V26 C34 32 29.5 35.5 24 37 C18.5 35.5 14 32 14 26 V17 Z" stroke="#d4b876" stroke-width="1.5" fill="none" />
          <path d="M19 24 L22.5 27.5 L30 20" stroke="#d4b876" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="org">
          学生资助管理中心
          <span>STUDENT FINANCIAL AID CENTER</span>
        </div>
      </div>

      <div class="brand-main">
        <div class="brand-kicker">家庭经济困难学生资助</div>
        <h1 class="brand-title">
          助学金<br />层次分析法<em>评定系统</em>
        </h1>
        <p class="brand-desc">
          以层次分析法（AHP）构建科学量化的评定模型，
          统筹经济状况、家庭负担、特殊困难与突发变故四个维度，
          让每一份资助都有据可依、公平可溯。
        </p>
      </div>

      <ul class="brand-steps">
        <li><b>01</b> 学生申请</li>
        <li><b>02</b> 教师审核评分</li>
        <li><b>03</b> AHP综合评定</li>
        <li><b>04</b> 结果公示</li>
      </ul>
    </aside>

    <!-- ============ 右侧登录表单区 ============ -->
    <main class="panel">
      <div class="login-box">
        <div class="login-head">
          <h2>欢迎登录</h2>
          <p>请选择身份并输入账号信息</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent
        >
          <!-- 角色分段切换 -->
          <div class="role-switch" role="group" aria-label="选择登录身份">
            <button
              v-for="item in roles"
              :key="item.value"
              type="button"
              :class="{ active: loginForm.role === item.value }"
              :aria-pressed="loginForm.role === item.value"
              @click="loginForm.role = item.value"
            >
              {{ item.label }}
            </button>
          </div>

          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :placeholder="usernamePlaceholder"
              :aria-label="usernamePlaceholder"
              size="large"
              class="login-input"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke-linecap="round" />
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              aria-label="密码"
              size="large"
              class="login-input"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke-linecap="round" />
                </svg>
              </template>
            </el-input>
          </el-form-item>

          <el-button
            class="btn-login"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form>

        <div class="login-foot">
          如遇登录问题，请联系学生资助管理中心<br />
          技术支持：信息化建设与管理处
        </div>
      </div>
    </main>

    <!-- ============ 底部版权信息条 ============ -->
    <footer class="login-copy">
      © 2026 学生资助管理中心 · 高校助学金层次分析法评定系统 V1.0 · 建议使用 Chrome / Edge 浏览器
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref()
const loading = ref(false)

// 角色选项（placeholder 随身份联动）
const roles = [
  { value: 0, label: '管理员', placeholder: '请输入管理员用户名' },
  { value: 1, label: '教师', placeholder: '请输入教师工号' },
  { value: 2, label: '学生', placeholder: '请输入学号' }
]

const loginForm = reactive({
  username: '',
  password: '',
  role: 0
})

// 当前身份对应的账号输入提示
const usernamePlaceholder = computed(
  () => roles.find(r => r.value === loginForm.role)?.placeholder ?? '请输入账号'
)

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function handleLogin() {
  loginFormRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      const res = await userStore.login(loginForm)
      ElMessage.success('登录成功')
      // 根据角色跳转
      if (res.role === 0) router.push('/admin/dashboard')
      else if (res.role === 1) router.push('/teacher/dashboard')
      else if (res.role === 2) router.push('/student/dashboard')
    } catch (err) {
      // 错误已在拦截器处理
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
/* ============================================================
   设计方向：学术瑞士风 Academic Swiss
   权威藏蓝 × 成就金 × 冷白，正交网格 / 细分割线 / 强排版层级
   ============================================================ */
.login-page {
  /* 色板令牌 */
  --navy: #1d3a6e;          /* 主色：学术藏蓝 */
  --navy-deep: #14294d;     /* 深色按压态 */
  --navy-ink: #0f1f3d;      /* 品牌区底色 */
  --gold: #c9a24e;          /* 成就金（深底用） */
  --gold-deep: #a1792f;     /* 成就金（浅底用） */
  --bg: #f4f6f9;            /* 冷白页面底 */
  --card: #ffffff;          /* 卡片白 */
  --ink: #1b2433;           /* 正文墨色 */
  --muted: #5d6b80;         /* 次要文字 */
  --faint: #8a96a8;         /* 弱化文字 */
  --line: #e2e7ef;          /* 浅分割线 */
  --track: #edf0f5;         /* 分段控件轨道 */
  --serif: 'Noto Serif SC', 'Songti SC', 'SimSun', Georgia, serif;
  --sans: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  display: grid;
  grid-template-columns: 1.08fr 1fr;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
  font-family: var(--sans);
  color: var(--ink);
  background: var(--bg);
}

/* ============ 左侧品牌叙事区 ============ */
.brand {
  position: relative;
  background: var(--navy-ink);
  color: #eef2f9;
  padding: 60px 68px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

/* 瑞士正交细网格 */
.brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none;
}

/* 同心圆装饰 → 瑞士正交方框线（同一节点，仅换形态） */
.brand::after,
.ring-2 {
  content: '';
  position: absolute;
  border-radius: 0;
  pointer-events: none;
}
.brand::after {
  width: 460px;
  height: 460px;
  right: -190px;
  top: -190px;
  border: 1px solid rgba(201, 162, 78, 0.35);
}
.ring-2 {
  width: 300px;
  height: 300px;
  right: -110px;
  top: -110px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* AHP 层次结构示意图：默认隐藏，仅宽屏展示 */
.ahp-figure {
  display: none;
  position: absolute;
  right: 44px;
  top: 50%;
  width: 184px;
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: none;
}
.ahp-figure text {
  font-family: var(--sans);
}
.af-node {
  fill: rgba(201, 162, 78, 0.1);
  stroke: rgba(201, 162, 78, 0.55);
  stroke-width: 1;
}
.af-goal {
  fill: rgba(201, 162, 78, 0.2);
}
.af-line {
  stroke: rgba(201, 162, 78, 0.4);
  stroke-width: 1;
}
.af-t {
  fill: rgba(238, 242, 249, 0.82);
  font-size: 11px;
}
.af-t-goal {
  fill: #e8c878;
  font-size: 12px;
}
.af-cap {
  fill: rgba(201, 162, 78, 0.85);
  font-size: 10px;
  letter-spacing: 2px;
}
@media (min-width: 1500px) {
  .ahp-figure {
    display: block;
    animation: af-fade 0.9s 0.35s ease both;
  }
}

.brand-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 26px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  animation: rise-in 0.5s ease both;
}
.emblem {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}
/* 模板内 SVG 为内联描边色，用 CSS 覆盖为藏蓝底配色 */
.emblem circle { stroke: var(--gold); }
.emblem path { stroke: var(--gold); }
.org {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 2px;
}
.org span {
  display: block;
  font-family: var(--sans);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 2.5px;
  color: rgba(238, 242, 249, 0.5);
  margin-top: 4px;
}

.brand-main {
  position: relative;
  z-index: 1;
  max-width: 470px;
  animation: rise-in 0.55s 0.08s ease both;
}
.brand-kicker {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  letter-spacing: 5px;
  color: var(--gold);
  margin-bottom: 26px;
  text-transform: uppercase;
}
.brand-kicker::before {
  content: '';
  width: 28px;
  height: 2px;
  background: var(--gold);
}
.brand-title {
  font-family: var(--serif);
  font-size: 50px;
  font-weight: 900;
  line-height: 1.22;
  letter-spacing: 2px;
  margin: 0 0 26px;
}
.brand-title em {
  font-style: normal;
  color: var(--gold);
}
.brand-desc {
  font-size: 14.5px;
  line-height: 2;
  color: rgba(238, 242, 249, 0.68);
  font-weight: 300;
  max-width: 430px;
  margin: 0;
}

/* 流程步骤：横排 → 瑞士纵排索引表 */
.brand-steps {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  animation: rise-in 0.55s 0.16s ease both;
}
.brand-steps li {
  font-size: 13.5px;
  letter-spacing: 1px;
  color: rgba(238, 242, 249, 0.72);
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.brand-steps li b {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  color: var(--gold);
  letter-spacing: 1px;
  min-width: 22px;
}

/* ============ 右侧登录表单区 ============ */
.panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
}
.login-box {
  width: 100%;
  max-width: 400px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 44px 40px 36px;
  box-shadow: 0 18px 50px -24px rgba(15, 31, 61, 0.25);
  animation: rise-in 0.55s 0.1s ease both;
}

.login-head {
  margin-bottom: 30px;
}
.login-head h2 {
  font-family: var(--sans);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--navy-ink);
  margin: 0 0 8px;
}
.login-head p {
  font-size: 13.5px;
  color: var(--muted);
  margin: 0;
}

/* 角色分段控件 */
.role-switch {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--track);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 22px;
}
.role-switch button {
  border: none;
  background: transparent;
  padding: 9px 0;
  font-family: var(--sans);
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  letter-spacing: 1px;
}
.role-switch button:hover {
  color: var(--navy);
}
.role-switch button.active {
  background: var(--navy);
  color: #fff;
  font-weight: 500;
  box-shadow: 0 4px 12px -4px rgba(29, 58, 110, 0.5);
}

/* 输入框：覆盖 Element Plus */
.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}
.login-form :deep(.el-input__wrapper) {
  background: var(--card);
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--line) inset;
  padding: 5px 14px;
  transition: box-shadow 0.2s ease;
}
.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c4cedd inset;
}
.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--navy) inset, 0 0 0 3px rgba(29, 58, 110, 0.12) !important;
}
.login-form :deep(.el-input__inner) {
  font-size: 14px;
  color: var(--ink);
  height: 40px;
}
.login-form :deep(.el-input__inner::placeholder) {
  color: #a5afc0;
}
.field-icon {
  width: 17px;
  height: 17px;
  color: #98a3b5;
  transition: color 0.2s ease;
}
.login-form :deep(.el-input__wrapper.is-focus) .field-icon {
  color: var(--navy);
}
.login-form :deep(.el-input__password) {
  color: #98a3b5;
}
.login-form :deep(.el-input__password:hover) {
  color: var(--navy);
}
/* 校验错误文案 */
.login-form :deep(.el-form-item__error) {
  color: #d14343;
  font-size: 12px;
  padding-top: 3px;
}

/* 登录按钮：用 Element Plus 主题变量 + !important 覆盖 main.css 的高优先级默认按钮规则 */
.login-form .btn-login.el-button,
.login-form .btn-login.el-button:hover,
.login-form .btn-login.el-button:focus,
.login-form .btn-login.el-button:active {
  width: 100%;
  height: 48px;
  margin-top: 6px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 6px;
  text-indent: 6px;
  border-radius: 8px;
  outline: none;
  background: var(--navy) !important;
  border-color: var(--navy) !important;
  color: #fff !important;
  --el-button-bg-color: var(--navy);
  --el-button-border-color: var(--navy);
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: var(--navy-deep);
  --el-button-hover-border-color: var(--navy-deep);
  --el-button-hover-text-color: #fff;
  --el-button-active-bg-color: var(--navy-ink);
  --el-button-active-border-color: var(--navy-ink);
  transition: box-shadow 0.2s ease, transform 0.15s ease, background 0.2s ease;
}
.login-form .btn-login.el-button:hover,
.login-form .btn-login.el-button:focus-visible {
  background: var(--navy-deep) !important;
  border-color: var(--navy-deep) !important;
  box-shadow: 0 10px 22px -10px rgba(29, 58, 110, 0.65);
  transform: translateY(-1px);
}
.login-form .btn-login.el-button:active {
  background: var(--navy-ink) !important;
  border-color: var(--navy-ink) !important;
  transform: translateY(0);
}

.login-foot {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--faint);
  text-align: center;
  line-height: 1.9;
}

/* ============ 底部版权信息条 ============ */
.login-copy {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 13px 16px;
  background: #eef1f6;
  border-top: 1px solid #e3e8f0;
  font-size: 11.5px;
  letter-spacing: 0.5px;
  color: #93a0b4;
  text-align: center;
  animation: rise-in 0.55s 0.24s ease both;
}

/* ============ 入场动效 ============ */
@keyframes rise-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes af-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* 尊重系统"减少动态效果"设置 */
@media (prefers-reduced-motion: reduce) {
  .brand-top,
  .brand-main,
  .brand-steps,
  .login-box,
  .login-copy,
  .ahp-figure {
    animation: none;
  }
}

/* ============ 响应式（≤900px 单栏：品牌区压缩为头部色带） ============ */
@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  .brand {
    padding: 36px 28px 56px;
    gap: 0;
  }
  .brand-top {
    padding-bottom: 20px;
  }
  .brand-main {
    padding-top: 28px;
  }
  .brand-title {
    font-size: 34px;
    margin-bottom: 0;
  }
  .brand-desc,
  .brand-steps {
    display: none;
  }
  /* 白色卡片上浮叠住色带下沿，形成编辑式层次 */
  .panel {
    padding: 0 20px 40px;
    margin-top: -32px;
    position: relative;
    z-index: 2;
    align-items: flex-start;
  }
  .login-box {
    padding: 36px 28px 30px;
  }
}
</style>
