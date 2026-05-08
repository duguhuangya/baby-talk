<template>
  <div class="camera-preview" :class="{ 'is-active': active }">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="preview-canvas"
    ></canvas>
    <transition name="fade">
      <div v-if="!active" class="camera-placeholder">
        <span class="placeholder-icon">📷</span>
        <div class="placeholder-rings">
          <div class="ring"></div>
          <div class="ring delay"></div>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="active" class="camera-active-badge">
        <div class="badge-dot"></div>
        <span class="badge-text">手势识别中</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  canvasWidth: number
  canvasHeight: number
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'gesture', state: any): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

watch(
  () => props.active,
  (active) => {
    if (active && canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d')
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, props.canvasWidth, props.canvasHeight)
        gradient.addColorStop(0, '#4ECDC4')
        gradient.addColorStop(1, '#45B7D1')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
        
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 8px -apple-system, BlinkMacSystemFont, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('手势识别中', props.canvasWidth / 2, props.canvasHeight / 2)
      }
    }
  }
)

onMounted(() => {
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#F0F0F0'
      ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
    }
  }
})
</script>

<style scoped>
.camera-preview {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #F0F0F0;
  transition: all 0.3s ease;
}

.camera-preview.is-active {
  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.5);
}

.preview-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.camera-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%);
}

.placeholder-icon {
  font-size: 16px;
  z-index: 1;
}

.placeholder-rings {
  position: absolute;
  width: 40px;
  height: 40px;
}

.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  margin-top: -15px;
  border: 2px solid rgba(78, 205, 196, 0.3);
  border-radius: 50%;
  animation: ringPulse 2s ease-out infinite;
}

.ring.delay {
  animation-delay: 1s;
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

.camera-active-badge {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(78, 205, 196, 0.9);
  border-radius: 10px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #FFFFFF;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.badge-text {
  font-size: 8px;
  color: #FFFFFF;
  font-weight: 600;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
