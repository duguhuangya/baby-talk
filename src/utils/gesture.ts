/**
 * 手势识别模块
 * 使用 MediaPipe Hands 进行21关键点手势识别
 * 支持：握拳、张开手掌、食指指向、挥手
 */
import type { GestureState } from '@/types'
import { GestureType } from '@/types'

// 彩虹色数组，用于骨骼绘制
const RAINBOW_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFE66D', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#DDA0DD', '#FF6B6B',
  '#FF8E53', '#FFE66D', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#DDA0DD', '#FF6B6B', '#FF8E53',
  '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD',
]

// 手部关键点连接关系
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // 拇指
  [0, 5], [5, 6], [6, 7], [7, 8],       // 食指
  [0, 9], [9, 10], [10, 11], [11, 12],  // 中指
  [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
  [0, 17], [17, 18], [18, 19], [19, 20], // 小指
  [5, 9], [9, 13], [13, 17],            // 掌骨连接
]

// 帧率控制
const TARGET_FPS = 10
const FRAME_INTERVAL = 1000 / TARGET_FPS

// 挥手检测参数
const WAVE_THRESHOLD = 0.08
const WAVE_FRAMES_NEEDED = 3

export class GestureRecognizer {
  private hands: any = null
  private camera: any = null
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private canvasCtx: CanvasRenderingContext2D | null = null
  private isActive = false
  private lastFrameTime = 0
  private onGestureCallback: ((state: GestureState) => void) | null = null
  
  // 挥手检测状态
  private wristXHistory: number[] = []
  private waveDirectionChanges = 0
  private lastWristDirection = 0

  // 静止状态追踪（避免重复触发）
  private lastGesture = GestureType.NONE
  private gestureHoldFrames = 0
  private readonly GESTURE_HOLD_THRESHOLD = 3

  /**
   * 初始化 MediaPipe Hands
   */
  async init(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
    onGesture: (state: GestureState) => void
  ): Promise<void> {
    this.videoElement = videoEl
    this.canvasElement = canvasEl
    this.canvasCtx = canvasEl.getContext('2d')!
    this.onGestureCallback = onGesture

    try {
      // 动态导入 MediaPipe Hands
      const { Hands } = await import('@mediapipe/hands')
      const { Camera } = await import('@mediapipe/camera_utils')

      this.hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        },
      } as any)

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // CPU模式，用最轻量模型
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      this.hands.onResults((results: any) => this.handleResults(results))

      // 启动摄像头
      this.camera = new Camera(this.videoElement!, {
        onFrame: async () => {
          const now = Date.now()
          if (now - this.lastFrameTime >= FRAME_INTERVAL) {
            this.lastFrameTime = now
            await this.hands.send({ image: this.videoElement! })
          }
        },
        width: 320,
        height: 240,
        facingMode: 'user',
      })

      await this.camera.start()
      this.isActive = true
    } catch (error) {
      console.error('手势识别初始化失败:', error)
      // 提供降级方案：仍然回调但标记不活跃
      this.isActive = false
      throw error
    }
  }

  /**
   * 处理 MediaPipe 返回的结果
   */
  private handleResults(results: any): void {
    if (!this.canvasCtx || !this.canvasElement) return

    const width = this.canvasElement.width
    const height = this.canvasElement.height

    // 清除画布
    this.canvasCtx.clearRect(0, 0, width, height)

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]
      
      // 绘制彩虹骨骼
      this.drawRainbowSkeleton(landmarks, width, height)
      
      // 识别手势
      const gesture = this.recognizeGesture(landmarks)
      const pointingAt = gesture === GestureType.POINTING
        ? this.getPointingPosition(landmarks, width, height)
        : null

      // 手势稳定性检测
      if (gesture === this.lastGesture) {
        this.gestureHoldFrames++
      } else {
        this.gestureHoldFrames = 1
        this.lastGesture = gesture
      }

      // 只有持续几帧才触发
      if (this.gestureHoldFrames >= this.GESTURE_HOLD_THRESHOLD) {
        this.onGestureCallback?.({
          currentGesture: gesture,
          confidence: 0.8,
          pointingAt,
          isActive: true,
        })
      }
    } else {
      // 没有检测到手
      this.wristXHistory = []
      this.waveDirectionChanges = 0
      this.onGestureCallback?.({
        currentGesture: GestureType.NONE,
        confidence: 0,
        pointingAt: null,
        isActive: true,
      })
    }
  }

  /**
   * 绘制彩虹色骨骼
   */
  private drawRainbowSkeleton(landmarks: any[], width: number, height: number): void {
    if (!this.canvasCtx) return
    const ctx = this.canvasCtx

    // 绘制连接线
    HAND_CONNECTIONS.forEach(([start, end], index) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]
      
      ctx.beginPath()
      ctx.moveTo(startPoint.x * width, startPoint.y * height)
      ctx.lineTo(endPoint.x * width, endPoint.y * height)
      ctx.strokeStyle = RAINBOW_COLORS[index % RAINBOW_COLORS.length]
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.stroke()
    })

    // 绘制关键点
    landmarks.forEach((point: any, index: number) => {
      ctx.beginPath()
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI)
      ctx.fillStyle = RAINBOW_COLORS[index % RAINBOW_COLORS.length]
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  }

  /**
   * 手势识别核心逻辑
   */
  private recognizeGesture(landmarks: any[]): GestureType {
    // 获取各手指状态（是否伸展）
    const fingerStates = this.getFingerStates(landmarks)
    
    // 检测挥手（优先级最高）
    if (this.detectWave(landmarks)) {
      return GestureType.WAVING
    }
    
    // 检测握拳：所有手指弯曲
    const extendedCount = fingerStates.filter(Boolean).length
    if (extendedCount <= 1 && !fingerStates[1]) {
      return GestureType.FIST
    }
    
    // 检测食指指向：只有食指伸展
    if (fingerStates[1] && !fingerStates[2] && !fingerStates[3] && !fingerStates[4]) {
      return GestureType.POINTING
    }
    
    // 检测张开手掌：所有手指伸展
    if (extendedCount >= 4) {
      return GestureType.OPEN_PALM
    }

    return GestureType.NONE
  }

  /**
   * 获取各手指伸展状态
   * 返回 [拇指, 食指, 中指, 无名指, 小指] 的伸展状态
   */
  private getFingerStates(landmarks: any[]): boolean[] {
    // 拇指：比较x方向距离（需要考虑左右手）
    const thumbExtended = 
      Math.abs(landmarks[4].x - landmarks[3].x) > 0.04 ||
      Math.abs(landmarks[4].y - landmarks[3].y) > 0.04
    
    // 其他手指：比较y坐标（指尖低于PIP关节即为伸展）
    const indexExtended = landmarks[8].y < landmarks[6].y
    const middleExtended = landmarks[12].y < landmarks[10].y
    const ringExtended = landmarks[16].y < landmarks[14].y
    const pinkyExtended = landmarks[20].y < landmarks[18].y

    return [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended]
  }

  /**
   * 挥手检测：追踪手腕在x方向的运动
   */
  private detectWave(landmarks: any[]): boolean {
    const wristX = landmarks[0].x
    
    if (this.wristXHistory.length > 0) {
      const lastX = this.wristXHistory[this.wristXHistory.length - 1]
      const delta = wristX - lastX
      const direction = delta > 0 ? 1 : delta < 0 ? -1 : 0

      if (direction !== 0 && direction !== this.lastWristDirection) {
        if (Math.abs(delta) > WAVE_THRESHOLD * 0.5) {
          this.waveDirectionChanges++
          this.lastWristDirection = direction
        }
      }
    }

    this.wristXHistory.push(wristX)
    
    // 只保留最近的帧
    if (this.wristXHistory.length > 15) {
      this.wristXHistory.shift()
    }

    // 检测到足够多的方向变化
    if (this.waveDirectionChanges >= WAVE_FRAMES_NEEDED) {
      this.waveDirectionChanges = 0
      this.wristXHistory = []
      return true
    }

    // 超时重置
    if (this.wristXHistory.length >= 15) {
      this.waveDirectionChanges = 0
    }

    return false
  }

  /**
   * 获取食指指向位置（屏幕坐标）
   */
  private getPointingPosition(
    landmarks: any[],
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number } {
    // 使用食指指尖的位置
    const tipX = landmarks[8].x
    const tipY = landmarks[8].y

    return {
      x: tipX,
      y: tipY,
    }
  }

  /**
   * 停止识别
   */
  stop(): void {
    this.isActive = false
    if (this.camera) {
      this.camera.stop()
    }
    if (this.hands) {
      this.hands.close()
    }
  }

  /**
   * 获取活跃状态
   */
  getIsActive(): boolean {
    return this.isActive
  }
}
