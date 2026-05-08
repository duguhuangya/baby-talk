<template>
  <van-popup
    v-model:show="localShow"
    position="bottom"
    :style="{ height: '75%', borderRadius: '24px 24px 0 0' }"
    round
    closeable
    close-icon="cross"
    close-icon-position="top-right"
    close-icon-size="24px"
  >
    <div class="parent-panel">
      <div class="panel-header">
        <div class="header-icon">⚙️</div>
        <h2 class="header-title">家长设置</h2>
        <p class="panel-desc">为宝宝调整互动设置</p>
      </div>

      <div class="panel-content">
        <!-- 功能开关区 -->
        <div class="settings-section">
          <h3 class="section-title">
            <span class="section-icon">🎮</span>
            互动功能
          </h3>
          
          <!-- 摄像头开关 -->
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-wrapper camera">
                <span class="setting-icon">📷</span>
              </div>
              <div class="setting-text">
                <div class="setting-title">摄像头手势识别</div>
                <div class="setting-desc">通过手势控制交互</div>
              </div>
            </div>
            <van-switch
              :model-value="cameraActive"
              @update:model-value="$emit('update:camera-active', $event)"
              active-color="#4ECDC4"
              inactive-color="#E0E0E0"
              size="22px"
              loading
            />
          </div>

          <!-- 语音识别开关 -->
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-wrapper speech">
                <span class="setting-icon">🎤</span>
              </div>
              <div class="setting-text">
                <div class="setting-title">语音识别</div>
                <div class="setting-desc">识别宝宝的声音</div>
              </div>
            </div>
            <van-switch
              :model-value="speechEnabled"
              @update:model-value="$emit('update:speech-enabled', $event)"
              active-color="#FF6B6B"
              inactive-color="#E0E0E0"
              size="22px"
              loading
            />
          </div>

          <!-- 手势交互开关 -->
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-wrapper gesture">
                <span class="setting-icon">🖐️</span>
              </div>
              <div class="setting-text">
                <div class="setting-title">手势交互</div>
                <div class="setting-desc">指向、挥手、握拳操作</div>
              </div>
            </div>
            <van-switch
              :model-value="gestureEnabled"
              @update:model-value="$emit('update:gesture-enabled', $event)"
              active-color="#FFE66D"
              inactive-color="#E0E0E0"
              size="22px"
              loading
            />
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="guide-section">
          <h3 class="section-title">
            <span class="section-icon">📖</span>
            手势教程
          </h3>
          <div class="guide-list">
            <div class="guide-item">
              <div class="guide-visual">
                <span class="guide-emoji">✊</span>
              </div>
              <div class="guide-content">
                <div class="guide-name">握拳</div>
                <div class="guide-desc">暂停当前画面</div>
              </div>
            </div>
            <div class="guide-item">
              <div class="guide-visual">
                <span class="guide-emoji">🖐️</span>
              </div>
              <div class="guide-content">
                <div class="guide-name">张开手掌</div>
                <div class="guide-desc">恢复播放</div>
              </div>
            </div>
            <div class="guide-item">
              <div class="guide-visual">
                <span class="guide-emoji">👆</span>
              </div>
              <div class="guide-content">
                <div class="guide-name">食指指向</div>
                <div class="guide-desc">选择内容</div>
              </div>
            </div>
            <div class="guide-item">
              <div class="guide-visual">
                <span class="guide-emoji">👋</span>
              </div>
              <div class="guide-content">
                <div class="guide-name">挥手</div>
                <div class="guide-desc">切换场景</div>
              </div>
            </div>
            <div class="guide-item">
              <div class="guide-visual">
                <span class="guide-emoji">🗣️</span>
              </div>
              <div class="guide-content">
                <div class="guide-name">说出称谓</div>
                <div class="guide-desc">匹配家人</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="about-section">
          <div class="about-card">
            <div class="about-icon">👶</div>
            <div class="about-text">
              <div class="about-title">咿呀学语 v1.0.0</div>
              <div class="about-desc">为1.5-3岁宝宝设计的AI互动早教产品</div>
              <div class="about-tech">基于 MediaPipe + Web Speech API</div>
            </div>
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
  padding: 24px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF9F0 100%);
}

.panel-header {
  text-align: center;
  margin-bottom: 28px;
  padding-top: 8px;
}

.header-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: bounce 2s ease-in-out infinite;
}

.header-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.panel-desc {
  font-size: 14px;
  color: var(--color-text-light);
}

.panel-content {
  flex: 1;
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
  padding-left: 4px;
}

.section-icon {
  font-size: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-white);
  border-radius: var(--radius-xl);
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.setting-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.setting-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.3s ease;
}

.setting-icon-wrapper.camera {
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.15) 0%, rgba(78, 205, 196, 0.05) 100%);
}

.setting-icon-wrapper.speech {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.05) 100%);
}

.setting-icon-wrapper.gesture {
  background: linear-gradient(135deg, rgba(255, 230, 109, 0.15) 0%, rgba(255, 230, 109, 0.05) 100%);
}

.setting-item:hover .setting-icon-wrapper {
  transform: scale(1.1);
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.setting-desc {
  font-size: 13px;
  color: var(--color-text-light);
}

.guide-section {
  margin-top: 8px;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.guide-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.guide-visual {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--color-background) 0%, rgba(255, 230, 109, 0.1) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-emoji {
  font-size: 26px;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.guide-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.guide-desc {
  font-size: 13px;
  color: var(--color-text-light);
}

.about-section {
  margin-top: 28px;
  padding-bottom: 20px;
}

.about-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 230, 109, 0.08) 100%);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 107, 107, 0.1);
}

.about-icon {
  font-size: 48px;
  animation: bounce 2s ease-in-out infinite;
}

.about-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.about-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
}

.about-desc {
  font-size: 13px;
  color: var(--color-text);
}

.about-tech {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 4px;
}
</style>
