import { useState, useEffect, useCallback, useRef } from 'react';
import { extractCityFromVoiceCommand } from '../utils/speechUtils';

// Web Speech API interface declarations for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseSpeechRecognitionOptions {
  onResult?: (extractedCity: string, rawTranscript: string) => void;
  onError?: (errorMessage: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onResult,
  onError,
  lang = 'en-US',
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognitionAPI));
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore if already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      const err = 'Voice recognition is not supported in this browser. Please try Chrome, Edge, or Safari.';
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    // Reset states
    setErrorMessage(null);
    setTranscript('');
    setInterimTranscript('');

    // If an existing recognition is active, stop it first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTranscript) {
          const fullText = finalTranscript.trim();
          setTranscript(fullText);
          setInterimTranscript('');
          const extractedCity = extractCityFromVoiceCommand(fullText);
          onResult?.(extractedCity, fullText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let message = 'An error occurred during voice recognition.';
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            message = 'Microphone access denied. Please allow microphone permission in your browser.';
            break;
          case 'no-speech':
            message = 'No speech was detected. Please tap the microphone and try speaking again.';
            break;
          case 'audio-capture':
            message = 'No microphone was detected on your device.';
            break;
          case 'network':
            message = 'Network error during voice speech recognition.';
            break;
          case 'aborted':
            message = ''; // intentional user cancel
            break;
          default:
            message = event.message || `Voice recognition error (${event.error}).`;
            break;
        }

        if (message) {
          setErrorMessage(message);
          onError?.(message);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const errText = err?.message || 'Failed to initialize microphone.';
      setErrorMessage(errText);
      onError?.(errText);
      setIsListening(false);
    }
  }, [lang, onResult, onError]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    setErrorMessage,
  };
}
