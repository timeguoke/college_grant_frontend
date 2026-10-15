<template>
  <div class="not-found">
    <div class="nf-card">
      <div class="nf-ring"></div>
      <div class="nf-code">404</div>
      <div class="nf-kicker">页面走丢了</div>
      <p class="nf-desc">您访问的页面不存在或已被移除，请返回首页继续操作</p>
      <el-button type="primary" size="large" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

function goHome() {
  const role = userStore.role
  if (role === 0) router.push('/admin/dashboard')
  else if (role === 1) router.push('/teacher/application')
  else if (role === 2) router.push('/student/application')
  else router.push('/login')
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6f9;
  padding: 24px;
}
.nf-card {
  position: relative;
  width: 440px;
  max-width: 100%;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 16px;
  box-shadow: 0 12px 36px rgba(15, 31, 61, 0.08);
  padding: 56px 40px 48px;
  text-align: center;
  overflow: hidden;
}
.nf-ring {
  position: absolute;
  width: 220px;
  height: 220px;
  right: -90px;
  top: -90px;
  border-radius: 50%;
  border: 1px solid rgba(201, 162, 78, 0.3);
  pointer-events: none;
}
.nf-code {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 84px;
  font-weight: 900;
  line-height: 1;
  color: #1d3a6e;
  letter-spacing: 2px;
}
.nf-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0 12px;
  font-size: 13px;
  letter-spacing: 4px;
  color: #a1792f;
}
.nf-kicker::before,
.nf-kicker::after {
  content: '';
  width: 24px;
  height: 1px;
  background: #c9a24e;
}
.nf-desc {
  font-size: 14px;
  color: #5d6b80;
  line-height: 1.9;
  margin: 0 0 30px;
}
</style>
