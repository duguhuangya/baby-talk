<template>
  <div class="animal-park">
    <!-- 选中动物的详情展示 -->
    <transition name="detail-fade">
      <div v-if="selectedAnimal" class="animal-detail-overlay" @click="selectedAnimal = null">
        <div class="animal-detail-card animate-bounce-large">
          <div class="detail-emoji">{{ selectedAnimal.emoji }}</div>
          <div class="detail-name">{{ selectedAnimal.name }}</div>
          <div class="detail-sound">{{ selectedAnimal.sound }}</div>
          <div class="detail-pronunciation">跟我读：{{ selectedAnimal.pronunciation }}</div>
          <div class="ripple-effect" v-for="n in 3" :key="n" :style="{ animationDelay: n * 0.3 + 's' }"></div>
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
        }"
        :style="{
          animationDelay: index * 0.1 + 's',
          '--card-color': animal.color,
        }"
        @click="selectAnimal(animal)"
        @touchstart="selectAnimal(animal)"
      >
        <div class="animal-emoji">{{ animal.emoji }}</div>
        <div class="animal-name">{{ animal.name }}</div>
        <div class="animal-sound-hint">{{ animal.sound }}</div>
      </div>
    </div>

    <!-- 场景提示 -->
    <div class="scene-hint animate-float">
      <span>👆 指向动物 或 点击它</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { GestureType } from '@/types'
import type { GestureState, Animal } from '@/types'

const props = defineProps<{
  gestureState: GestureState
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

// 监听手势变化
watch(
  () => props.gestureState,
  (state) => {
    if (state.currentGesture === GestureType.POINTING && state.pointingAt) {
      // 将手势坐标映射到网格位置
      const x = state.pointingAt.x
      const y = state.pointingAt.y

      // 简单网格映射：3列2行
      const col = Math.floor(x * 3)
      const row = Math.floor(y * 2)
      const index = row * 3 + col

      if (index >= 0 && index < animals.length) {
        pointedAnimalId.value = animals[index].id

        // 指向1.5秒后自动选择
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

  // 3秒后自动关闭详情
  setTimeout(() => {
    if (selectedAnimal.value?.id === animal.id) {
      selectedAnimal.value = null
    }
  }, 4000)
}
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
}

/* 动物网格 */
.animal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 500px;
  padding: 0 8px;
}

/* 动物卡片 */
.animal-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 3px solid transparent;
  animation: fadeIn 0.5s ease-out both;
  min-height: 130px;
  justify-content: center;
}

.animal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--color-shadow);
}

.animal-card:active {
  transform: scale(0.95);
}

.animal-card.is-pointed {
  border-color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
}

.animal-card.is-selected {
  border-color: var(--color-accent);
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(255, 230, 109, 0.5);
}

.animal-emoji {
  font-size: 48px;
  line-height: 1;
}

.animal-name {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.animal-sound-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}

/* 详情浮层 */
.animal-detail-overlay {
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

.animal-detail-card {
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

.detail-emoji {
  font-size: 96px;
  line-height: 1;
}

.detail-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}

.detail-sound {
  font-size: var(--font-size-lg);
  color: var(--color-secondary);
  font-weight: 600;
}

.detail-pronunciation {
  font-size: var(--font-size-md);
  color: var(--color-text-light);
  padding: 8px 16px;
  background: var(--color-background);
  border-radius: var(--radius-md);
}

.ripple-effect {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid var(--color-primary);
  top: 50%;
  left: 50%;
  margin-top: -50px;
  margin-left: -50px;
  animation: ripple 2s ease-out infinite;
  pointer-events: none;
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

/* 过渡动画 */
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: all 0.3s ease;
}
.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
}
</style>
