<template>
  <div class="app-container">
    <!-- 隐藏的视频元素（摄像头输入源） -->
    <video ref="videoRef" class="hidden-video" playsinline autoplay muted></video>

    <!-- 顶部状态栏 -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="camera-mini" @click="toggleParentPanel" :class="{ 'is-active': cameraActive }">
          <CameraPreview
            :canvas-width="48"
            :canvas-height="36"
            :active="cameraActive"
          />
          <div v-if="!cameraActive" class="camera-off-overlay">
            <span class="camera-icon">📷</span>
          </div>
          <div v-if="cameraActive" class="camera-active-indicator"></div>
        </div>
      </div>
      
      <div class="top-bar-center">
        <div class="app-title-wrapper">
          <span class="app-icon">👶</span>
          <h1 class="app-title">咿呀学语</h1>
        </div>
      </div>
      
      <div class="top-bar-right">
        <div class="time-display">
          <span class="time-icon">🕐</span>
          <span class="time-text">{{ currentTime }}</span>
        </div>
      </div>
    </header>

    <!-- 场景背景装饰 -->
    <div class="scene-background" :class="currentScene"></div>

    <!-- 中部场景区域 -->
    <main class="scene-area" :class="{ 'tv-mode': isTVMode }">
      <transition name="scene-transition" mode="out-in">
        <AnimalPark
          v-if="currentScene === SceneType.ANIMAL_PARK"
          :gesture-state="gestureState"
          :current-index="currentIndex"
          @animal-selected="handleAnimalSelected"
          key="animal"
          ref="animalParkRef"
        />
        <FamilyMembers
          v-else
          :speech-enabled="speechEnabled"
          :current-index="currentIndex"
          @member-matched="handleMemberMatched"
          key="family"
          ref="familyMembersRef"
        />
      </transition>
    </main>

    <!-- 底部控制栏 -->
    <footer class="bottom-bar">
      <div class="bottom-left">
        <div class="gesture-hint" :class="{ 'is-active': gestureEnabled }">
          <span class="hint-icon">👋</span>
          <span class="hint-text">挥手切换</span>
        </div>
      </div>
      
      <div class="bottom-center">
        <button class="scene-toggle-btn" @click="switchScene">
          <span class="btn-icon">{{ currentScene === SceneType.ANIMAL_PARK ? '🐱' : '👨‍👩‍👧' }}</span>
          <span class="btn-text">{{ currentScene === SceneType.ANIMAL_PARK ? '动物乐园' : '家庭成员' }}</span>
          <span class="btn-arrow">›</span>
        </button>
      </div>
      
      <div class="bottom-right">
        <div class="speech-status" :class="{ 'is-active': speechState.isListening }">
          <span class="mic-icon">{{ speechState.isListening ? '🎤' : '🔇' }}</span>
          <span class="status-text">{{ speechState.isListening ? '正在听' : '语音关闭' }}</span>
        </div>
      </div>
    </footer>

    <!-- 手势反馈气泡 -->
    <transition name="bubble-transition">
      <div v-if="gestureFeedback" class="gesture-bubble">
        <div class="bubble-content">
          <span class="bubble-icon">{{ gestureFeedback.icon }}</span>
          <span class="bubble-text">{{ gestureFeedback.text }}</span>
        </div>
        <div class="bubble-particles">
          <span v-for="n in 6" :key="n" class="particle" :style="particleStyle(n)">✨</span>
        </div>
      </div>
    </transition>

    <!-- 家长面板（抽屉） -->
    <ParentPanel
      v-model:show="showParentPanel"
      :camera-active="cameraActive"
      :speech-enabled="speechEnabled"
      :gesture-enabled="gestureEnabled"
      @update:camera-active="cameraActive = $event"
      @update:speech-enabled="speechEnabled = $event"
      @update:gesture-enabled="gestureEnabled = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { SceneType, GestureType } from '@/types'
import type { GestureState, SpeechState } from '@/types'
import { GestureRecognizer } from '@/utils/gesture'
import { SpeechManager } from '@/utils/speech'
import CameraPreview from '@/components/CameraPreview.vue'
import AnimalPark from '@/components/AnimalPark.vue'
import FamilyMembers from '@/components/FamilyMembers.vue'
import ParentPanel from '@/components/ParentPanel.vue'

// 场景状态
const currentScene = ref<SceneType>(SceneType.ANIMAL_PARK)

// 摄像头状态
const cameraActive = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)

// 功能开关
const speechEnabled = ref(true)
const gestureEnabled = ref(true)

// 手势识别状态
const gestureState = reactive<GestureState>({
  currentGesture: GestureType.NONE,
  confidence: 0,
  pointingAt: null,
  isActive: false,
})

// 语音状态
const speechState = reactive<SpeechState>({
  isListening: false,
  transcript: '',
  confidence: 0,
  isSpeaking: false,
})

// UI 状态
const showParentPanel = ref(false)
const currentTime = ref('')
const gestureFeedback = ref<{ icon: string; text: string } | null>(null)

// 模块实例
let gestureRecognizer: GestureRecognizer | null = null
let speechManager: SpeechManager | null = null
let timeTimer: ReturnType<typeof setInterval> | null = null

// TV遥控器导航状态
const isTVMode = ref(false)
const currentIndex = ref(0)
const animalParkRef = ref<InstanceType<typeof AnimalPark> | null>(null)
const familyMembersRef = ref<InstanceType<typeof FamilyMembers> | null>(null)
let backspaceCount = 0
let backspaceTimer: ReturnType<typeof setTimeout> | null = null

// TV模式检测
function checkTVMode() {
  const width = window.innerWidth
  const height = window.innerHeight
  isTVMode.value = width >= 1280 || (width > height && width >= 1024)
  
  if (isTVMode.value) {
    document.body.classList.add('tv-navigation')
  } else {
    document.body.classList.remove('tv-navigation')
  }
}

// 处理遥控器按键
function handleRemoteKey(e: KeyboardEvent) {
  if (!isTVMode.value) return
  
  const key = e.key
  
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
    e.preventDefault()
  }
  
  switch (key) {
    case 'ArrowUp':
      if (currentIndex.value >= 3) {
        currentIndex.value -= 3
      }
      break
      
    case 'ArrowDown':
      if (currentIndex.value < 3) {
        currentIndex.value += 3
      }
      break
      
    case 'ArrowLeft':
      if (currentIndex.value % 3 > 0) {
        currentIndex.value--
      }
      break
      
    case 'ArrowRight':
      if (currentIndex.value % 3 < 2) {
        currentIndex.value++
      }
      break
      
    case 'Enter':
      if (currentScene.value === SceneType.ANIMAL_PARK) {
        animalParkRef.value?.selectByIndex(currentIndex.value)
      } else {
        familyMembersRef.value?.selectByIndex(currentIndex.value)
      }
      break
      
    case 'Backspace':
      backspaceCount++
      
      if (backspaceTimer) {
        clearTimeout(backspaceTimer)
      }
      
      if (backspaceCount >= 5) {
        backspaceCount = 0
        toggleParentPanel()
      } else {
        backspaceTimer = setTimeout(() => {
          backspaceCount = 0
        }, 2000)
      }
      break
      
    case 'MediaPlayPause':
    case 'MediaPlay':
      switchScene()
      break
  }
}

// 切换场景
function switchScene() {
  currentScene.value =
    currentScene.value === SceneType.ANIMAL_PARK
      ? SceneType.FAMILY_MEMBERS
      : SceneType.ANIMAL_PARK
}

// 显示手势反馈
function showGestureFeedback(feedback: { icon: string; text: string }) {
  gestureFeedback.value = feedback
  setTimeout(() => {
    gestureFeedback.value = null
  }, 2000)
}

// 粒子样式
function particleStyle(n: number) {
  const angle = (n * 60) * (Math.PI / 180)
  const distance = 50 + Math.random() * 30
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 20}px)`,
    animationDelay: `${n * 0.05}s`,
  }
}

// 切换家长面板
function toggleParentPanel() {
  showParentPanel.value = !showParentPanel.value
}

// 处理手势回调
function handleGesture(state: GestureState) {
  Object.assign(gestureState, state)

  if (!gestureEnabled.value) return

  switch (state.currentGesture) {
    case GestureType.FIST:
      showGestureFeedback({ icon: '✊', text: '暂停' })
      break
    case GestureType.OPEN_PALM:
      showGestureFeedback({ icon: '🖐️', text: '播放' })
      break
    case GestureType.WAVING:
      switchScene()
      showGestureFeedback({ icon: '👋', text: '切换场景!' })
      break
    case GestureType.POINTING:
      break
  }
}

// 处理动物选择
function handleAnimalSelected(animal: any) {
  speechManager?.speakAnimalInfo(animal.name, animal.sound, animal.pronunciation)
}

// 处理家庭成员匹配
function handleMemberMatched(member: any) {
  speechManager?.speakFamilyMember(member.name)
}

// 处理语音识别结果
function handleSpeechResult(text: string, matchedKeyword: string | null) {
  console.log('语音识别结果:', text, '匹配:', matchedKeyword)
  speechState.transcript = text
}

// 处理语音状态变化
function handleSpeechStateChange(state: SpeechState) {
  Object.assign(speechState, state)
}

// 更新时间
function updateTime() {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

// 监听摄像头状态
watch(cameraActive, async (active) => {
  if (active && videoRef.value) {
    try {
      gestureRecognizer = new GestureRecognizer()
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      await gestureRecognizer.init(
        videoRef.value,
        canvas,
        handleGesture
      )
    } catch (e) {
      console.error('摄像头启动失败:', e)
      cameraActive.value = false
    }
  } else {
    gestureRecognizer?.stop()
    gestureRecognizer = null
  }
})

// 监听语音开关
watch(speechEnabled, (enabled) => {
  if (enabled) {
    speechManager?.startListening()
  } else {
    speechManager?.stopListening()
  }
})

// 生命周期
onMounted(() => {
  speechManager = new SpeechManager()
  speechManager.init(handleSpeechResult, handleSpeechStateChange)
  
  if (speechEnabled.value) {
    speechManager.startListening()
  }

  updateTime()
  timeTimer = setInterval(updateTime, 30000)

  setTimeout(() => {
    cameraActive.value = true
  }, 1500)
  
  checkTVMode()
  window.addEventListener('resize', checkTVMode)
  window.addEventListener('keydown', handleRemoteKey)
})

onUnmounted(() => {
  gestureRecognizer?.stop()
  speechManager?.destroy()
  if (timeTimer) clearInterval(timeTimer)
  if (backspaceTimer) clearTimeout(backspaceTimer)
  window.removeEventListener('resize', checkTVMode)
  window.removeEventListener('keydown', handleRemoteKey)
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  position: relative;
  overflow: hidden;
}

/* 场景背景装饰 */
.scene-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  transition: all 0.5s ease;
}

.scene-background.ANIMAL_PARK {
  background: linear-gradient(180deg, 
    rgba(232, 245, 233, 0.3) 0%, 
    rgba(200, 230, 201, 0.3) 50%, 
    rgba(165, 214, 167, 0.3) 100%
  );
}

.scene-background.FAMILY_MEMBERS {
  background: linear-gradient(180deg, 
    rgba(255, 243, 224, 0.3) 0%, 
    rgba(255, 224, 178, 0.3) 50%, 
    rgba(255, 204, 128, 0.3) 100%
  );
}

/* 顶部状态栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(255, 255, 255, 0.85) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(255, 107, 107, 0.08);
  z-index: 10;
  height: 64px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 107, 107, 0.06);
}

.top-bar-left,
.top-bar-right {
  width: 80px;
  display: flex;
  align-items: center;
}

.top-bar-right {
  justify-content: flex-end;
}

.top-bar-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-icon {
  font-size: 28px;
  animation: bounce 2s ease-in-out infinite;
}

.app-title {
  font-size: 22px;
  font-weight: 700;
  background: var(--color-primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}

/* 摄像头预览 */
.camera-mini {
  position: relative;
  width: 52px;
  height: 40px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid rgba(78, 205, 196, 0.3);
  background: #f0f0f0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.camera-mini:hover {
  transform: scale(1.05);
  border-color: var(--color-secondary);
}

.camera-mini.is-active {
  border-color: var(--color-secondary);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.camera-off-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
}

.camera-icon {
  font-size: 18px;
}

.camera-active-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: var(--color-secondary);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 时间显示 */
.time-display {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--color-surface-warm);
  border-radius: var(--radius-full);
  transition: all 0.3s ease;
}

.time-display:hover {
  background: rgba(255, 107, 107, 0.08);
}

.time-icon {
  font-size: 14px;
}

.time-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

/* 中部场景区域 */
.scene-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 底部控制栏 */
.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.85) 0%, 
    rgba(255, 255, 255, 0.95) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 -2px 12px rgba(255, 107, 107, 0.08);
  z-index: 10;
  height: 72px;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 107, 107, 0.06);
}

.bottom-left,
.bottom-right {
  width: 100px;
}

.bottom-right {
  display: flex;
  justify-content: flex-end;
}

.bottom-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.gesture-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-surface-warm);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--color-text-light);
  transition: all 0.3s ease;
}

.gesture-hint.is-active {
  color: var(--color-primary);
  background: rgba(255, 107, 107, 0.08);
}

.gesture-hint.is-active .hint-icon {
  animation: wave 0.5s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  75% { transform: rotate(-15deg); }
}

.hint-icon {
  font-size: 16px;
}

.scene-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-primary-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-2xl);
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.35);
  position: relative;
  overflow: hidden;
}

.scene-toggle-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.scene-toggle-btn:hover::before {
  left: 100%;
}

.scene-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.45);
}

.scene-toggle-btn:active {
  transform: scale(0.96);
}

.btn-icon {
  font-size: 20px;
}

.btn-text {
  letter-spacing: 1px;
}

.btn-arrow {
  font-size: 18px;
  margin-left: 4px;
  transition: transform 0.3s ease;
}

.scene-toggle-btn:hover .btn-arrow {
  transform: translateX(3px);
}

.speech-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--color-surface-warm);
  font-size: 12px;
  color: var(--color-text-light);
  transition: all 0.3s ease;
}

.speech-status.is-active {
  color: var(--color-primary);
  background: rgba(255, 107, 107, 0.1);
}

.speech-status.is-active .mic-icon {
  animation: pulse 1s ease-in-out infinite;
}

.mic-icon {
  font-size: 16px;
}

/* 手势反馈气泡 */
.gesture-bubble {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: none;
}

.bubble-content {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 16px 32px;
  border-radius: var(--radius-2xl);
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.25);
  border: 2px solid var(--color-primary);
}

.bubble-icon {
  font-size: 36px;
  animation: bounce 0.5s ease-in-out infinite;
}

.bubble-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.bubble-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.particle {
  position: absolute;
  font-size: 16px;
  opacity: 0;
  animation: particleFloat 1s ease-out forwards;
}

@keyframes particleFloat {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: var(--transform) scale(0.5);
  }
}

/* 过渡动画 */
.scene-transition-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scene-transition-leave-active {
  transition: all 0.3s ease-in;
}

.scene-transition-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.scene-transition-leave-to {
  opacity: 0;
  transform: scale(1.05) translateY(-20px);
}

.bubble-transition-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-transition-leave-active {
  transition: all 0.2s ease-in;
}

.bubble-transition-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.bubble-transition-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 响应式优化 */
@media (max-width: 360px) {
  .top-bar,
  .bottom-bar {
    padding: 10px 12px;
  }
  
  .app-title {
    font-size: 18px;
  }
  
  .scene-toggle-btn {
    padding: 8px 18px;
    font-size: 14px;
  }
}
</style>
