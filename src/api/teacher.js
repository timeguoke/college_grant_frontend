import request from '@/utils/request'

// 教师端申请审核
export function getPendingApplications(params) {
  return request({ url: '/teacher/application/list', method: 'get', params })
}

export function getApplicationDetail(id) {
  return request({ url: `/teacher/application/${id}`, method: 'get' })
}

export function reviewApplication(id, data) {
  const action = data.status === 1 ? 'pass' : 'reject'
  return request({ url: `/teacher/application/${id}/${action}`, method: 'put', params: { reviewComment: data.reviewComment } })
}

// 教师端评分
export function getPendingScorePage(params) {
  return request({ url: '/teacher/score/pending', method: 'get', params })
}

export function submitScore(data) {
  return request({ url: '/teacher/score', method: 'post', data })
}

export function getScoreDetail(applicationId) {
  return request({ url: `/teacher/score/${applicationId}`, method: 'get' })
}

export function getMyScoreList(params) {
  return request({ url: '/teacher/score/my-list', method: 'get', params })
}

export function updateScore(id, data) {
  return request({ url: `/teacher/score/${id}`, method: 'put', data })
}

// 教师端助学金类型列表
export function getGrantTypeList() {
  return request({ url: '/teacher/grant-type/list', method: 'get' })
}

// 教师端公示查看
export function getNoticeList(params) {
  return request({ url: '/teacher/notice/list', method: 'get', params })
}

export function getNoticeDetail(id) {
  return request({ url: `/teacher/notice/${id}`, method: 'get' })
}

// 教师端评定结果
export function getEvaluationList(params) {
  return request({ url: '/teacher/evaluation/list', method: 'get', params })
}

export function getEvaluationDetail(id) {
  return request({ url: `/teacher/evaluation/${id}`, method: 'get' })
}

// 教师端我的学生
export function getMyStudentPage(params) {
  return request({ url: '/teacher/student/page', method: 'get', params })
}

export function getStudentApplications(studentId) {
  return request({ url: `/teacher/student/${studentId}/applications`, method: 'get' })
}

// 教师端个人资料
export function getTeacherProfile() {
  return request({ url: '/teacher/profile', method: 'get' })
}

// 教师端密码修改
export function changePassword(data) {
  return request({ url: '/user/password', method: 'put', data })
}
