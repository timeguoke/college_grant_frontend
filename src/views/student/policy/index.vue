<template>
  <div class="page-enter policy-page">
    <!-- 开放页头 -->
    <header class="page-head reveal">
      <div class="head-left">
        <div class="page-kicker">AID POLICY</div>
        <h2 class="page-title">政策须知</h2>
        <p class="page-sub">助学金评定办法、评分权重与申请条件说明</p>
      </div>
      <div class="head-badge">
        <el-icon :size="22"><Reading /></el-icon>
        <span>评定办法</span>
      </div>
    </header>

    <!-- 评定原则 -->
    <el-card shadow="never" class="section-card reveal">
      <div class="sec-title">评定原则</div>
      <div class="principle-grid">
        <div class="principle-item">
          <div class="pr-num">01</div>
          <div class="pr-name">公开透明</div>
          <div class="pr-desc">评定办法、评分结果与资助名单全程公示，接受师生监督</div>
        </div>
        <div class="principle-item">
          <div class="pr-num">02</div>
          <div class="pr-name">精准资助</div>
          <div class="pr-desc">综合考察家庭经济状况与在校表现，把资助给到最需要的学生</div>
        </div>
        <div class="principle-item">
          <div class="pr-num">03</div>
          <div class="pr-name">公平公正</div>
          <div class="pr-desc">采用 AHP 层次分析法确定权重，量化评分、按排名评定</div>
        </div>
      </div>
    </el-card>

    <!-- 评分权重 -->
    <el-card shadow="never" class="section-card reveal">
      <div class="sec-title">综合评分构成</div>
      <p class="sec-desc">学生综合得分由以下四个维度加权求和，权重经 AHP 层次分析法科学测算确定：</p>
      <div class="weight-list">
        <div v-for="(w, i) in weights" :key="w.name" class="weight-row">
          <div class="w-name">{{ w.name }}</div>
          <div class="w-track">
            <div class="w-bar" :style="{ width: w.pct + '%', transitionDelay: i * 120 + 'ms' }" :class="w.cls"></div>
          </div>
          <div class="w-num">{{ w.value }}<span>%</span></div>
        </div>
      </div>
    </el-card>

    <!-- 评定流程 -->
    <el-card shadow="never" class="section-card reveal">
      <div class="sec-title">评定流程</div>
      <div class="flow-steps">
        <div class="flow-step">
          <div class="flow-num">01</div>
          <div class="flow-body">
            <div class="flow-name">提交申请</div>
            <div class="flow-desc">学生在「申请资助」页选择类型并如实填报</div>
          </div>
        </div>
        <div class="flow-divider"></div>
        <div class="flow-step">
          <div class="flow-num">02</div>
          <div class="flow-body">
            <div class="flow-name">综合评分</div>
            <div class="flow-desc">任课教师按四个维度打分并加权汇总</div>
          </div>
        </div>
        <div class="flow-divider"></div>
        <div class="flow-step">
          <div class="flow-num">03</div>
          <div class="flow-body">
            <div class="flow-name">AHP 评定</div>
            <div class="flow-desc">按权重模型计算总分、确定等级与排名</div>
          </div>
        </div>
        <div class="flow-divider"></div>
        <div class="flow-step">
          <div class="flow-num">04</div>
          <div class="flow-body">
            <div class="flow-name">名单公示</div>
            <div class="flow-desc">公示期内无异议后发放资助，异议通过辅导员反馈</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 申请条件与资助标准 -->
    <div class="bottom-grid">
      <el-card shadow="never" class="section-card reveal">
        <div class="sec-title">申请条件</div>
        <ul class="cond-list">
          <li><el-icon><CircleCheckFilled /></el-icon>本校在册在校学生，学籍状态正常</li>
          <li><el-icon><CircleCheckFilled /></el-icon>家庭经济困难，难以负担在校学习生活支出</li>
          <li><el-icon><CircleCheckFilled /></el-icon>遵守校纪校规，无违纪处分记录</li>
          <li><el-icon><CircleCheckFilled /></el-icon>学习态度端正，积极参加集体活动</li>
          <li><el-icon><CircleCheckFilled /></el-icon>如实填报家庭经济信息，弄虚作假将取消资格</li>
        </ul>
      </el-card>
      <el-card shadow="never" class="section-card reveal">
        <div class="sec-title">资助标准</div>
        <p class="sec-desc">各助学金类型按等级分档发放，具体金额以「申请资助」页卡片展示为准：</p>
        <ul class="cond-list">
          <li><el-icon><Medal /></el-icon>按一等、二等、三等分档，档次越高资助金额越高</li>
          <li><el-icon><Medal /></el-icon>评定名次按综合得分从高到低确定，同分按家庭困难程度排序</li>
          <li><el-icon><Medal /></el-icon>资助金额经公示无异议后统一发放至学生账户</li>
        </ul>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Reading, CircleCheckFilled, Medal } from '@element-plus/icons-vue'

// AHP 权重（与系统评定模型一致）
const weights = ref([
  { name: '学业成绩', value: 35, pct: 0, cls: 'c-navy' },
  { name: '家庭情况', value: 25, pct: 0, cls: 'c-gold' },
  { name: '民主评议', value: 20, pct: 0, cls: 'c-green' },
  { name: '辅导员评价', value: 20, pct: 0, cls: 'c-slate' }
])

// ============ 滚动渐入动效 ============
function setupReveal() {
  const els = document.querySelectorAll('.policy-page .reveal')
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('revealed'))
    return
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed')
        io.unobserve(e.target)
      }
    })
  }, { threshold: 0.1 })
  els.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 90, 360)}ms`
    io.observe(el)
  })
}

onMounted(() => {
  // 权重条从 0 展开动画
  setTimeout(() => weights.value.forEach(w => (w.pct = w.value * 2.2)), 300)
  nextTick(setupReveal)
})
</script>

<style scoped>
/* ============ 开放页头 ============ */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 6px 4px 20px;
  border-bottom: 1px solid #e2e7ef;
  margin-bottom: 22px;
}
.page-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 4px;
  color: #a1792f;
  margin-bottom: 10px;
}
.page-kicker::before {
  content: '';
  width: 26px;
  height: 2px;
  background: #c9a24e;
}
.page-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1d3a6e;
  margin: 0 0 8px;
}
.page-sub {
  font-size: 13px;
  color: #5d6b80;
  margin: 0;
  letter-spacing: 0.5px;
}
.head-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1d3a6e;
  background: rgba(29, 58, 110, 0.07);
  border: 1px solid rgba(29, 58, 110, 0.12);
  border-radius: 99px;
  padding: 8px 18px;
  flex-shrink: 0;
}

/* ============ 区块卡 ============ */
.section-card {
  border-radius: 12px;
  margin-bottom: 18px;
}
.sec-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 1px;
  margin-bottom: 14px;
  padding-left: 10px;
  border-left: 3px solid #c9a24e;
}
.sec-desc {
  font-size: 13px;
  color: #5d6b80;
  line-height: 1.7;
  margin: 0 0 16px;
}

/* ============ 评定原则 ============ */
.principle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.principle-item {
  background: #f7f9fc;
  border: 1px solid #e2e7ef;
  border-radius: 10px;
  padding: 18px 20px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.principle-item:hover {
  transform: translateY(-2px);
  border-color: rgba(201, 162, 78, 0.5);
}
.pr-num {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 20px;
  font-weight: 700;
  color: #c9a24e;
  margin-bottom: 8px;
}
.pr-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d3a6e;
  margin-bottom: 6px;
}
.pr-desc {
  font-size: 12px;
  color: #8a94a6;
  line-height: 1.7;
}

/* ============ 评分权重 ============ */
.weight-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.weight-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.w-name {
  width: 92px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #22344f;
}
.w-track {
  flex: 1;
  height: 14px;
  background: #f0f3f8;
  border-radius: 7px;
  overflow: hidden;
}
.w-bar {
  height: 100%;
  border-radius: 7px;
  width: 0;
  transition: width 0.9s cubic-bezier(0.25, 0.8, 0.35, 1);
}
.c-navy { background: linear-gradient(90deg, #2c4d8a, #1d3a6e); }
.c-gold { background: linear-gradient(90deg, #d9b567, #c9a24e); }
.c-green { background: linear-gradient(90deg, #6d9a81, #4f7d63); }
.c-slate { background: linear-gradient(90deg, #8a9bb8, #5f7396); }
.w-num {
  width: 64px;
  flex-shrink: 0;
  text-align: right;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 18px;
  font-weight: 700;
  color: #1d3a6e;
  font-variant-numeric: tabular-nums;
}
.w-num span {
  font-size: 12px;
  color: #8a94a6;
  margin-left: 2px;
}

/* ============ 评定流程 ============ */
.flow-steps {
  display: flex;
  align-items: stretch;
  gap: 14px;
}
.flow-step {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.flow-num {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 22px;
  font-weight: 700;
  color: #c9a24e;
  line-height: 1.1;
}
.flow-body {
  flex: 1;
  min-width: 0;
}
.flow-name {
  font-size: 13px;
  font-weight: 600;
  color: #1d3a6e;
  margin-bottom: 4px;
}
.flow-desc {
  font-size: 12px;
  color: #8a94a6;
  line-height: 1.6;
}
.flow-divider {
  width: 1px;
  background: #e2e7ef;
  align-self: stretch;
}

/* ============ 底部两栏 ============ */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.bottom-grid .section-card {
  margin-bottom: 0;
}
.cond-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cond-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #4a5872;
  line-height: 1.65;
}
.cond-list .el-icon {
  color: #4f7d63;
  margin-top: 3px;
  flex-shrink: 0;
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .principle-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .flow-steps {
    flex-direction: column;
    gap: 12px;
  }
  .flow-divider {
    width: auto;
    height: 1px;
  }
}

/* ============ 滚动渐入动效 ============ */
.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal.revealed {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
