<template>
  <div class="page-enter pw-page">
    <div class="pw-card">
      <!-- 左：藏蓝面板 -->
      <div class="pw-left">
        <div class="lock-badge">
          <el-icon :size="32"><Lock /></el-icon>
        </div>
        <h3 class="pw-left-title">账户安全</h3>
        <p class="pw-left-desc">定期更换密码是保护账户安全的第一道防线</p>
        <div class="pw-rules">
          <h4>密码规则</h4>
          <ul>
            <li>长度至少 6 位</li>
            <li>建议包含字母与数字组合</li>
            <li>避免使用学号、生日等易猜信息</li>
            <li>不可与旧密码相同</li>
          </ul>
        </div>
        <div class="pw-strength-legend">
          <h4>强度说明</h4>
          <div class="legend-row"><span class="dot weak"></span>弱 · 纯字母或纯数字</div>
          <div class="legend-row"><span class="dot medium"></span>中 · 字母+数字 6位以上</div>
          <div class="legend-row"><span class="dot strong"></span>强 · 字母+数字+符号 8位以上</div>
        </div>
      </div>

      <!-- 右：表单 -->
      <div class="pw-right">
        <h3 class="pw-right-title">修改密码</h3>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="90px"
          class="pw-form"
        >
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入旧密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码" @input="updateStrength" />
            <div class="strength-bar">
              <div class="strength-track">
                <div class="strength-fill" :class="strengthLevel" :style="{ width: strengthPercent }"></div>
              </div>
              <span class="strength-label" :class="strengthLevel">{{ strengthText }}</span>
            </div>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSubmit">确认修改</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { changePassword } from '@/api/student'

const formRef = ref()
const loading = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.newPassword) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

/* ============ 密码强度 ============ */
const strengthLevel = ref('')
const strengthPercent = ref('0%')
const strengthText = ref('')

function updateStrength() {
  const pwd = form.newPassword
  if (!pwd) {
    strengthLevel.value = ''
    strengthPercent.value = '0%'
    strengthText.value = ''
    return
  }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 8) score++
  if (/[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  if (pwd.length < 6) score = 0

  if (score <= 1) {
    strengthLevel.value = 'weak'
    strengthPercent.value = '33%'
    strengthText.value = '弱'
  } else if (score <= 2) {
    strengthLevel.value = 'medium'
    strengthPercent.value = '66%'
    strengthText.value = '中'
  } else {
    strengthLevel.value = 'strong'
    strengthPercent.value = '100%'
    strengthText.value = '强'
  }
}

function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
      ElMessage.success('修改成功，请重新登录')
      setTimeout(() => location.reload(), 1500)
    } catch (err) {
      // 已处理
    } finally {
      loading.value = false
    }
  })
}

function handleReset() {
  formRef.value.resetFields()
  updateStrength()
}
</script>

<style scoped>
/* ============ 页面容器：居中分屏卡 ============ */
.pw-page {
  display: flex !important;
  flex-direction: row !important;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 0;
}

/* ============ 分屏卡片 ============ */
.pw-card {
  width: 860px;
  margin: 0 auto;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* ============ 左侧藏蓝面板 ============ */
.pw-left {
  flex: 0 0 340px;
  background: #1d3a6e;
  color: #fff;
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
}
.lock-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.lock-badge .el-icon {
  color: #c9a24e;
}
.pw-left-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #fff;
}
.pw-left-desc {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 28px;
}
.pw-rules h4,
.pw-strength-legend h4 {
  font-size: 13px;
  font-weight: 600;
  color: #c9a24e;
  margin: 0 0 10px;
}
.pw-rules ul {
  list-style: none;
  margin: 0 0 28px;
  padding: 0;
}
.pw-rules li {
  position: relative;
  padding-left: 14px;
  font-size: 12px;
  line-height: 2;
  color: rgba(255, 255, 255, 0.8);
}
.pw-rules li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #c9a24e;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 2;
  color: rgba(255, 255, 255, 0.8);
}
.legend-row .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot.weak { background: #e0625f; }
.dot.medium { background: #e0a24e; }
.dot.strong { background: #4caf7a; }

/* ============ 右侧表单区 ============ */
.pw-right {
  flex: 1;
  background: #fff;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.pw-right-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d3a6e;
  margin: 0 0 28px;
  padding-left: 10px;
  border-left: 3px solid #c9a24e;
}
.pw-form {
  max-width: 360px;
}
.pw-form :deep(.el-form-item) {
  margin-bottom: 32px;
}
.pw-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

/* ============ 密码强度条 ============ */
.strength-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  width: 100%;
}
.strength-track {
  flex: 1;
  height: 6px;
  background: #e3e8ef;
  border-radius: 3px;
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background 0.3s ease;
}
.strength-fill.weak { background: #e0625f; }
.strength-fill.medium { background: #e0a24e; }
.strength-fill.strong { background: #4caf7a; }
.strength-label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 16px;
  text-align: right;
}
.strength-label.weak { color: #e0625f; }
.strength-label.medium { color: #e0a24e; }
.strength-label.strong { color: #4caf7a; }
</style>
