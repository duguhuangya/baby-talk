<template>
  <div class="family-members">
    <!-- 匹配成功的庆祝效果 -->
    <transition name="detail-fade">
      <div v-if="matchedMember" class="match-overlay" @click="matchedMember = null">
        <div class="match-card animate-bounce-large">
          <div class="match-emoji">{{ matchedMember.emoji }}</div>
          <div class="match-name">{{ matchedMember.name }}</div>
          <div class="match-encouragement">{{ encouragementText }}</div>
          <div class="confetti">
            <span v-for="n in 8" :key="n" class="confetti-item" :style="confettiStyle(n)">🎉</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 成员网格 -->
    <div class="member-grid">
      <div
        v-for="(member, index) in members"
        :key="member.id"
        class="member-card"
        :class="{
          'is-matched': matchedMember?.id === member.id,
          'is-highlighted': highlightedId === member.id,
        }"
        :style="{
          animationDelay: index * 0.1 + 's',
          '--member-color': member.color,
        }"
        @click="handleMemberClick(member)"
        @touchstart="handleMemberClick(member)"
      >
        <div class="member-emoji">{{ member.emoji }}</div>
        <div class="member-name">{{ member.name }}</div>
        <div class="member-aliases">
          <span v-for="alias in member.aliases.slice(0, 2)" :key="alias" class="alias-tag">
            {{ alias }}
          </span>
        </div>
        <!-- 匹配动画指示器 -->
        <div class="pulse-ring" v-if="highlightedId === member.id"></div>
      </div>
    </div>

    <!-- 语音识别实时文本 -->
    <div class="speech-transcript" v-if="transcriptText">
      <div class="transcript-bubble">
        <span class="mic-icon-inline">🎤</span>
        <span class="transcript-text">{{ transcriptText }}</span>
      </div>
    </div>

    <!-- 场景提示 -->
    <div class="scene-hint animate-float">
      <span>🗣️ 说出称谓 或 点击卡片</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { FamilyMember } from '@/types'
import { SpeechManager } from '@/utils/speech'

const props = defineProps<{
  speechEnabled: boolean
}>()

const emit = defineEmits<{
  (e: 'member-matched', member: FamilyMember): void
}>()

// 家庭成员数据
const members: FamilyMember[] = [
  {
    id: 'father',
    name: '爸爸',
    emoji: '👨',
    pronunciation: 'bà ba',
    aliases: ['baba', '粑粑', '叭叭', '爸爸'],
    color: '#FF6B6B',
  },
  {
    id: 'mother',
    name: '妈妈',
    emoji: '👩',
    pronunciation: 'mā ma',
    aliases: ['mama', '麻麻', '马马', '妈妈'],
    color: '#4ECDC4',
  },
  {
    id: 'grandfather',
    name: '爷爷',
    emoji: '👴',
    pronunciation: 'yé ye',
    aliases: ['yeye', '耶耶', '椰椰', '爷爷'],
    color: '#FFE66D',
  },
  {
    id: 'grandmother',
    name: '奶奶',
    emoji: '👵',
    pronunciation: 'nǎi nai',
    aliases: ['nainai', '乃乃', '奈奈', '奶奶'],
    color: '#45B7D1',
  },
  {
    id: 'sister',
    name: '姐姐',
    emoji: '👧',
    pronunciation: 'jiě jie',
    aliases: ['jiejie', '杰杰', '洁洁', '姐姐'],
    color: '#96CEB4',
  },
  {
    id: 'younger-sister',
    name: '妹妹',
    emoji: '👶',
    pronunciation: 'mèi mei',
    aliases: ['meimei', '梅梅', '美美', '妹妹'],
    color: '#DDA0DD',
  },
]

const matchedMember = ref<FamilyMember | null>(null)
const highlightedId = ref<string | null>(null)
const encouragementText = ref('')
const transcriptText = ref('')

// 鼓励语句
const encouragements = [
  '真棒！宝宝认识家人了！',
  '太厉害了！说得真好！',
  '宝宝好聪明！',
  '好棒呀！再说一个！',
  '真了不起！',
  '说得真清楚！',
]

// 语音管理器
let speechManager: SpeechManager | null = null

// 处理成员点击
function handleMemberClick(member: FamilyMember) {
  matchMember(member)
}

// 匹配成员
function matchMember(member: FamilyMember) {
  if (matchedMember.value?.id === member.id) return
  
  matchedMember.value = member
  highlightedId.value = member.id
  encouragementText.value = encouragements[Math.floor(Math.random() * encouragements.length)]
  emit('member-matched', member)

  // 播报
  if (speechManager) {
    speechManager.speakFamilyMember(member.name)
  }

  // 3秒后自动关闭
  setTimeout(() => {
    if (matchedMember.value?.id === member.id) {
      matchedMember.value = null
      highlightedId.value = null
    }
  }, 3500)
}

// 彩纸效果样式
function confettiStyle(n: number) {
  const angle = (n * 45) * (Math.PI / 180)
  const distance = 80 + Math.random() * 60
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    animationDelay: `${n * 0.05}s`,
  }
}

// 语音识别处理
function handleSpeechResult(text: string, matchedKeyword: string | null) {
  transcriptText.value = text
  
  if (matchedKeyword) {
    const member = members.find((m) => m.name === matchedKeyword)
    if (member) {
      matchMember(member)
    }
  }

  // 3秒后清除文本
  setTimeout(() => {
    transcriptText.value = ''
  }, 3000)
}

// 初始化
onMounted(() => {
  speechManager = new SpeechManager()
  speechManager.init(handleSpeechResult, () => {})
  
  if (props.speechEnabled) {
    speechManager.startListening()
  }
})

// 监听语音开关
watch(
  () => props.speechEnabled,
  (enabled) => {
    if (enabled) {
      speechManager?.startListening()
    } else {
      speechManager?.stopListening()
    }
  }
)

onUnmounted(() => {
  speechManager?.destroy()
})
</script>

<style scoped>
.family-members {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
  background: linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 50%, #FFCC80 100%);
}

/* 成员网格 */
.member-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 500px;
  padding: 0 8px;
}

/* 成员卡片 */
.member-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 3px solid transparent;
  animation: fadeIn 0.5s ease-out both;
  position: relative;
  overflow: hidden;
  min-height: 130px;
  justify-content: center;
}

.member-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--color-shadow);
}

.member-card:active {
  transform: scale(0.95);
}

.member-card.is-matched {
  border-color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
}

.member-card.is-highlighted {
  border-color: var(--color-accent);
  animation: wiggle 0.5s ease-in-out;
}

.member-emoji {
  font-size: 48px;
  line-height: 1;
}

.member-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.member-aliases {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.alias-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text-light);
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  margin: -30px 0 0 -30px;
  border-radius: 50%;
  border: 3px solid var(--color-primary);
  animation: ripple 1.5s ease-out infinite;
  pointer-events: none;
}

/* 匹配浮层 */
.match-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  cursor: pointer;
}

.match-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: 32px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.match-emoji {
  font-size: 96px;
  line-height: 1;
}

.match-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}

.match-encouragement {
  font-size: var(--font-size-md);
  color: var(--color-secondary);
  font-weight: 600;
  padding: 8px 20px;
  background: rgba(78, 205, 196, 0.1);
  border-radius: var(--radius-xl);
}

.confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.confetti-item {
  position: absolute;
  font-size: 24px;
  animation: confetti-burst 1s ease-out forwards;
  opacity: 0;
}

@keyframes confetti-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx, 50px), var(--ty, -50px)) scale(0.5);
  }
}

/* 语音识别文本 */
.speech-transcript {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.transcript-bubble {
  background: var(--color-white);
  padding: 8px 20px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px var(--color-shadow);
  animation: slideUp 0.3s ease-out;
}

.mic-icon-inline {
  font-size: 20px;
}

.transcript-text {
  font-size: var(--font-size-md);
  color: var(--color-primary);
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 场景提示 */
.scene-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 20px;
  border-radius: var(--radius-xl);
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  box-shadow: 0 2px 8px var(--color-shadow);
}

/* 过渡 */
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: all 0.3s ease;
}
.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
}
</style>
