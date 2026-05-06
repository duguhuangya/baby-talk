// 手势类型枚举
export enum GestureType {
  NONE = 'none',
  FIST = 'fist',           // 握拳 → 暂停
  OPEN_PALM = 'open_palm', // 张开手掌 → 播放
  POINTING = 'pointing',   // 食指指向 → 选择
  WAVING = 'waving',       // 挥手 → 切换
}

// 场景类型
export enum SceneType {
  ANIMAL_PARK = 'animal_park',
  FAMILY_MEMBERS = 'family_members',
}

// 动物数据
export interface Animal {
  id: string
  name: string
  emoji: string
  sound: string        // 叫声文字
  pronunciation: string // 发音文字
  color: string
}

// 家庭成员数据
export interface FamilyMember {
  id: string
  name: string
  emoji: string
  pronunciation: string
  aliases: string[]     // 别名/昵称，用于模糊匹配
  color: string
}

// 摄像头状态
export interface CameraState {
  active: boolean
  loading: boolean
  error: string | null
}

// 手势识别状态
export interface GestureState {
  currentGesture: GestureType
  confidence: number
  pointingAt: { x: number; y: number } | null
  isActive: boolean
}

// 语音识别状态
export interface SpeechState {
  isListening: boolean
  transcript: string
  confidence: number
  isSpeaking: boolean
}

// 家长面板设置
export interface ParentSettings {
  cameraEnabled: boolean
  speechEnabled: boolean
  gestureEnabled: boolean
  volume: number
  speechRate: number
}
