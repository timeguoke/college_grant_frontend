import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

// 布局组件
const Layout = () => import('@/layout/index.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  // 管理员路由
  {
    path: '/admin',
    component: Layout,
    redirect: '/admin/dashboard',
    meta: { role: 0 },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'student',
        name: 'AdminStudent',
        component: () => import('@/views/admin/student/index.vue'),
        meta: { title: '学生管理', icon: 'User' }
      },
      {
        path: 'teacher',
        name: 'AdminTeacher',
        component: () => import('@/views/admin/teacher/index.vue'),
        meta: { title: '教师管理', icon: 'Avatar' }
      },
      {
        path: 'grant-type',
        name: 'AdminGrantType',
        component: () => import('@/views/admin/grant-type/index.vue'),
        meta: { title: '助学金类型', icon: 'Money' }
      },
      {
        path: 'application',
        name: 'AdminApplication',
        component: () => import('@/views/admin/application/index.vue'),
        meta: { title: '申请管理', icon: 'Document' }
      },
      {
        path: 'score',
        name: 'AdminScore',
        component: () => import('@/views/admin/score/index.vue'),
        meta: { title: '评分管理', icon: 'EditPen' }
      },
      {
        path: 'evaluation',
        name: 'AdminEvaluation',
        component: () => import('@/views/admin/evaluation/index.vue'),
        meta: { title: 'AHP评定', icon: 'Trophy' }
      },
      {
        path: 'notice',
        name: 'AdminNotice',
        component: () => import('@/views/admin/notice/index.vue'),
        meta: { title: '公示管理', icon: 'Bell' }
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('@/views/admin/profile/index.vue'),
        meta: { title: '我的资料', icon: 'UserFilled' }
      },
      {
        path: 'password',
        name: 'AdminPassword',
        component: () => import('@/views/common/password/index.vue'),
        meta: { title: '修改密码', icon: 'Lock' }
      }
    ]
  },
  // 教师路由
  {
    path: '/teacher',
    component: Layout,
    redirect: '/teacher/dashboard',
    meta: { role: 1 },
    children: [
      {
        path: 'dashboard',
        name: 'TeacherDashboard',
        component: () => import('@/views/teacher/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'application',
        name: 'TeacherApplication',
        component: () => import('@/views/teacher/application/index.vue'),
        meta: { title: '申请审核', icon: 'Document' }
      },
      {
        path: 'score',
        name: 'TeacherScore',
        component: () => import('@/views/teacher/score/index.vue'),
        meta: { title: '学生评分', icon: 'EditPen' }
      },
      {
        path: 'students',
        name: 'TeacherStudents',
        component: () => import('@/views/teacher/students/index.vue'),
        meta: { title: '我的学生', icon: 'User' }
      },
      {
        path: 'evaluation',
        name: 'TeacherEvaluation',
        component: () => import('@/views/teacher/evaluation/index.vue'),
        meta: { title: '评定结果', icon: 'Trophy' }
      },
      {
        path: 'notice',
        name: 'TeacherNotice',
        component: () => import('@/views/teacher/notice/index.vue'),
        meta: { title: '公示查看', icon: 'Bell' }
      },
      {
        path: 'profile',
        name: 'TeacherProfile',
        component: () => import('@/views/teacher/profile/index.vue'),
        meta: { title: '我的资料', icon: 'UserFilled' }
      },
      {
        path: 'password',
        name: 'TeacherPassword',
        component: () => import('@/views/common/password/index.vue'),
        meta: { title: '修改密码', icon: 'Lock' }
      }
    ]
  },
  // 学生路由
  {
    path: '/student',
    component: Layout,
    redirect: '/student/dashboard',
    meta: { role: 2 },
    children: [
      {
        path: 'dashboard',
        name: 'StudentDashboard',
        component: () => import('@/views/student/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'apply',
        name: 'StudentApply',
        component: () => import('@/views/student/apply/index.vue'),
        meta: { title: '申请资助', icon: 'Money' }
      },
      {
        path: 'application',
        name: 'StudentApplication',
        component: () => import('@/views/student/application/index.vue'),
        meta: { title: '我的申请', icon: 'Document' }
      },
      {
        path: 'notice',
        name: 'StudentNotice',
        component: () => import('@/views/student/notice/index.vue'),
        meta: { title: '公示查看', icon: 'Bell' }
      },
      {
        path: 'policy',
        name: 'StudentPolicy',
        component: () => import('@/views/student/policy/index.vue'),
        meta: { title: '政策须知', icon: 'Reading' }
      },
      {
        path: 'faq',
        name: 'StudentFaq',
        component: () => import('@/views/student/faq/index.vue'),
        meta: { title: '帮助中心', icon: 'QuestionFilled' }
      },
      {
        path: 'profile',
        name: 'StudentProfile',
        component: () => import('@/views/student/profile/index.vue'),
        meta: { title: '我的资料', icon: 'Postcard' }
      },
      {
        path: 'password',
        name: 'StudentPassword',
        component: () => import('@/views/common/password/index.vue'),
        meta: { title: '修改密码', icon: 'Lock' }
      }
    ]
  },
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.path === '/login') {
    if (token) {
      // 已登录，根据角色跳转
      const role = userStore.role
      if (role === 0) next('/admin/dashboard')
      else if (role === 1) next('/teacher/dashboard')
      else if (role === 2) next('/student/dashboard')
      else next()
    } else {
      next()
    }
  } else {
    if (!token) {
      next('/login')
    } else {
      // 校验角色权限
      const role = userStore.role
      const pathRole = to.matched[0]?.meta?.role
      if (pathRole !== undefined && pathRole !== role) {
        // 角色不匹配，跳转到自己的首页
        if (role === 0) next('/admin/dashboard')
        else if (role === 1) next('/teacher/dashboard')
        else if (role === 2) next('/student/dashboard')
        else next('/login')
      } else {
        next()
      }
    }
  }
})

export default router
