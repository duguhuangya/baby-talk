<template>
  <div class="animal-park">
    <!-- 背景装饰 -->
    <div class="park-bg-decorations">
      <span v-for="n in 5" :key="n" class="floating-leaf" :style="leafStyle(n)">🍃</span>
    </div>

    <!-- 选中动物的详情展示 -->
    <transition name="detail-pop">
      <div v-if="selectedAnimal" class="animal-detail-overlay" @click="selectedAnimal = null">
        <div class="animal-detail-card">
          <div class="detail-glow"></div>
          <div class="detail-content">
            <div class="detail-emoji-wrapper">
              <div class="detail-emoji">{{ selectedAnimal.emoji }}</div>
              <div class="emoji-ring"></div>
            </div>
            <div class="detail-name">{{ selectedAnimal.name }}</div>
            <div class="detail-sound">
              <span class="sound-icon">🔊</span>
              {{ selectedAnimal.sound }}
            </div>
            <div class="detail-pronunciation">
              <span class="pronunciation-icon">🎯</span>
              跟我读：{{ selectedAnimal.pronunciation }}
            </div>
          </div>
          <div class="ripple-effects">
            <div class="ripple-effect" v-for="n in 3" :key="n" :style="{ animationDelay: n * 0.4 + 's' }"></div>
          </div>
          <div class="sparkles">
            <span v-for="n in 8" :key="n" class="sparkle" :style="sparkleStyle(n)">✨</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 动物网格 -->
    <div class="animal-grid">
      <div
        v-for="(animal, index) in animals"
        :key="animal.id"
        class="animal-card"
        :class="{
          'is-pointed': pointedAnimalId === animal.id,
          'is-selected': selectedAnimal?.id === animal.id,
          'tv-focused': currentIndex === index,
        }"
        :style="{
          animationDelay: index * 0.08 + 's',
          '--card-color': animal.color,
        }"
        @click="selectAnimal(animal)"
        @touchstart="selectAnimal(animal)"
      >
        <div class="card-glow"></div>
        <div class="card-content">
          <div class="animal-emoji">{{ animal.emoji }}</div>
          <div class="animal-name">{{ animal.name }}</div>
          <div class="animal-sound-hint">{{ animal.sound }}</div>
        </div>
        <div class="card-shine"></div>
        <!-- 指向动画指示器 -->
        <div class="point-indicator" v-if="pointedAnimalId === animal.id">
          <div class="point-ring"></div>
          <div class="point-ring delay"></div>
        </div>
      </div>
    </div>

    <!-- 场景提示 -->
    <div class="scene-hint animate-float">
      <span class="hint-icon">👆</span>
      <span>指向动物 或 点击它</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { GestureType } from '@/types'
import type { GestureState, Animal } from '@/types'

const props = defineProps<{
  gestureState: GestureState
  currentIndex?: number
}>()

const emit = defineEmits<{
  (e: 'animal-selected', animal: Animal): void
}>()

// 动物数据
const animals: Animal[] = [
  { id: 'cat', name: '小猫', emoji: '🐱', sound: '喵喵喵~', pronunciation: '小猫', color: '#FF6B6B' },
  { id: 'dog', name: '小狗', emoji: '🐶', sound: '汪汪汪~', pronunciation: '小狗', color: '#4ECDC4' },
  { id: 'chicken', name: '小鸡', emoji: '🐔', sound: '叽叽叽~', pronunciation: '小鸡', color: '#FFE66D' },
  { id: 'duck', name: '小鸭', emoji: '🦆', sound: '嘎嘎嘎~', pronunciation: '小鸭', color: '#45B7D1' },
  { id: 'pig', name: '小猪', emoji: '🐷', sound: '哼哼哼~', pronunciation: '小猪', color: '#96CEB4' },
  { id: 'rabbit', name: '小兔', emoji: '🐰', sound: '蹦蹦蹦~', pronunciation: '小兔', color: '#DDA0DD' },
]

const selectedAnimal = ref<Animal | null>(null)
const pointedAnimalId = ref<string | null>(null)

// 根据手势指向位置确定指向的动物
const pointedAnimal = computed(() => {
  return animals.find((a) => a.id === pointedAnimalId.value) || null
})

// 叶子飘落样式
function leafStyle(n: number) {
  const positions = [
    { left: '5%', top: '10%', delay: '0s' },
    { left: '85%', top: '15%', delay: '0.5s' },
    { left: '15%', top: '70%', delay: '1s' },
    { left: '75%', top: '60%', delay: '1.5s' },
    { left: '45%', top: '85%', delay: '2s' },
  ]
  return {
    left: positions[n - 1].left,
    top: positions[n - 1].top,
    animationDelay: positions[n - 1].delay,
  }
}

// 星星样式
function sparkleStyle(n: number) {
  const angle = (n * 45) * (Math.PI / 180)
  const distance = 80 + Math.random() * 40
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    animationDelay: `${n * 0.05}s`,
  }
}

// 监听手势变化
watch(
  () => props.gestureState,
  (state) => {
    if (state.currentGesture === GestureType.POINTING && state.pointingAt) {
      const x = state.pointingAt.x
      const y = state.pointingAt.y

      const col = Math.floor(x * 3)
      const row = Math.floor(y * 2)
      const index = row * 3 + col

      if (index >= 0 && index < animals.length) {
        pointedAnimalId.value = animals[index].id

        setTimeout(() => {
          if (pointedAnimalId.value === animals[index].id) {
            selectAnimal(animals[index])
          }
        }, 1500)
      }
    } else {
      pointedAnimalId.value = null
    }
  },
  { deep: true }
)

// 选择动物
function selectAnimal(animal: Animal) {
  if (selectedAnimal.value?.id === animal.id) return
  selectedAnimal.value = animal
  emit('animal-selected', animal)

  setTimeout(() => {
    if (selectedAnimal.value?.id === animal.id) {
      selectedAnimal.value = null
    }
  }, 4000)
}

defineExpose({
  selectByIndex: (index: number) => {
    if (index >= 0 && index < animals.length) {
      selectAnimal(animals[index])
    }
  }
})
</script>

<style scoped>
.animal-park {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
  background: linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%);
  overflow: hidden;
}

/* 背景装饰 */
.park-bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.floating-leaf {
  position: absolute;
  font-size: 24px;
  opacity: 0.6;
  animation: floatLeaf 6s ease-in-out infinite;
}

@keyframes floatLeaf {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-15px) rotate(10deg);
    opacity: 0.8;
  }
}

/* 动物网格 */
.animal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 500px;
  padding: 0 8px;
  position: relative;
  z-index: 1;
}

/* 动物卡片 */
.animal-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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

.animal-card::before {
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

.animal-card:hover::before {
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
  background: radial-gradient(circle at center, var(--card-color) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.animal-card:hover .card-glow {
  opacity: 0.1;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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

.animal-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.animal-card:active {
  transform: scale(0.96);
}

.animal-card.is-pointed {
  border-color: var(--color-primary);
  transform: scale(1.08);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.35);
}

.animal-card.is-selected {
  border-color: var(--color-accent);
  transform: scale(1.12);
  box-shadow: 0 12px 32px rgba(255, 230, 109, 0.5);
}

.point-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  pointer-events: none;
}

.point-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: pointPulse 1s ease-out infinite;
}

.point-ring.delay {
  animation-delay: 0.5s;
}

@keyframes pointPulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animal-emoji {
  font-size: 52px;
  line-height: 1;
  transition: transform 0.3s ease;
}

.animal-card:hover .animal-emoji {
  transform: scale(1.1);
}

.animal-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.animal-sound-hint {
  font-size: 13px;
  color: var(--color-text-light);
  padding: 4px 10px;
  background: var(--color-background);
  border-radius: var(--radius-full);
}

/* 详情浮层 */
.animal-detail-overlay {
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

.animal-detail-card {
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

.detail-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(circle at center, rgba(255, 230, 109, 0.3) 0%, transparent 70%);
  border-radius: var(--radius-2xl);
  z-index: -1;
}

.detail-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.detail-emoji-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.detail-emoji {
  font-size: 100px;
  line-height: 1;
  animation: bounce 0.6s ease-in-out infinite;
}

.emoji-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin-left: -60px;
  margin-top: -60px;
  border: 3px solid var(--color-accent);
  border-radius: 50%;
  animation: ringPulse 1.5s ease-out infinite;
}

@keyframes ringPulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.detail-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 4px;
}

.detail-sound {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  color: var(--color-secondary);
  font-weight: 600;
  padding: 8px 20px;
  background: rgba(78, 205, 196, 0.1);
  border-radius: var(--radius-xl);
}

.sound-icon {
  font-size: 20px;
}

.detail-pronunciation {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--color-text-light);
  padding: 10px 20px;
  background: var(--color-background);
  border-radius: var(--radius-xl);
}

.pronunciation-icon {
  font-size: 16px;
}

.ripple-effects {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  margin-left: -50px;
  margin-top: -50px;
  pointer-events: none;
}

.ripple-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: rippleOut 2s ease-out infinite;
}

@keyframes rippleOut {
  0% {
    transform: scale(0.3);
    opacity: 0.8;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

.sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 20px;
  opacity: 0;
  animation: sparkleOut 1s ease-out forwards;
}

@keyframes sparkleOut {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: var(--transform) scale(0.3) rotate(180deg);
  }
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
  animation: point 1s ease-in-out infinite;
}

@keyframes point {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* 过渡动画 */
.detail-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.detail-pop-leave-active {
  transition: all 0.25s ease-in;
}

.detail-pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.detail-pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 响应式 */
@media (max-width: 480px) {
  .animal-grid {
    gap: 12px;
  }
  
  .animal-card {
    padding: 16px 8px;
    min-height: 120px;
  }
  
  .animal-emoji {
    font-size: 44px;
  }
  
  .animal-name {
    font-size: 16px;
  }
  
  .animal-detail-card {
    padding: 32px 40px;
    margin: 16px;
  }
  
  .detail-emoji {
    font-size: 80px;
  }
  
  .detail-name {
    font-size: 26px;
  }
}
</style>
