<template>
  <div class="family-members">
    <!-- 背景装饰 -->
    <div class="family-bg-decorations">
      <span v-for="n in 6" :key="n" class="floating-heart" :style="heartStyle(n)">{{ getHeartEmoji(n) }}</span>
    </div>

    <!-- 匹配成功的庆祝效果 -->
    <transition name="match-pop">
      <div v-if="matchedMember" class="match-overlay" @click="matchedMember = null">
        <div class="match-card">
          <div class="match-glow"></div>
          <div class="match-content">
            <div class="match-emoji-wrapper">
              <div class="match-emoji">{{ matchedMember.emoji }}</div>
              <div class="emoji-glow" :style="{ background: matchedMember.color }"></div>
            </div>
            <div class="match-name">{{ matchedMember.name }}</div>
            <div class="match-encouragement">
              <span class="encouragement-icon">⭐</span>
              {{ encouragementText }}
            </div>
          </div>
          <div class="confetti-container">
            <span v-for="n in 12" :key="n" class="confetti" :style="confettiStyle(n)">{{ getConfettiEmoji(n) }}</span>
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
          'tv-focused': currentIndex === index,
        }"
        :style="{
          animationDelay: index * 0.08 + 's',
          '--member-color': member.color,
        }"
        @click="handleMemberClick(member)"
        @touchstart="handleMemberClick(member)"
      >
        <div class="card-glow"></div>
        <div class="card-content">
          <div class="member-emoji">{{ member.emoji }}</div>
          <div class="member-name">{{ member.name }}</div>
          <div class="member-aliases">
            <span v-for="alias in member.aliases.slice(0, 2)" :key="alias" class="alias-tag">
              {{ alias }}
            </span>
          </div>
        </div>
        <div class="card-shine"></div>
        <div class="pulse-ring" v-if="highlightedId === member.id">
          <div class="ring"></div>
          <div class="ring delay"></div>
        </div>
      </div>
    </div>

    <!-- 语音识别实时文本 -->
    <transition name="transcript-slide">
      <div class="speech-transcript" v-if="transcriptText">
        <div class="transcript-bubble">
          <span class="mic-icon-inline">🎤</span>
          <span class="transcript-text">{{ transcriptText }}</span>
          <div class="transcript-waves">
            <span class="wave"></span>
            <span class="wave"></span>
            <span class="wave"></span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 场景提示 -->
    <div class="scene-hint animate-float">
      <span class="hint-icon">🗣️</span>
      <span>说出称谓 或 点击卡片</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { FamilyMember } from '@/types'
import { SpeechManager } from '@/utils/speech'

const props = defineProps<{
  speechEnabled: boolean
  currentIndex?: number
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

// 背景装饰样式
function heartStyle(n: number) {
  const positions = [
    { left: '8%', top: '12%', delay: '0s' },
    { left: '88%', top: '18%', delay: '0.8s' },
    { left: '5%', top: '65%', delay: '1.2s' },
    { left: '90%', top: '55%', delay: '1.8s' },
    { left: '15%', top: '88%', delay: '2.2s' },
    { left: '75%', top: '85%', delay: '2.8s' },
  ]
  return {
    left: positions[n - 1].left,
    top: positions[n - 1].top,
    animationDelay: positions[n - 1].delay,
  }
}

function getHeartEmoji(n: number) {
  const hearts = ['💕', '💗', '💖', '💝', '💞', '💓']
  return hearts[n - 1]
}

function getConfettiEmoji(n: number) {
  const confettis = ['🎉', '🎊', '⭐', '✨', '💫', '🌟', '🎈', '🎁', '🎉', '🎊', '⭐', '✨']
  return confettis[n - 1]
}

// 彩纸效果样式
function confettiStyle(n: number) {
  const angle = (n * 30) * (Math.PI / 180)
  const distance = 60 + Math.random() * 60
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 30}px)`,
    animationDelay: `${n * 0.06}s`,
  }
}

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

  if (speechManager) {
    speechManager.speakFamilyMember(member.name)
  }

  setTimeout(() => {
    if (matchedMember.value?.id === member.id) {
      matchedMember.value = null
      highlightedId.value = null
    }
  }, 3500)
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

  setTimeout(() => {
    transcriptText.value = ''
  }, 3000)
}

defineExpose({
  selectByIndex: (index: number) => {
    if (index >= 0 && index < members.length) {
      matchMember(members[index])
    }
  }
})

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
  overflow: hidden;
}

/* 背景装饰 */
.family-bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.floating-heart {
  position: absolute;
  font-size: 24px;
  opacity: 0.5;
  animation: floatHeart 5s ease-in-out infinite;
}

@keyframes floatHeart {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-12px) scale(1.1);
    opacity: 0.7;
  }
}

/* 成员网格 */
.member-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 500px;
  padding: 0 8px;
  position: relative;
  z-index: 1;
}

/* 成员卡片 */
.member-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 3px solid transparent;
  animation: cardFadeIn 0.5s ease-out both;
  min-height: 140px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.member-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.member-card:hover::before {
  opacity: 1;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, var(--member-color) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.member-card:hover .card-glow {
  opacity: 0.1;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.card-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 60%
  );
  transform: rotate(45deg);
  animation: shine 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes shine {
  0%, 100% {
    transform: rotate(45deg) translateX(-100%);
  }
  50% {
    transform: rotate(45deg) translateX(100%);
  }
}

.member-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.member-card:active {
  transform: scale(0.96);
}

.member-card.is-matched {
  border-color: var(--color-primary);
  transform: scale(1.08);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.35);
}

.member-card.is-highlighted {
  border-color: var(--color-accent);
  animation: wiggle 0.6s ease-in-out;
}

.member-emoji {
  font-size: 52px;
  line-height: 1;
  transition: transform 0.3s ease;
}

.member-card:hover .member-emoji {
  transform: scale(1.1);
}

.member-name {
  font-size: 18px;
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
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: var(--color-background);
  color: var(--color-text-light);
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  pointer-events: none;
}

.ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: ringPulse 1s ease-out infinite;
}

.ring.delay {
  animation-delay: 0.5s;
}

@keyframes ringPulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* 匹配浮层 */
.match-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  cursor: pointer;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.match-card {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: 40px 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: visible;
}

.match-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(circle at center, rgba(255, 230, 109, 0.3) 0%, transparent 70%);
  border-radius: var(--radius-2xl);
  z-index: -1;
}

.match-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.match-emoji-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.match-emoji {
  font-size: 100px;
  line-height: 1;
  animation: bounce 0.6s ease-in-out infinite;
}

.emoji-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin-left: -60px;
  margin-top: -60px;
  border-radius: 50%;
  opacity: 0.3;
  filter: blur(30px);
  animation: glowPulse 1.5s ease-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(0.8); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

.match-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 4px;
}

.match-encouragement {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--color-secondary);
  font-weight: 600;
  padding: 10px 24px;
  background: rgba(78, 205, 196, 0.1);
  border-radius: var(--radius-xl);
}

.encouragement-icon {
  font-size: 18px;
  animation: sparkle 1s ease-in-out infinite;
}

.confetti-container {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.confetti {
  position: absolute;
  font-size: 24px;
  opacity: 0;
  animation: confettiBurst 1.2s ease-out forwards;
}

@keyframes confettiBurst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: var(--transform) scale(0.5) rotate(360deg);
  }
}

/* 语音识别文本 */
.speech-transcript {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.transcript-bubble {
  background: var(--color-white);
  padding: 12px 24px;
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 107, 107, 0.2);
}

.mic-icon-inline {
  font-size: 22px;
  animation: pulse 1s ease-in-out infinite;
}

.transcript-text {
  font-size: 16px;
  color: var(--color-primary);
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transcript-waves {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 20px;
}

.wave {
  width: 3px;
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  animation: waveAnimation 0.5s ease-in-out infinite;
}

.wave:nth-child(1) { animation-delay: 0s; }
.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }

@keyframes waveAnimation {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

/* 场景提示 */
.scene-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 10px 24px;
  border-radius: var(--radius-2xl);
  font-size: 14px;
  color: var(--color-text-light);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 107, 107, 0.1);
  z-index: 5;
}

.hint-icon {
  font-size: 18px;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 过渡动画 */
.match-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.match-pop-leave-active {
  transition: all 0.25s ease-in;
}

.match-pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.match-pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.transcript-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.transcript-slide-leave-active {
  transition: all 0.2s ease-in;
}

.transcript-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.transcript-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* 响应式 */
@media (max-width: 480px) {
  .member-grid {
    gap: 12px;
  }
  
  .member-card {
    padding: 16px 8px;
    min-height: 120px;
  }
  
  .member-emoji {
    font-size: 44px;
  }
  
  .member-name {
    font-size: 16px;
  }
  
  .match-card {
    padding: 32px 40px;
    margin: 16px;
  }
  
  .match-emoji {
    font-size: 80px;
  }
  
  .match-name {
    font-size: 26px;
  }
}
</style>
