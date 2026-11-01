import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '25388319136-3ru5kcg2cc6t09vkgnlg7ahlh21jaeqj.apps.googleusercontent.com';

/**
 * GoogleSignInButton
 * Yellow Brutalist Google Identity Services (OAuth 2.0 / GIS) component.
 * Renders Google's official uninhibited button inside a full-width Brutalist institutional card,
 * guaranteeing 100% clickability and alignment with the login form.
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

          // Measure container width up to Google's 400px maximum
          const containerWidth = buttonContainerRef.current.offsetWidth || 380;
          const targetWidth = Math.min(Math.max(containerWidth - 16, 250), 400);

          buttonContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: targetWidth,
          });
        } catch (e) {
          console.warn('Google Identity Services initialization notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
    } else {
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts += 1;
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGis();
        } else if (attempts > 15) {
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      onError?.(
        'Google Identity Services is loading or blocked by a browser extension. You can still log in using email and password.'
      );
    }
  };

  return (
    <div
      className={`
        w-full border-2 border-brutal-black dark:border-brutal-yellow
        bg-brutal-white dark:bg-brutal-dark-surface
        shadow-brutal p-3 flex flex-col items-center gap-2.5 select-none
        ${className}
      `}
    >
      {/* Top Status Header */}
      <div className="w-full flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-brutal-black dark:text-brutal-white pb-2 border-b border-brutal-black/15 dark:border-brutal-yellow/20">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Institutional 1-Click SSO</span>
        </span>
        <span className="text-[9px] text-brutal-muted dark:text-brutal-muted-dark font-mono">
          @kitcoek.in / @gmail
        </span>
      </div>

      {/* Authenticating Spinner Banner */}
      {authenticating ? (
        <div className="w-full py-2.5 px-3 bg-brutal-yellow text-brutal-black border border-brutal-black flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying Google Credentials...</span>
        </div>
      ) : (
        /* Real, uninhibited native Google GIS Button container */
        <div className="w-full flex justify-center items-center min-h-[44px]">
          <div
            ref={buttonContainerRef}
            className="w-full flex justify-center items-center [&_iframe]:!mx-auto"
            style={{ colorScheme: 'light' }}
          />

          {/* Graceful fallback if GIS script is still loading */}
          {!gisLoaded && (
            <button
              type="button"
              onClick={handleFallbackClick}
              disabled={disabled}
              className="w-full flex items-center justify-center gap-2.5 py-2 px-3 border border-brutal-black/40 bg-brutal-paper dark:bg-brutal-dark font-mono text-xs font-bold uppercase tracking-wider hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
            >
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
              <span>Continue with Google</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
