import request from '@/utils/request'

// 学生端申请
export function submitApplication(data) {
  return request({ url: '/student/application', method: 'post', data })
}

export function getMyApplications(params) {
  return request({ url: '/student/application/my-list', method: 'get', params })
}

export function getApplicationDetail(id) {
  return request({ url: `/student/application/${id}`, method: 'get' })
}

// 学生端助学金类型列表
export function getGrantTypeList() {
  return request({ url: '/student/grant-type/list', method: 'get' })
}

// 学生端可申请助学金列表（带等级金额）
export function getAvailableGrantTypes(params) {
  return request({ url: '/student/grant-type/available', method: 'get', params })
}

// 学生端公示
export function getNoticePage(params) {
  return request({ url: '/student/notice/list', method: 'get', params })
}

export function getNoticeDetail(id) {
  return request({ url: `/student/notice/${id}`, method: 'get' })
}

// 学生端个人资料
export function getStudentProfile() {
  return request({ url: '/student/profile', method: 'get' })
}

// 学生端密码修改
export function changePassword(data) {
  return request({ url: '/user/password', method: 'put', data })
}

// 文件上传
export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({ url: '/file/upload', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
}
