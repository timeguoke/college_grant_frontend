import request from '@/utils/request'

// 学生管理（管理员）
export function getStudentPage(params) {
  return request({ url: '/admin/student/list', method: 'get', params })
}

export function addStudent(data) {
  return request({ url: '/admin/student', method: 'post', data })
}

export function updateStudent(id, data) {
  return request({ url: `/admin/student/${id}`, method: 'put', data })
}

export function deleteStudent(id) {
  return request({ url: `/admin/student/${id}`, method: 'delete' })
}

export function resetPassword(id) {
  return request({ url: `/admin/student/${id}/reset-password`, method: 'put' })
}

// 批量导入学生（formData 含 file 字段）
export function importStudents(formData) {
  return request({ url: '/admin/student/import', method: 'post', data: formData, timeout: 60000 })
}

// 导出学生Excel（支持当前筛选条件，返回文件流）
export function exportStudents(params) {
  return request({ url: '/admin/student/export', method: 'get', params, responseType: 'blob', timeout: 60000 })
}

// 下载学生导入模板（返回文件流）
export function downloadStudentTemplate() {
  return request({ url: '/admin/student/export-template', method: 'get', responseType: 'blob' })
}

// 学院下拉列表（去重）
export function getCollegeList() {
  return request({ url: '/admin/student/colleges', method: 'get' })
}

// 班级下拉列表（去重，可按学院级联过滤）
export function getClassList(college) {
  return request({ url: '/admin/student/classes', method: 'get', params: { college } })
}

// 教师管理（管理员）
export function getTeacherPage(params) {
  return request({ url: '/admin/teacher/list', method: 'get', params })
}

export function addTeacher(data) {
  return request({ url: '/admin/teacher', method: 'post', data })
}

export function updateTeacher(id, data) {
  return request({ url: `/admin/teacher/${id}`, method: 'put', data })
}

export function deleteTeacher(id) {
  return request({ url: `/admin/teacher/${id}`, method: 'delete' })
}

// 批量导入教师（formData 含 file 字段，成功后自动创建登录账号）
export function importTeachers(formData) {
  return request({ url: '/admin/teacher/import', method: 'post', data: formData, timeout: 60000 })
}

// 导出教师Excel（支持当前筛选条件，返回文件流）
export function exportTeachers(params) {
  return request({ url: '/admin/teacher/export', method: 'get', params, responseType: 'blob', timeout: 60000 })
}

// 下载教师导入模板（返回文件流）
export function downloadTeacherTemplate() {
  return request({ url: '/admin/teacher/export-template', method: 'get', responseType: 'blob' })
}

// 助学金类型管理
export function getGrantTypeList() {
  return request({ url: '/admin/grant-type/list', method: 'get' })
}

export function getGrantTypePage(params) {
  return request({ url: '/admin/grant-type/page', method: 'get', params })
}

export function addGrantType(data) {
  return request({ url: '/admin/grant-type', method: 'post', data })
}

export function updateGrantType(id, data) {
  return request({ url: `/admin/grant-type/${id}`, method: 'put', data })
}

export function deleteGrantType(id) {
  return request({ url: `/admin/grant-type/${id}`, method: 'delete' })
}

// 启用/停用助学金类型（status: 1启用 0停用）
export function updateGrantTypeStatus(id, status) {
  return request({ url: `/admin/grant-type/${id}/status`, method: 'put', params: { status } })
}

// 助学金等级管理
export function getLevelList(typeId) {
  return request({ url: `/admin/grant-level/list/${typeId}`, method: 'get' })
}

export function addLevel(typeId, data) {
  return request({ url: `/admin/grant-level/${typeId}`, method: 'post', data })
}

export function updateLevel(id, data) {
  return request({ url: `/admin/grant-level/${id}`, method: 'put', data })
}

export function deleteLevel(id) {
  return request({ url: `/admin/grant-level/${id}`, method: 'delete' })
}

// 申请管理
export function getApplicationPage(params) {
  return request({ url: '/admin/application/list', method: 'get', params })
}

export function getApplicationDetail(id) {
  return request({ url: `/admin/application/${id}`, method: 'get' })
}

// 评分管理
export function getScoreList(params) {
  return request({ url: '/admin/score/list', method: 'get', params })
}

export function getScoreDetail(applicationId) {
  return request({ url: `/admin/score/${applicationId}`, method: 'get' })
}

// AHP评定
export function doEvaluate(data) {
  return request({ url: '/admin/evaluation/do', method: 'post', data })
}

export function getEvaluationPage(params) {
  return request({ url: '/admin/evaluation/list', method: 'get', params })
}

export function getEvaluationDetail(id) {
  return request({ url: `/admin/evaluation/${id}`, method: 'get' })
}

export function exportEvaluation(typeId) {
  return request({ url: '/admin/evaluation/export', method: 'get', params: { typeId }, responseType: 'blob' })
}

// 公示管理
export function getNoticePage(params) {
  return request({ url: '/admin/notice/list', method: 'get', params })
}

export function addNotice(data) {
  return request({ url: '/admin/notice', method: 'post', data })
}

export function getNoticeDetail(id) {
  return request({ url: `/admin/notice/${id}`, method: 'get' })
}

export function updateNotice(id, data) {
  return request({ url: `/admin/notice/${id}`, method: 'put', data })
}

export function deleteNotice(id) {
  return request({ url: `/admin/notice/${id}`, method: 'delete' })
}

export function publishNotice(id) {
  return request({ url: `/admin/notice/publish/${id}`, method: 'put' })
}

// 结束公示（公示中 → 已结束）
export function endNotice(id) {
  return request({ url: `/admin/notice/end/${id}`, method: 'put' })
}

// 公示状态统计（未发布/公示中/已结束）
export function getNoticeStats() {
  return request({ url: '/admin/notice/stats', method: 'get' })
}

// 导出公示名单Excel（返回文件流）
export function exportNoticeStudents(id) {
  return request({ url: `/admin/notice/${id}/export`, method: 'get', responseType: 'blob', timeout: 60000 })
}

// 仪表盘
export function getDashboard() {
  return request({ url: '/admin/dashboard', method: 'get' })
}

// 密码修改
export function changePassword(data) {
  return request({ url: '/user/password', method: 'put', data })
}

// 文件上传
export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({ url: '/file/upload', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
}
