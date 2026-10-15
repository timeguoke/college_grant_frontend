<template>
  <div class="page-enter faq-page">
    <!-- 开放页头 + 搜索 -->
    <header class="page-head reveal">
      <div class="head-left">
        <div class="page-kicker">HELP CENTER</div>
        <h2 class="page-title">帮助中心</h2>
        <p class="page-sub">常见问题解答，没有找到答案可联系辅导员</p>
      </div>
      <el-input
        v-model="keyword"
        class="faq-search"
        placeholder="搜索问题，如：申请、公示、密码"
        :prefix-icon="Search"
        clearable
      />
    </header>

    <!-- 分类手风琴 -->
    <div v-for="group in filteredGroups" :key="group.name" class="faq-group reveal">
      <div class="group-title">
        <el-icon><component :is="group.icon" /></el-icon>
        <span>{{ group.name }}</span>
        <span class="group-count">{{ group.items.length }} 个问题</span>
      </div>
      <el-collapse v-model="group.active" class="faq-collapse">
        <el-collapse-item v-for="qa in group.items" :key="qa.q" :name="qa.q">
          <template #title>
            <span class="faq-q">{{ qa.q }}</span>
          </template>
          <div class="faq-a">{{ qa.a }}</div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-empty v-if="!filteredGroups.length" description="没有匹配的问题，换个关键词试试" class="reveal" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { Search, Document, Trophy, User } from '@element-plus/icons-vue'

const keyword = ref('')

// ============ 问答内容（基于系统真实规则编写） ============
const groups = reactive([
  {
    name: '申请相关',
    icon: Document,
    active: [],
    items: [
      {
        q: '如何申请助学金？',
        a: '登录后进入「申请资助」页面，浏览可申请的助学金类型卡片，点击卡片上的「立即申请」按钮，如实填写申请理由、家庭情况、家庭年收入与家庭人口数（人均年收入自动计算）。如有建档立卡、低保等特殊困难类型，请上传相应证明材料。确认无误后提交即可。'
      },
      {
        q: '可以同时申请多种助学金吗？',
        a: '可以。每种助学金类型需要单独提交一份申请，互不影响。但同一种助学金在审核期间不能重复提交；若申请被驳回，修改后可重新提交该类型。'
      },
      {
        q: '为什么我的申请被驳回了？',
        a: '驳回原因会显示在「我的申请」页对应记录的审核意见中。常见原因包括：家庭经济信息填写不完整、证明材料缺失或不清晰等。请根据审核意见修改完善后重新提交。'
      }
    ]
  },
  {
    name: '评定与公示',
    icon: Trophy,
    active: [],
    items: [
      {
        q: '综合评分是怎么构成的？',
        a: '综合得分由四个维度加权求和：学业成绩占 35%、家庭情况占 25%、民主评议占 20%、辅导员评价占 20%。权重由 AHP 层次分析法科学测算得出，详细说明见「政策须知」页面。'
      },
      {
        q: '在哪里查看申请进度？',
        a: '进入「我的申请」页面，每条申请都展示「提交 → 评分 → 评定 → 公示」四步进度条，当前停留在哪个环节一目了然。页面支持卡片与时间线两种视图，右上角可切换。'
      },
      {
        q: '评定结果什么时候公布？',
        a: '评分与评定完成后，学校资助管理中心会统一发布公示批次。公示信息（含受助名单、等级与金额）在「公示查看」页面实时可见，公示中的批次会显示剩余天数倒计时。'
      },
      {
        q: '对公示结果有异议怎么办？',
        a: '公示期内，如对名单或等级有异议，可通过辅导员提交书面异议反馈，由资助管理中心核实处理。公示期结束后将不再受理该批次异议。'
      }
    ]
  },
  {
    name: '账号与其他',
    icon: User,
    active: [],
    items: [
      {
        q: '填写的家庭收入信息会被核实吗？',
        a: '会。家庭经济情况是评定的重要依据，请务必如实填写。特殊困难类型（建档立卡、低保家庭、孤儿、残疾）需上传相应证明材料，学校将按规定核实，弄虚作假将取消评定资格。'
      },
      {
        q: '忘记密码怎么办？',
        a: '请联系辅导员或资助管理中心管理员重置密码，重置后请尽快在「修改密码」页面更新为自己的新密码。'
      },
      {
        q: '个人资料信息有误怎么修改？',
        a: '「我的资料」页面的学籍信息由学校统一维护，如发现姓名、学院、班级等信息有误，请联系辅导员更正。'
      }
    ]
  }
])

// ============ 前端搜索过滤 ============
const filteredGroups = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return groups
  return groups
    .map(g => ({
      ...g,
      items: g.items.filter(qa => (qa.q + qa.a).toLowerCase().includes(kw))
    }))
    .filter(g => g.items.length)
})

// ============ 滚动渐入动效 ============
function setupReveal() {
  const els = document.querySelectorAll('.faq-page .reveal')
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

onMounted(() => nextTick(setupReveal))
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
.faq-search {
  width: 300px;
  flex-shrink: 0;
}

/* ============ 分组手风琴 ============ */
.faq-group {
  margin-bottom: 20px;
}
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 700;
  color: #1d3a6e;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #c9a24e;
}
.group-count {
  font-family: inherit;
  font-size: 11px;
  font-weight: 400;
  color: #8a94a6;
  letter-spacing: 0.5px;
  margin-left: auto;
}
.faq-collapse {
  border: none;
}
.faq-collapse :deep(.el-collapse-item__header) {
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 10px;
  padding: 0 18px;
  height: 52px;
  font-size: 14px;
  margin-bottom: 10px;
  transition: border-color 0.2s ease;
}
.faq-collapse :deep(.el-collapse-item__header:hover) {
  border-color: rgba(201, 162, 78, 0.5);
}
.faq-collapse :deep(.el-collapse-item__header.is-active) {
  border-color: rgba(201, 162, 78, 0.55);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.faq-collapse :deep(.el-collapse-item__wrap) {
  border: 1px solid rgba(201, 162, 78, 0.55);
  border-top: none;
  border-radius: 0 0 10px 10px;
  margin: -10px 0 10px;
  background: #fdfcf8;
}
.faq-collapse :deep(.el-collapse-item__content) {
  padding: 14px 18px;
}
.faq-q {
  font-weight: 600;
  color: #22344f;
}
.faq-a {
  font-size: 13px;
  color: #5d6b80;
  line-height: 1.9;
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .faq-search {
    width: 100%;
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
