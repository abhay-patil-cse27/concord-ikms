import React, { useState, useEffect, useRef } from 'react';
import { useRAG } from '../hooks/useRAG';
import { useAuth } from '../context/AuthContext';
import ThreadSidebar from '../components/ui/ThreadSidebar';
import ChatHeader from '../components/rag/ChatHeader';
import SuggestedPrompts from '../components/rag/SuggestedPrompts';
import MessageBlock from '../components/rag/MessageBlock';
import Composer from '../components/rag/Composer';
import CitationDrawer from '../components/rag/CitationDrawer';
import { BrutalToast } from '../components/brutal';
import { exportThreadToMarkdown } from '../lib/exportThread';

/**
 * RAGAssistantView
 * Yellow Brutalist grounded conversational assistant.
 * Powered by Groq LLM inference, RRF vector evidence, and multi-turn inquiry sessions.
 */
export default function RAGAssistantView() {
  const { user } = useAuth();
  const {
    query,
    setQuery,
    loading,
    error,
    response,
    history,
    conversations,
    activeConversationId,
    selectConversation,
    createNewSession,
    deleteSession,
    ask,
    clear,
  } = useRAG();

  const [activeCitation, setActiveCitation] = useState(null);
  const [activeCitationIndex, setActiveCitationIndex] = useState(1);
  const [showCitationDrawer, setShowCitationDrawer] = useState(false);
  const [showSessionsSidebar, setShowSessionsSidebar] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptAccumulatorRef = useRef('');

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, loading]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              transcriptAccumulatorRef.current = (transcriptAccumulatorRef.current + ' ' + transcript).trim();
            } else {
              currentInterim += transcript;
            }
          }

          const combined = (transcriptAccumulatorRef.current + ' ' + currentInterim).trim();
          if (combined) {
            setQuery(combined);
          }

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try { recognitionRef.current.stop(); } catch (e) {}
              setIsListening(false);
            }
          }, 3500);
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition warning:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.error('Speech initialization failed', e);
      }
    }
  }, []);

  const handleToggleSpeech = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    } else {
      transcriptAccumulatorRef.current = query;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  const handleSend = () => {
    if (!query.trim() || loading) return;
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    }
    ask(query.trim());
  };

  const handleOpenCitation = (citIndex, citationsList = []) => {
    const list = citationsList.length > 0 ? citationsList : (response?.citations || []);
    const target = list[citIndex - 1] || list[0];
    if (target) {
      setActiveCitation(target);
      setActiveCitationIndex(citIndex);
      setShowCitationDrawer(true);
    }
  };

  const handleCreateNewSession = () => {
    createNewSession();
    setToast({
      message: 'New conversation session initialized.',
      type: 'info',
    });
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteSession(id);
      setToast({
        message: 'Conversation thread removed from memory.',
        type: 'info',
      });
    } catch (e) {
      setToast({
        message: 'Failed to delete conversation thread.',
        type: 'error',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeTitle = conversations.find(c => c.id === activeConversationId)?.title || 'Autonomous Grounded Q&A';

  const handleCopyMarkdown = async () => {
    if (!history || history.length === 0) {
      setToast({ message: 'Conversation thread is empty.', type: 'warning' });
      return;
    }

    try {
      const markdown = exportThreadToMarkdown({
        title: activeTitle,
        history,
        date: new Date().toLocaleString(),
      });

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        // Fallback for non-secure contexts or legacy browsers
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setToast({
        message: 'Conversation copied as Markdown with source citations!',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to copy Markdown:', err);
      setToast({
        message: 'Could not copy to clipboard. Please check browser permissions.',
        type: 'error',
      });
    }
  };

  return (
    <div className="flex h-full w-full border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal-lg bg-brutal-paper dark:bg-brutal-black overflow-hidden relative min-h-0">
      
      {/* Toast Alert */}
      {toast && (
        <BrutalToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Desktop / Collapsible Thread Sidebar */}
      {showSessionsSidebar && (
        <ThreadSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={selectConversation}
          onCreateNewSession={handleCreateNewSession}
          onDeleteSession={handleDeleteSession}
          onCloseSidebar={() => setShowSessionsSidebar(false)}
          userName={user?.full_name || user?.email || 'Institutional Member'}
          userRole={user?.role_code || 'VERIFIED USER'}
        />
      )}

      {/* Main Conversation Canvas (ChatGPT-style fixed card window) */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-brutal-paper dark:bg-brutal-black">
        
        {/* Top Header (Fixed) */}
        <ChatHeader
          showSidebar={showSessionsSidebar}
          onToggleSidebar={() => setShowSessionsSidebar(!showSessionsSidebar)}
          onPrint={handlePrint}
          onCopyMarkdown={handleCopyMarkdown}
          isCopyDisabled={!history || history.length === 0}
          conversationTitle={activeTitle}
        />

        {/* Message Stream (Scrollable Container) */}
        <div
          aria-live="polite"
          className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6"
        >
          {history.length === 0 ? (
            <SuggestedPrompts
              onSelectPrompt={(text) => {
                setQuery(text);
                ask(text);
              }}
            />
          ) : (
            history.map((msg, idx) => (
              <MessageBlock
                key={idx}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                citations={msg.citations}
                onOpenCitation={(citIdx) => handleOpenCitation(citIdx, msg.citations)}
              />
            ))
          )}

          {/* Stepped Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2 p-4 bg-brutal-white dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow w-fit shadow-brutal-sm">
              <span className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white">
                Synthesizing
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="w-2.5 h-2.5 bg-brutal-yellow border border-brutal-black animate-pulse" />
                <span className="w-2.5 h-2.5 bg-brutal-black dark:bg-brutal-yellow border border-brutal-black animate-pulse delay-150" />
                <span className="w-2.5 h-2.5 bg-brutal-yellow border border-brutal-black animate-pulse delay-300" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-brutal-accent/15 border-2 border-brutal-accent font-mono text-xs text-brutal-accent font-bold">
              Error generating response: {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pinned Bottom Composer */}
        <Composer
          query={query}
          setQuery={setQuery}
          onSend={handleSend}
          loading={loading}
          isListening={isListening}
          speechSupported={speechSupported}
          onToggleSpeech={handleToggleSpeech}
        />
      </div>

      {/* Slide-In Citation Provenance Drawer */}
      <CitationDrawer
        isOpen={showCitationDrawer}
        onClose={() => setShowCitationDrawer(false)}
        citation={activeCitation}
        citationIndex={activeCitationIndex}
      />

    </div>
  );
}
