import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import router from '@/router'

const service = axios.create({
  // 默认走 Vite 代理（/api -> 后端），可通过环境变量覆盖后端地址
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求拦截器：自动带token
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = userStore.token
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：统一处理返回
service.interceptors.response.use(
  response => {
    // 文件流（blob）响应直接返回，交给调用方处理下载
    if (response.config.responseType === 'blob') {
      return response
    }
    const res = response.data
    if (res.code === 200) {
      return res
    } else {
      ElMessage.error(res.msg || '操作失败')
      return Promise.reject(new Error(res.msg || 'Error'))
    }
  },
  error => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      } else if (status === 403) {
        ElMessage.error('无权限访问')
      } else {
        // 后端异常可能返回对象（Result），避免直接展示成 [object Object]
        const data = error.response.data
        const msg = (data && typeof data === 'object' ? (data.msg || data.message) : data) || `请求失败（${status}）`
        ElMessage.error(msg)
      }
    } else {
      ElMessage.error('网络异常')
    }
    return Promise.reject(error)
  }
)

export default service
