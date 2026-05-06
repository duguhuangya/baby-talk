<template>
  <div class="camera-preview">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="preview-canvas"
    ></canvas>
    <div v-if="!active" class="camera-placeholder">
      <span>📷</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { GestureRecognizer } from '@/utils/gesture'
import { GestureType } from '@/types'
import type { GestureState } from '@/types'

const props = defineProps<{
  canvasWidth: number
  canvasHeight: number
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'gesture', state: GestureState): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

// 当 active 变化时，显示提示
watch(
  () => props.active,
  (active) => {
    if (active && canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#4ECDC4'
        ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('摄像头已开启', props.canvasWidth / 2, props.canvasHeight / 2 + 4)
      }
    }
  }
)

onMounted(() => {
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#eee'
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
  border-radius: 4px;
  overflow: hidden;
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
  background: #ddd;
}
</style>
