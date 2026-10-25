import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Send, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../api/client';

/**
 * AnswerFeedback
 * Reusable, encapsulated feedback control with thumbs up/down
 * and an optional inline natural language accordion.
 * Can be plugged into any assistant answer card, document inspection view, or search result.
 */
export default function AnswerFeedback({
  content = '',
  resourceType = 'rag_response',
  resourceId = null,
  className = '',
}) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [noteSubmitted, setNoteSubmitted] = useState(false);

  const handleFeedback = async (rating) => {
    // If user clicks the already selected rating, toggle it off (deselect)
    const newRating = feedbackSubmitted === rating ? null : rating;
    setFeedbackSubmitted(newRating);
    setShowNoteInput(Boolean(newRating));
    setNoteSubmitted(false);

    if (newRating) {
      try {
        await api.submitFeedback({
          rating: newRating,
          reason: newRating === 'helpful' ? 'Positive Verification' : 'Reported Inaccuracy',
          message_content: content,
          details: resourceId ? { resource_type: resourceType, resource_id: resourceId } : undefined,
        });
      } catch (err) {
        console.warn('Failed to record answer feedback:', err);
      }
    }
  };

  const handleNoteSubmit = async (e) => {
    e?.preventDefault();
    if (!feedbackText.trim() || !feedbackSubmitted) return;

    try {
      await api.submitFeedback({
        rating: feedbackSubmitted,
        reason: feedbackText.trim(),
        message_content: content,
        details: resourceId ? { resource_type: resourceType, resource_id: resourceId } : undefined,
      });
      setNoteSubmitted(true);
      setTimeout(() => setShowNoteInput(false), 2200);
    } catch (err) {
      console.warn('Failed to submit detailed feedback note:', err);
    }
  };

  return (
    <div className={cn('mt-3 pt-2 border-t border-brutal-black/10 dark:border-brutal-yellow/10 text-xs font-mono select-none', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase font-bold">
          Was this verified answer helpful?
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleFeedback('helpful')}
            className={cn(
              'px-2 py-0.5 border border-brutal-black dark:border-brutal-yellow flex items-center gap-1 transition-all text-[11px] font-bold cursor-pointer',
              feedbackSubmitted === 'helpful'
                ? 'bg-brutal-yellow text-brutal-black shadow-brutal-sm'
                : 'bg-brutal-paper dark:bg-brutal-dark hover:bg-brutal-yellow/50'
            )}
            title="Helpful verified answer"
          >
            <ThumbsUp size={11} />
            <span>Yes</span>
          </button>

          <button
            type="button"
            onClick={() => handleFeedback('unhelpful')}
            className={cn(
              'px-2 py-0.5 border border-brutal-black dark:border-brutal-yellow flex items-center gap-1 transition-all text-[11px] font-bold cursor-pointer',
              feedbackSubmitted === 'unhelpful'
                ? 'bg-brutal-accent text-brutal-white shadow-brutal-sm'
                : 'bg-brutal-paper dark:bg-brutal-dark hover:bg-brutal-accent/20'
            )}
            title="Flag inaccuracy or outdated policy"
          >
            <ThumbsDown size={11} />
            <span>No</span>
          </button>
        </div>
      </div>

      {/* Optional Natural Language Feedback Input (Inline Accordion) */}
      <AnimatePresence>
        {showNoteInput && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {noteSubmitted ? (
              <div className="p-2 bg-brutal-yellow/30 border border-brutal-black dark:border-brutal-yellow text-brutal-black dark:text-brutal-white text-[11px] font-bold flex items-center gap-1.5">
                <Check size={13} className="text-brutal-black dark:text-brutal-yellow" />
                <span>Thank you! Your feedback note was securely recorded in the audit log.</span>
              </div>
            ) : (
              <form onSubmit={handleNoteSubmit} className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
                  <span>
                    {feedbackSubmitted === 'helpful'
                      ? 'Optional: What made this answer helpful?'
                      : 'Optional: What was inaccurate or missing?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNoteInput(false)}
                    className="hover:underline font-bold"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={
                      feedbackSubmitted === 'helpful'
                        ? 'e.g., Clear citation, accurate ordinance formula...'
                        : 'e.g., Outdated 2020 syllabus cited, revised rule missing...'
                    }
                    className="flex-1 px-2.5 py-1 text-xs font-sans bg-brutal-paper dark:bg-brutal-dark border border-brutal-black dark:border-brutal-yellow text-brutal-black dark:text-brutal-white focus:outline-none focus:ring-1 focus:ring-brutal-yellow"
                    maxLength={300}
                  />

                  <button
                    type="submit"
                    disabled={!feedbackText.trim()}
                    className="px-2.5 py-1 bg-brutal-black dark:bg-brutal-yellow text-brutal-yellow dark:text-brutal-black border border-brutal-black font-mono text-[11px] font-black uppercase flex items-center gap-1 disabled:opacity-50 transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <Send size={11} />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
