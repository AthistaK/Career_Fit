/**
 * CareerFit Voice Manager & Speech Queue Lifecycle Engine
 * Provides studio-grade text-to-speech with voice locking, sentence-level pacing,
 * Chromium keep-alive pulse, and anti-overlap queuing.
 */

export interface SpeechCallbacks {
  onStart?: () => void;
  onSentence?: (sentenceIndex: number, text: string) => void;
  onAudioPulse?: (level: number) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class SpeechQueueManager {
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isPlaying = false;
  private keepAliveTimer: any = null;
  private pulseTimer: any = null;
  private currentCallbacks: SpeechCallbacks | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  /**
   * Discovers and locks the highest-fidelity natural recruiter voice.
   */
  public initVoices(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      return null;
    }

    // Priority hierarchy: Human-like Natural / Neural recruiter voices
    const preferredVoices = [
      // Windows / Edge Natural Voices
      voices.find((v) => v.name.includes('Jenny') && v.lang.startsWith('en')),
      voices.find((v) => v.name.includes('Aria') && v.lang.startsWith('en')),
      voices.find((v) => v.name.includes('Sonia') && v.lang.startsWith('en')),
      voices.find((v) => v.name.includes('Natural') && v.lang.startsWith('en')),
      // Google Chrome Natural Voices
      voices.find((v) => v.name.includes('Google') && v.name.includes('US English')),
      voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')),
      // Apple / macOS Enhanced Voices
      voices.find((v) => v.name.includes('Samantha') && v.lang.startsWith('en')),
      voices.find((v) => v.name.includes('Victoria') && v.lang.startsWith('en')),
      // Standard English fallbacks
      voices.find((v) => v.lang === 'en-US'),
      voices.find((v) => v.lang.startsWith('en')),
      voices[0],
    ];

    const match = preferredVoices.find((v) => v !== undefined) || null;
    if (match) {
      this.selectedVoice = match;
    }

    return this.selectedVoice;
  }

  public getLockedVoice(): SpeechSynthesisVoice | null {
    if (!this.selectedVoice) {
      this.initVoices();
    }
    return this.selectedVoice;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Speaks the text with natural pacing, sentence queues, and voice locking.
   */
  public speak(text: string, callbacks: SpeechCallbacks = {}): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (callbacks.onError) callbacks.onError('SpeechSynthesis API not supported');
      if (callbacks.onEnd) callbacks.onEnd();
      return;
    }

    // Cancel any active speech before starting new question
    this.cancel();

    const voice = this.getLockedVoice();
    this.currentCallbacks = callbacks;
    this.isPlaying = true;

    // Clean text of markdown, technical brackets, or extra quotes
    const cleanedText = text
      .replace(/[*_#`~]/g, '')
      .replace(/"/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) {
      this.isPlaying = false;
      if (callbacks.onEnd) callbacks.onEnd();
      return;
    }

    // Split text into natural sentence clauses for human-like pacing and anti-clipping
    const rawSentences = cleanedText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [cleanedText];
    const sentences = rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);

    let sentenceIndex = 0;

    // Start audio pulse timer for mouth & avatar animations
    this.startAudioPulse(callbacks.onAudioPulse);

    // Chrome 15s keep-alive hack
    this.startKeepAlive();

    if (callbacks.onStart) {
      callbacks.onStart();
    }

    const speakNextSentence = () => {
      if (!this.isPlaying) return;

      if (sentenceIndex >= sentences.length) {
        this.finishSpeech();
        return;
      }

      const sentenceText = sentences[sentenceIndex];
      const utterance = new SpeechSynthesisUtterance(sentenceText);

      if (voice) {
        utterance.voice = voice;
      }

      // Calm, confident, professional recruiter parameters
      utterance.rate = 0.98; // Natural, deliberate conversational speed
      utterance.pitch = 1.02; // Warm, approachable tone
      utterance.volume = 1.0;

      utterance.onend = () => {
        sentenceIndex++;
        if (callbacks.onSentence) {
          callbacks.onSentence(sentenceIndex, sentenceText);
        }
        // Small 120ms natural pause between sentences
        setTimeout(() => {
          speakNextSentence();
        }, 120);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis sentence error:', e);
        sentenceIndex++;
        speakNextSentence();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  }

  private startAudioPulse(callback?: (level: number) => void): void {
    if (!callback) return;

    if (this.pulseTimer) clearInterval(this.pulseTimer);

    let frame = 0;
    this.pulseTimer = setInterval(() => {
      frame++;
      // Simulates organic speech waveform harmonics
      const baseLevel = (Math.sin(frame * 0.4) + 1) * 0.35;
      const variation = (Math.cos(frame * 0.8) + 1) * 0.15;
      const level = Math.min(1.0, Math.max(0.1, baseLevel + variation));
      callback(level);
    }, 60);
  }

  private startKeepAlive(): void {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);

    // Prevents Chromium from timing out long speech synthesis runs
    this.keepAliveTimer = setInterval(() => {
      if (this.isPlaying && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  private finishSpeech(): void {
    this.stopTimers();
    this.isPlaying = false;
    if (this.currentCallbacks?.onEnd) {
      this.currentCallbacks.onEnd();
    }
  }

  private stopTimers(): void {
    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.currentCallbacks?.onAudioPulse) {
      this.currentCallbacks.onAudioPulse(0);
    }
  }

  /**
   * Cancels active speech immediately.
   */
  public cancel(): void {
    this.isPlaying = false;
    this.stopTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}

export const speechManager = new SpeechQueueManager();
