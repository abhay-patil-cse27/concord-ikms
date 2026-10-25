import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanMarkdownForSpeech } from '../utils/speechUtils';

/**
 * useSpeechSynthesis
 * Modular, resilient hook wrapping the Web Speech API (window.speechSynthesis).
 * Manages speaking, pausing, resuming, and stopping with automatic cleanup.
 */
export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentUtteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('Speech cancellation error:', err);
      }
    }
    setIsPlaying(false);
    setIsPaused(false);
    currentUtteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } catch (err) {
        console.warn('Speech pause error:', err);
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } catch (err) {
        console.warn('Speech resume error:', err);
      }
    }
  }, []);

  const speak = useCallback((rawMarkdownText) => {
    if (!isSupported || !rawMarkdownText) return;

    // Cancel any ongoing speech
    stop();

    const cleanText = cleanMarkdownForSpeech(rawMarkdownText);
    if (!cleanText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a clean institutional English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en')) && !v.name.includes('Compact')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        // 'interrupted' is normal when user clicks stop/cancel
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis error:', e.error);
        }
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to initiate speech synthesis:', err);
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [isSupported, stop]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isSupported,
    isPlaying,
    isPaused,
    speak,
    pause,
    resume,
    stop,
  };
}
