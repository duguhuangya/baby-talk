/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// MediaPipe types
declare module '@mediapipe/hands' {
  export interface HandLandmark {
    x: number
    y: number
    z: number
  }
  export interface NormalizedLandmark {
    x: number
    y: number
    z: number
    visibility?: number
  }
  export interface LandmarkConnection {
    start: number
    end: number
  }
  export interface Results {
    multiHandLandmarks: NormalizedLandmark[][]
    multiHandWorldLandmarks: HandLandmark[][]
    multiHandedness: Array<{
      index: number
      score: number
      label: string
    }>
  }
  export interface HandsConfig {
    maxNumHands?: number
    modelComplexity?: number
    minDetectionConfidence?: number
    minTrackingConfidence?: number
  }
  export class Hands {
    constructor(config?: HandsConfig)
    setOptions(options: HandsConfig): void
    onResults(callback: (results: Results) => void): void
    send(inputs: { image: HTMLVideoElement | HTMLCanvasElement | ImageData }): Promise<void>
    close(): void
    initialize(): Promise<void>
  }
  export const HAND_CONNECTIONS: LandmarkConnection[]
}

declare module '@mediapipe/camera_utils' {
  export interface CameraOptions {
    onFrame: () => Promise<void>
    width?: number
    height?: number
    facingMode?: string
  }
  export class Camera {
    constructor(videoElement: HTMLVideoElement, options: CameraOptions)
    start(): Promise<void>
    stop(): void
  }
}

declare module '@mediapipe/drawing_utils' {
  import type { NormalizedLandmark, LandmarkConnection } from '@mediapipe/hands'
  export function drawConnectors(
    canvas: HTMLCanvasElement,
    landmarks: NormalizedLandmark[],
    connections: LandmarkConnection[],
    style?: { color?: string; lineWidth?: number }
  ): void
  export function drawLandmarks(
    canvas: HTMLCanvasElement,
    landmarks: NormalizedLandmark[],
    style?: { color?: string; lineWidth?: number; radius?: number }
  ): void
}

// Web Speech API extensions
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  readonly isFinal: boolean
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare var SpeechRecognition: SpeechRecognitionConstructor
declare var webkitSpeechRecognition: SpeechRecognitionConstructor
