/**
 * Web Speech API Wrapper for Voice Input
 * Provides speech-to-text functionality for the ماليّ application
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export interface SpeechResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

export interface SpeechOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class SpeechRecognizer {
  private recognition: AnyRecognition = null;
  private isListening = false;
  private onResult: ((result: SpeechResult) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onEnd: (() => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as AnyRecognition).SpeechRecognition ||
        (window as AnyRecognition).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupListeners();
      }
    }
  }

  private setupListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: AnyRecognition) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }

        if (this.onResult) {
          this.onResult({
            text: event.results[i].isFinal
              ? finalTranscript.trim()
              : interimTranscript,
            isFinal: event.results[i].isFinal,
            confidence: confidence,
          });
        }
      }
    };

    this.recognition.onerror = (event: AnyRecognition) => {
      if (this.onError) {
        const errorMessage = this.getErrorMessage(event.error);
        this.onError(errorMessage);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }

  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      "no-speech": "لم يتم التقاط أي صوت. حاول مرة أخرى.",
      "audio-capture": "لا توجد ميكروفون متصل.",
      network: "خطأ في الشبكة. تحقق من اتصالك بالإنترنت.",
      aborted: "تم إيقاف التعرف على الكلام.",
      "service-not-allowed": "خدمة التعرف على الكلام غير متاحة.",
      "bad-grammar": "خطأ في النحو.",
      other: "خطأ غير متوقع.",
    };

    return errorMessages[error] || `خطأ في التعرف على الكلام: ${error}`;
  }

  public start(options?: SpeechOptions): boolean {
    if (!this.recognition) {
      if (this.onError) {
        this.onError("خدمة التعرف على الكلام غير مدعومة في متصفحك.");
      }
      return false;
    }

    if (this.isListening) {
      return false;
    }

    this.recognition.lang = options?.language || "ar-SA";
    this.recognition.continuous = options?.continuous || false;
    this.recognition.interimResults = options?.interimResults ?? true;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      if (this.onError) {
        this.onError("فشل في بدء التعرف على الكلام.");
      }
      return false;
    }
  }

  public stop(): boolean {
    if (!this.recognition || !this.isListening) {
      return false;
    }

    try {
      this.recognition.stop();
      return true;
    } catch (error) {
      return false;
    }
  }

  public abort(): boolean {
    if (!this.recognition) {
      return false;
    }

    try {
      this.recognition.abort();
      this.isListening = false;
      return true;
    } catch (error) {
      return false;
    }
  }

  public setResultCallback(callback: (result: SpeechResult) => void): void {
    this.onResult = callback;
  }

  public setErrorCallback(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public setEndCallback(callback: () => void): void {
    this.onEnd = callback;
  }

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const SpeechRecognition =
      (window as AnyRecognition).SpeechRecognition ||
      (window as AnyRecognition).webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

// Export singleton instance
let instance: SpeechRecognizer | null = null;

export function getSpeechRecognizer(): SpeechRecognizer {
  if (!instance) {
    instance = new SpeechRecognizer();
  }
  return instance;
}
