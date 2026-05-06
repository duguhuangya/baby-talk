/**
 * 语音交互模块
 * 使用 Web Speech API 实现 SpeechRecognition + SpeechSynthesis
 * 支持中文识别，模糊匹配宝宝不标准的发音
 */
import type { SpeechState } from '@/types'

// 家庭成员关键词映射（含模糊匹配）
const FAMILY_KEYWORDS: Record<string, string[]> = {
  '爸爸': ['爸爸', 'baba', '粑粑', '叭叭', '吧吧', '发发', '怕怕', '啪啪', '打打', '拔拔', '八八'],
  '妈妈': ['妈妈', 'mama', '嘛嘛', '马马', '骂骂', '嬷嬷', '麻麻', '蚂蚂'],
  '爷爷': ['爷爷', 'yeye', '耶耶', '椰椰', '业业', '夜夜', '呀呀'],
  '奶奶': ['奶奶', 'nainai', '乃乃', '奈奈', '耐耐', '呐呐'],
  '姐姐': ['姐姐', 'jiejie', '杰杰', '解解', '洁洁', '借借', '界界'],
  '妹妹': ['妹妹', 'meimei', '梅梅', '美美', '没没', '媚媚', '媒媒'],
}

// 鼓励语句
const ENCOURAGEMENTS = [
  '真棒！',
  '说得真好！',
  '宝宝好厉害！',
  '太棒了，再说一个！',
  '真聪明！',
  '宝宝真棒！',
  '对啦！',
  '好厉害呀！',
]

export class SpeechManager {
  private recognition: any = null
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private isSpeaking = false
  private onResultCallback: ((text: string, matchedKeyword: string | null) => void) | null = null
  private onStateChangeCallback: ((state: SpeechState) => void) | null = null
  private restartTimer: ReturnType<typeof setTimeout> | null = null
  private enabled = true

  /**
   * 初始化语音管理器
   */
  init(
    onResult: (text: string, matchedKeyword: string | null) => void,
    onStateChange: (state: SpeechState) => void
  ): void {
    this.onResultCallback = onResult
    this.onStateChangeCallback = onStateChange

    // 初始化语音合成
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
    }

    // 初始化语音识别
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'zh-CN'
      this.recognition.maxAlternatives = 3

      this.recognition.onresult = (event: any) => {
        this.handleRecognitionResult(event)
      }

      this.recognition.onerror = (event: any) => {
        console.warn('语音识别错误:', event.error)
        if (event.error === 'not-allowed') {
          this.updateState({ isListening: false })
        }
      }

      this.recognition.onend = () => {
        // 自动重启（连续模式）
        if (this.isListening && this.enabled) {
          this.scheduleRestart()
        }
      }

      this.recognition.onstart = () => {
        this.updateState({ isListening: true })
      }
    }
  }

  /**
   * 处理识别结果
   */
  private handleRecognitionResult(event: any): void {
    if (!this.enabled) return

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      
      // 获取所有候选结果
      const transcripts: string[] = []
      for (let j = 0; j < result.length; j++) {
        const transcript = result[j].transcript.trim().toLowerCase()
        if (transcript) {
          transcripts.push(transcript)
        }
      }

      // 尝试模糊匹配
      const matchedKeyword = this.fuzzyMatch(transcripts)
      
      if (result.isFinal) {
        const finalText = transcripts[0] || ''
        this.onResultCallback?.(finalText, matchedKeyword)
        this.updateState({
          transcript: finalText,
          confidence: result[0]?.confidence || 0,
        })
      }
    }
  }

  /**
   * 模糊匹配：在候选结果中查找最接近的关键词
   */
  private fuzzyMatch(transcripts: string[]): string | null {
    for (const text of transcripts) {
      for (const [keyword, aliases] of Object.entries(FAMILY_KEYWORDS)) {
        for (const alias of aliases) {
          if (text.includes(alias) || this.similarity(text, alias) > 0.6) {
            return keyword
          }
        }
      }
    }
    return null
  }

  /**
   * 计算两个字符串的相似度（简单的Levenshtein距离方法）
   */
  private similarity(s1: string, s2: string): number {
    if (s1 === s2) return 1
    if (s1.length === 0 || s2.length === 0) return 0

    const len1 = s1.length
    const len2 = s2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    const maxLen = Math.max(len1, len2)
    return 1 - matrix[len1][len2] / maxLen
  }

  /**
   * 开始语音识别
   */
  startListening(): void {
    if (!this.recognition || this.isListening) return
    try {
      this.isListening = true
      this.enabled = true
      this.recognition.start()
    } catch (e) {
      console.warn('启动语音识别失败:', e)
    }
  }

  /**
   * 停止语音识别
   */
  stopListening(): void {
    if (!this.recognition) return
    this.isListening = false
    this.enabled = false
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
    try {
      this.recognition.stop()
    } catch (e) {
      // ignore
    }
    this.updateState({ isListening: false })
  }

  /**
   * 安排重启语音识别
   */
  private scheduleRestart(): void {
    if (this.restartTimer) clearTimeout(this.restartTimer)
    this.restartTimer = setTimeout(() => {
      if (this.isListening && this.enabled && this.recognition) {
        try {
          this.recognition.start()
        } catch (e) {
          // 可能已经在运行
        }
      }
    }, 300)
  }

  /**
   * 语音播报
   */
  speak(text: string, options?: { rate?: number; pitch?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        resolve()
        return
      }

      // 取消之前的播报
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = options?.rate ?? 0.9
      utterance.pitch = options?.pitch ?? 1.2
      utterance.volume = 1

      utterance.onstart = () => {
        this.isSpeaking = true
        this.updateState({ isSpeaking: true })
      }

      utterance.onend = () => {
        this.isSpeaking = false
        this.updateState({ isSpeaking: false })
        resolve()
      }

      utterance.onerror = () => {
        this.isSpeaking = false
        this.updateState({ isSpeaking: false })
        resolve()
      }

      // 尝试选择中文语音
      const voices = this.synthesis.getVoices()
      const chineseVoice = voices.find(
        (v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn')
      )
      if (chineseVoice) {
        utterance.voice = chineseVoice
      }

      this.synthesis.speak(utterance)
    })
  }

  /**
   * 播报鼓励语句
   */
  async speakEncouragement(): Promise<void> {
    const text = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
    await this.speak(text, { rate: 0.85, pitch: 1.3 })
  }

  /**
   * 播报动物信息
   */
  async speakAnimalInfo(name: string, sound: string, pronunciation: string): Promise<void> {
    await this.speak(`${name}！${name}的叫声是${sound}。跟着我说，${pronunciation}`, {
      rate: 0.8,
      pitch: 1.2,
    })
  }

  /**
   * 播报家庭成员信息
   */
  async speakFamilyMember(name: string): Promise<void> {
    await this.speak(`${name}！宝宝叫${name}啦！真棒！`, {
      rate: 0.85,
      pitch: 1.3,
    })
  }

  /**
   * 停止播报
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    this.isSpeaking = false
    this.updateState({ isSpeaking: false })
  }

  /**
   * 更新状态
   */
  private updateState(partial: Partial<SpeechState>): void {
    this.onStateChangeCallback?.({
      isListening: this.isListening,
      transcript: '',
      confidence: 0,
      isSpeaking: this.isSpeaking,
      ...partial,
    })
  }

  /**
   * 检查是否支持语音识别
   */
  static isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  }

  /**
   * 检查是否支持语音合成
   */
  static isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopListening()
    this.stopSpeaking()
  }
}
