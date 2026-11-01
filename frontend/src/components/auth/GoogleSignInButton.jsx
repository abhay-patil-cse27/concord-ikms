import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrutalButton } from '../brutal';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '25388319136-3ru5kcg2cc6t09vkgnlg7ahlh21jaeqj.apps.googleusercontent.com';

/**
 * GoogleSignInButton
 * High-voltage Yellow Brutalist Google Identity Services (OAuth 2.0 / OpenID Connect) button.
 * Integrates directly with Google Workspace (@kitcoek.in) and personal Google accounts (@gmail.com).
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  className = '',
}) {
  const { loginWithGoogle } = useAuth();
  const buttonContainerRef = useRef(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      onError?.('Google authentication did not return a valid credential token.');
      return;
    }

    setAuthenticating(true);
    try {
      const result = await loginWithGoogle(response.credential);
      onSuccess?.(result);
    } catch (err) {
      const message = err?.message || 'Google Single Sign-On failed. Please try again.';
      onError?.(message);
    } finally {
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    let checkInterval = null;

    const initGis = () => {
      if (window.google?.accounts?.id && buttonContainerRef.current) {
        setGisLoaded(true);
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render Google's official GIS button inside our container
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonContainerRef.current.offsetWidth || 340,
          });
        } catch (e) {
          console.warn('Google Identity Services initialization notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
    } else {
      // Check every 300ms for up to 3 seconds in case script loads asynchronously
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts += 1;
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGis();
        } else if (attempts > 10) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Offline / Fallback trigger (for adblocker, test runners, or prompt fallback)
  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // Mock / Offline notification
      onError?.(
        'Google Identity Services client is currently unavailable or blocked by browser extensions. You can still log in using email and password.'
      );
    }
  };

  return (
    <div className={`w-full flex flex-col items-center gap-2 ${className}`}>
      {/* Official GIS Button Container */}
      <div
        ref={buttonContainerRef}
        className={`w-full flex justify-center ${gisLoaded ? 'min-h-[44px]' : 'hidden'}`}
        style={{ colorScheme: 'light' }}
      />

      {/* Yellow Brutalist Styled Button when GIS is not loaded or during authentication */}
      {(!gisLoaded || authenticating) && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={disabled || authenticating}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-brutal-black bg-brutal-white dark:bg-brutal-dark-surface dark:border-brutal-yellow text-brutal-black dark:text-brutal-white font-mono font-bold text-xs uppercase tracking-wider shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active hover:bg-brutal-yellow hover:text-brutal-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {/* Official Google 'G' Multi-Color SVG */}
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {authenticating
              ? 'Verifying Google Account...'
              : 'Continue with Google (@kitcoek.in / @gmail.com)'}
          </span>
        </button>
      )}

      {/* Explanatory micro-copy */}
      <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark text-center uppercase tracking-wide">
        Institutional Google Workspace & Gmail Accounts Supported
      </div>
    </div>
  );
}
