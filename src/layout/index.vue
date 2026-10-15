<template>
  <el-container class="layout-container">
    <!-- ============ 侧边栏 ============ -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <!-- Logo区 -->
      <div class="logo">
        <div class="logo-badge">助</div>
        <span v-if="!isCollapse" class="logo-text">助学金评定系统</span>
      </div>

      <!-- 菜单 -->
      <el-scrollbar class="menu-scroll">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :collapse-transition="false"
          router
          class="aside-menu"
        >
          <template v-for="group in menuGroups" :key="group.name">
            <!-- 分组标题（折叠时隐藏） -->
            <div v-if="!isCollapse" class="menu-group-title">{{ group.name }}</div>
            <el-menu-item
              v-for="item in group.items"
              :key="item.path"
              :index="item.path"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>

      <!-- 底部版本信息 -->
      <div v-if="!isCollapse" class="aside-foot">学生资助管理中心 · v1.0</div>
    </el-aside>

    <el-container>
      <!-- ============ 顶栏 ============ -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, idx) in breadcrumbItems"
              :key="idx"
              :to="item.path || undefined"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ avatarText }}
              </el-avatar>
              <span class="username">{{ userStore.username }}</span>
              <span class="role-tag">{{ roleText }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- ============ 内容区 ============ -->
      <el-main class="main">
        <div class="main-body">
          <router-view />
        </div>
        <div class="app-footer">学生资助管理中心 · v1.0 © 2026</div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Lock, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

// 当前菜单高亮
const activeMenu = computed(() => route.path)

// ============ 按角色定义分组菜单 ============
const menusConfig = {
  // 管理员
  0: [
    {
      name: '概览',
      items: [
        { path: '/admin/dashboard', title: '首页', icon: 'HomeFilled' }
      ]
    },
    {
      name: '基础数据',
      items: [
        { path: '/admin/student', title: '学生管理', icon: 'User' },
        { path: '/admin/teacher', title: '教师管理', icon: 'Avatar' },
        { path: '/admin/grant-type', title: '助学金类型', icon: 'Money' }
      ]
    },
    {
      name: '评定业务',
      items: [
        { path: '/admin/application', title: '申请管理', icon: 'Document' },
        { path: '/admin/score', title: '评分管理', icon: 'EditPen' },
        { path: '/admin/evaluation', title: 'AHP评定', icon: 'Trophy' },
        { path: '/admin/notice', title: '公示管理', icon: 'Bell' }
      ]
    },
    {
      name: '账户',
      items: [
        { path: '/admin/profile', title: '我的资料', icon: 'UserFilled' },
        { path: '/admin/password', title: '修改密码', icon: 'Lock' }
      ]
    }
  ],
  // 教师
  1: [
    {
      name: '工作台',
      items: [
        { path: '/teacher/dashboard', title: '首页', icon: 'HomeFilled' },
        { path: '/teacher/notice', title: '公示查看', icon: 'Bell' }
      ]
    },
    {
      name: '评定业务',
      items: [
        { path: '/teacher/application', title: '申请审核', icon: 'Document' },
        { path: '/teacher/score', title: '学生评分', icon: 'EditPen' },
        { path: '/teacher/students', title: '我的学生', icon: 'User' },
        { path: '/teacher/evaluation', title: '评定结果', icon: 'Trophy' }
      ]
    },
    {
      name: '个人中心',
      items: [
        { path: '/teacher/profile', title: '我的资料', icon: 'UserFilled' },
        { path: '/teacher/password', title: '修改密码', icon: 'Lock' }
      ]
    }
  ],
  // 学生
  2: [
    {
      name: '工作台',
      items: [
        { path: '/student/dashboard', title: '首页', icon: 'HomeFilled' },
        { path: '/student/policy', title: '政策须知', icon: 'Reading' },
        { path: '/student/faq', title: '帮助中心', icon: 'QuestionFilled' }
      ]
    },
    {
      name: '资助业务',
      items: [
        { path: '/student/apply', title: '申请资助', icon: 'Money' },
        { path: '/student/application', title: '我的申请', icon: 'Document' },
        { path: '/student/notice', title: '公示查看', icon: 'Bell' }
      ]
    },
    {
      name: '个人中心',
      items: [
        { path: '/student/profile', title: '我的资料', icon: 'Postcard' },
        { path: '/student/password', title: '修改密码', icon: 'Lock' }
      ]
    }
  ]
}

const menuGroups = computed(() => menusConfig[userStore.role] || [])

// 面包屑：自动从菜单配置推导完整层级路径
const breadcrumbItems = computed(() => {
  const role = userStore.role
  const groups = menusConfig[role] || []
  const currentPath = route.path

  for (const group of groups) {
    const found = group.items.find(item => item.path === currentPath)
    if (found) {
      const items = []
      const firstItem = groups[0].items[0]
      if (firstItem.path !== currentPath) {
        items.push({ title: firstItem.title, path: firstItem.path })
        if (group.name !== groups[0].name) {
          items.push({ title: group.name })
        }
      }
      items.push({ title: found.title })
      return items
    }
  }
  return [{ title: route.meta.title || '首页' }]
})

// 角色标签
const roleText = computed(() => {
  const role = userStore.role
  if (role === 0) return '管理员'
  if (role === 1) return '教师'
  if (role === 2) return '学生'
  return ''
})

// 头像文字（取用户名第一个字）
const avatarText = computed(() => {
  const name = userStore.username || ''
  return name.charAt(0).toUpperCase()
})

// 下拉菜单
function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('退出成功')
      router.push('/login')
    })
  } else if (command === 'password') {
    const role = userStore.role
    const prefix = role === 0 ? '/admin' : role === 1 ? '/teacher' : '/student'
    router.push(prefix + '/password')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

/* ============ 侧边栏：权威藏蓝配色 ============ */
.aside {
  background: #0f1f3d;
  transition: width 0.28s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Logo区 */
.logo {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.logo-badge {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: linear-gradient(135deg, #c9a24e, #a1792f);
  color: #ffffff;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(201, 162, 78, 0.35);
}
.logo-text {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #eef2f9;
  white-space: nowrap;
}

/* 菜单滚动区 */
.menu-scroll {
  flex: 1;
}

/* 分组标题 */
.menu-group-title {
  padding: 18px 20px 6px;
  font-size: 11px;
  letter-spacing: 3px;
  color: rgba(201, 162, 78, 0.55);
  user-select: none;
}
.menu-group-title:first-child {
  padding-top: 14px;
}

/* 覆盖 el-menu 深色主题 */
.aside-menu {
  border-right: none;
  background: transparent;
  padding: 0 10px 10px;
}
.aside-menu :deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin: 2px 0;
  border-radius: 8px;
  color: rgba(238, 242, 249, 0.62);
  font-size: 14px;
}
.aside-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.06);
  color: #eef2f9;
}
.aside-menu :deep(.el-menu-item.is-active) {
  background: rgba(201, 162, 78, 0.16);
  color: #e4c47e;
  font-weight: 500;
}
/* 选中项左侧金色条 */
.aside-menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 0 3px 3px 0;
  background: #c9a24e;
}
.aside-menu :deep(.el-menu-item .el-icon) {
  font-size: 17px;
  color: inherit;
}
/* 折叠态去掉圆角边距感 */
.aside-menu :deep(.el-menu--collapse .el-menu-item) {
  margin: 4px auto;
  width: 44px;
}

/* 底部版本 */
.aside-foot {
  flex-shrink: 0;
  padding: 14px;
  text-align: center;
  font-size: 11px;
  letter-spacing: 1px;
  color: rgba(238, 242, 249, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* ============ 顶栏 ============ */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #e2e7ef;
  box-shadow: 0 1px 4px rgba(15, 31, 61, 0.05);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  font-size: 19px;
  cursor: pointer;
  color: #1d3a6e;
  transition: color 0.2s;
}
.collapse-btn:hover {
  color: #a1792f;
}

.header-right {
  display: flex;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  outline: none;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-info:hover {
  background: rgba(29, 58, 110, 0.06);
}
.user-avatar {
  background: #1d3a6e;
  color: #e8c878;
  font-size: 14px;
  font-weight: 600;
}
.username {
  font-size: 14px;
  color: #1b2433;
}
.role-tag {
  font-size: 12px;
  color: #8a6830;
  background: #f6f1e2;
  padding: 2px 9px;
  border-radius: 20px;
}
.arrow-icon {
  font-size: 12px;
  color: #98a3b5;
}

/* ============ 内容区 ============ */
.main {
  background: #f4f6f9;
  padding: 20px 20px 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
/* 内容主体撑满，页脚贴底 */
.main-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
/* 列表页：页面根 div 撑满 → el-card 撑满 → card body 撑满（排除 dashboard 首页和所有 page-enter 列表页） */
.main-body :deep(> div:not(.dashboard):not(.page-enter)) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.main-body :deep(> div:not(.dashboard):not(.page-enter) > .el-card) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.main-body :deep(> div:not(.dashboard):not(.page-enter) > .el-card > .el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
/* 所有列表页统一宽度限制：两侧各留 50px */
.main-body :deep(> .page-enter) {
  flex: none !important;
  display: block !important;
  align-self: center !important;
  width: calc(100% - 100px);
  margin: 0 auto;
}
/* 页脚 */
.app-footer {
  flex-shrink: 0;
  text-align: center;
  padding: 10px 20px;
  font-size: 12px;
  letter-spacing: 1px;
  color: #8a94a8;
  border-top: 1px solid #e2e7ef;
  margin: 0 -20px;
}
</style>
