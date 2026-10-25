import React from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { cn } from '../../lib/utils';

/**
 * SpeechPlaybackButton
 * Yellow Brutalist voice audio control button with micro-animated audio wave bars.
 * Renders on assistant response cards to read answers aloud via Web Speech API.
 */
export default function SpeechPlaybackButton({ content }) {
  const { isSupported, isPlaying, isPaused, speak, pause, resume, stop } = useSpeechSynthesis();

  if (!isSupported || !content) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isPlaying) {
      speak(content);
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleStop = (e) => {
    e.stopPropagation();
    stop();
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 border border-brutal-black font-mono text-[10px] font-bold uppercase transition-all shadow-brutal-xs select-none',
          isPlaying && !isPaused
            ? 'bg-brutal-yellow text-brutal-black ring-1 ring-brutal-black'
            : isPaused
            ? 'bg-brutal-paper dark:bg-brutal-dark text-brutal-black dark:text-brutal-white border-dashed'
            : 'bg-brutal-paper dark:bg-brutal-dark text-brutal-black dark:text-brutal-white hover:bg-brutal-yellow hover:text-brutal-black'
        )}
        title={
          isPlaying && !isPaused
            ? 'Pause audio readout'
            : isPaused
            ? 'Resume audio readout'
            : 'Listen to Institutional Answer (Text-to-Speech)'
        }
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause size={10} className="stroke-[3]" />
            <span>Speaking</span>
            {/* Animated Equalizer Wave Bars */}
            <span className="flex items-end gap-0.5 h-2.5 ml-0.5">
              <span className="w-0.5 bg-brutal-black h-2 animate-[pulse_0.6s_ease-in-out_infinite]" />
              <span className="w-0.5 bg-brutal-black h-3 animate-[pulse_0.4s_ease-in-out_infinite_0.2s]" />
              <span className="w-0.5 bg-brutal-black h-1.5 animate-[pulse_0.5s_ease-in-out_infinite_0.1s]" />
            </span>
          </>
        ) : isPaused ? (
          <>
            <Play size={10} className="stroke-[3]" />
            <span>Paused</span>
          </>
        ) : (
          <>
            <Volume2 size={11} className="stroke-[2.5]" />
            <span>Listen</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          type="button"
          onClick={handleStop}
          className="p-0.5 border border-brutal-black bg-brutal-white dark:bg-brutal-dark hover:bg-brutal-accent hover:text-white transition-colors text-brutal-black dark:text-brutal-white"
          title="Stop audio playback"
        >
          <VolumeX size={10} />
        </button>
      )}
    </div>
  );
}
