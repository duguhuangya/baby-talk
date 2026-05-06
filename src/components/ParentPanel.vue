<template>
  <van-popup
    v-model:show="localShow"
    position="bottom"
    :style="{ height: '70%', borderRadius: '16px 16px 0 0' }"
    round
    closeable
    close-icon="cross"
    close-icon-position="top-right"
  >
    <div class="parent-panel">
      <div class="panel-header">
        <h2>⚙️ 家长设置</h2>
        <p class="panel-desc">为宝宝调整互动设置</p>
      </div>

      <div class="panel-content">
        <!-- 摄像头开关 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-icon">📷</span>
            <div>
              <div class="setting-title">摄像头手势识别</div>
              <div class="setting-desc">通过手势控制交互</div>
            </div>
          </div>
          <van-switch
            :model-value="cameraActive"
            @update:model-value="$emit('update:camera-active', $event)"
            active-color="#4ECDC4"
            size="24px"
          />
        </div>

        <!-- 语音识别开关 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-icon">🎤</span>
            <div>
              <div class="setting-title">语音识别</div>
              <div class="setting-desc">识别宝宝的声音</div>
            </div>
          </div>
          <van-switch
            :model-value="speechEnabled"
            @update:model-value="$emit('update:speech-enabled', $event)"
            active-color="#FF6B6B"
            size="24px"
          />
        </div>

        <!-- 手势开关 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-icon">🖐️</span>
            <div>
              <div class="setting-title">手势交互</div>
              <div class="setting-desc">指向、挥手、握拳操作</div>
            </div>
          </div>
          <van-switch
            :model-value="gestureEnabled"
            @update:model-value="$emit('update:gesture-enabled', $event)"
            active-color="#FFE66D"
            size="24px"
          />
        </div>

        <!-- 使用说明 -->
        <div class="guide-section">
          <h3>📖 使用说明</h3>
          <div class="guide-list">
            <div class="guide-item">
              <span class="guide-emoji">✊</span>
              <span class="guide-text">握拳 → 暂停画面</span>
            </div>
            <div class="guide-item">
              <span class="guide-emoji">🖐️</span>
              <span class="guide-text">张开手掌 → 恢复播放</span>
            </div>
            <div class="guide-item">
              <span class="guide-emoji">👆</span>
              <span class="guide-text">食指指向 → 选择内容</span>
            </div>
            <div class="guide-item">
              <span class="guide-emoji">👋</span>
              <span class="guide-text">挥手 → 切换场景</span>
            </div>
            <div class="guide-item">
              <span class="guide-emoji">🗣️</span>
              <span class="guide-text">说出称谓 → 匹配家人</span>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="about-section">
          <div class="about-text">
            咿呀学语 v1.0.0<br />
            为1.5-3岁宝宝设计的AI互动早教产品<br />
            基于 MediaPipe + Web Speech API
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  show: boolean
  cameraActive: boolean
  speechEnabled: boolean
  gestureEnabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update:camera-active', value: boolean): void
  (e: 'update:speech-enabled', value: boolean): void
  (e: 'update:gesture-enabled', value: boolean): void
}>()

const localShow = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val),
})
</script>

<style scoped>
.parent-panel {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-header {
  text-align: center;
  margin-bottom: 24px;
  padding-top: 8px;
}

.panel-header h2 {
  font-size: 22px;
  color: #333;
  margin-bottom: 4px;
}

.panel-desc {
  font-size: 14px;
  color: #999;
}

.panel-content {
  flex: 1;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f7f7f7;
  border-radius: 12px;
  margin-bottom: 12px;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-icon {
  font-size: 28px;
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.setting-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.guide-section {
  margin-top: 20px;
}

.guide-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f7f7f7;
  border-radius: 10px;
}

.guide-emoji {
  font-size: 22px;
}

.guide-text {
  font-size: 14px;
  color: #666;
}

.about-section {
  margin-top: 24px;
  text-align: center;
}

.about-text {
  font-size: 12px;
  color: #bbb;
  line-height: 1.6;
}
</style>
