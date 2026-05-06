<template>
  <div class="app-container">
    <!-- 隐藏的视频元素（摄像头输入源） -->
    <video ref="videoRef" class="hidden-video" playsinline autoplay muted></video>

    <!-- 顶部状态栏 -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="camera-mini" @click="toggleParentPanel">
          <CameraPreview
            :canvas-width="48"
            :canvas-height="36"
            :active="cameraActive"
          />
          <div v-if="!cameraActive" class="camera-off-icon">📷</div>
        </div>
      </div>
      <div class="top-bar-center">
        <span class="app-title">👶 咿呀学语</span>
      </div>
      <div class="top-bar-right">
        <span class="time-display">{{ currentTime }}</span>
      </div>
    </header>

    <!-- 中部场景区域 -->
    <main class="scene-area">
      <transition name="scene-fade" mode="out-in">
        <AnimalPark
          v-if="currentScene === SceneType.ANIMAL_PARK"
          :gesture-state="gestureState"
          @animal-selected="handleAnimalSelected"
        />
        <FamilyMembers
          v-else
          :speech-enabled="speechEnabled"
          @member-matched="handleMemberMatched"
        />
      </transition>
    </main>

    <!-- 底部控制栏 -->
    <footer class="bottom-bar">
      <div class="bottom-left">
        <div class="scene-switch-hint">
          <span class="hint-icon">👋</span>
          <span class="hint-text">挥手切换场景</span>
        </div>
      </div>
      <div class="bottom-center">
        <button class="scene-toggle-btn" @click="switchScene">
          {{ currentScene === SceneType.ANIMAL_PARK ? '🐱 动物乐园' : '👨‍👩‍👧 家庭成员' }}
        </button>
      </div>
      <div class="bottom-right">
        <div class="speech-status" :class="{ active: speechState.isListening }">
          <span class="mic-icon">{{ speechState.isListening ? '🎤' : '🔇' }}</span>
          <span class="status-text">{{ speechState.isListening ? '正在听' : '语音关闭' }}</span>
        </div>
      </div>
    </footer>

    <!-- 手势反馈气泡 -->
    <transition name="bubble-fade">
      <div v-if="gestureFeedback" class="gesture-bubble">
        <span>{{ gestureFeedback }}</span>
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
const gestureFeedback = ref('')

// 模块实例
let gestureRecognizer: GestureRecognizer | null = null
let speechManager: SpeechManager | null = null
let timeTimer: ReturnType<typeof setInterval> | null = null

// 切换场景
function switchScene() {
  currentScene.value =
    currentScene.value === SceneType.ANIMAL_PARK
      ? SceneType.FAMILY_MEMBERS
      : SceneType.ANIMAL_PARK
}

// 显示手势反馈
function showGestureFeedback(text: string) {
  gestureFeedback.value = text
  setTimeout(() => {
    gestureFeedback.value = ''
  }, 1500)
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
      showGestureFeedback('✊ 暂停')
      break
    case GestureType.OPEN_PALM:
      showGestureFeedback('🖐️ 播放')
      break
    case GestureType.WAVING:
      switchScene()
      showGestureFeedback('👋 切换场景!')
      break
    case GestureType.POINTING:
      // 由场景组件处理
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
      await gestureRecognizer.init(
        videoRef.value,
        document.querySelector('canvas')!,
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
  // 初始化语音
  speechManager = new SpeechManager()
  speechManager.init(handleSpeechResult, handleSpeechStateChange)
  
  if (speechEnabled.value) {
    speechManager.startListening()
  }

  // 初始化时间
  updateTime()
  timeTimer = setInterval(updateTime, 30000)

  // 3秒后自动启动摄像头
  setTimeout(() => {
    cameraActive.value = true
  }, 1000)
})

onUnmounted(() => {
  gestureRecognizer?.stop()
  speechManager?.destroy()
  if (timeTimer) clearInterval(timeTimer)
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

/* 顶部状态栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--color-white);
  box-shadow: 0 2px 8px var(--color-shadow);
  z-index: 10;
  height: 56px;
  flex-shrink: 0;
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

.app-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.camera-mini {
  position: relative;
  width: 48px;
  height: 36px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--color-secondary);
  background: #eee;
}

.camera-off-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: rgba(0,0,0,0.3);
}

.time-display {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  font-weight: 500;
}

/* 中部场景区域 */
.scene-area {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 底部控制栏 */
.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--color-white);
  box-shadow: 0 -2px 8px var(--color-shadow);
  z-index: 10;
  height: 56px;
  flex-shrink: 0;
}

.bottom-left,
.bottom-right {
  width: 120px;
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

.scene-switch-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}

.hint-icon {
  font-size: 16px;
}

.scene-toggle-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: var(--radius-xl);
  padding: 8px 20px;
  font-size: var(--font-size-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.scene-toggle-btn:active {
  transform: scale(0.95);
}

.speech-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-background);
}

.speech-status.active {
  color: var(--color-primary);
  background: rgba(255, 107, 107, 0.1);
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
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 16px 32px;
  border-radius: var(--radius-xl);
  font-size: var(--font-size-lg);
  font-weight: 600;
  z-index: 100;
  pointer-events: none;
}

/* 过渡动画 */
.scene-fade-enter-active,
.scene-fade-leave-active {
  transition: all 0.3s ease;
}
.scene-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.scene-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: all 0.3s ease;
}
.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}
</style>
