import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi } from '@/api/login'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userId = ref(Number(localStorage.getItem('userId')) || 0)
  const username = ref(localStorage.getItem('username') || '')
  const role = ref(Number(localStorage.getItem('role')) || 0)

  function login(loginForm) {
    return new Promise((resolve, reject) => {
      loginApi(loginForm)
        .then(res => {
          // 后端返回 {code, msg, data: {token, username, role, userId, name}}
          const data = res.data || res
          token.value = data.token
          userId.value = data.userId
          username.value = data.name || data.username
          role.value = data.role

          localStorage.setItem('token', data.token)
          localStorage.setItem('userId', data.userId)
          localStorage.setItem('username', data.name || data.username)
          localStorage.setItem('role', data.role)
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  function logout() {
    token.value = ''
    userId.value = 0
    username.value = ''
    role.value = 0
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
  }

  return { token, userId, username, role, login, logout }
})
