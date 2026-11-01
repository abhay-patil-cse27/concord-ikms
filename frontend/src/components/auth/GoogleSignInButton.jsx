import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '25388319136-3ru5kcg2cc6t09vkgnlg7ahlh21jaeqj.apps.googleusercontent.com';

/**
 * GoogleSignInButton
 * Precision-aligned Yellow Brutalist Google Identity Services (OAuth 2.0 / GIS) component.
 * Seamlessly matches CONCORD's brutalist design system, borders, shadows, and width.
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  className = '',
}) {
  const { loginWithGoogle } = useAuth();
  const hiddenGisRef = useRef(null);
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
      if (window.google?.accounts?.id && hiddenGisRef.current) {
        setGisLoaded(true);
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render Google button inside container (which sits transparently over our styled button)
          window.google.accounts.id.renderButton(hiddenGisRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 390,
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
        } else if (attempts > 12) {
          clearInterval(checkInterval);
        }
      }, 250);
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
        'Google Identity Services client is currently unavailable or blocked by browser extensions. You can still log in using email and password.'
      );
    }
  };

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* 1. Underlying Pixel-Perfect Yellow Brutalist Button (Visual Presentation) */}
      <div
        className={`
          w-full h-12 px-4 py-2.5
          border-2 border-brutal-black dark:border-brutal-yellow
          bg-brutal-white dark:bg-brutal-dark-surface
          text-brutal-black dark:text-brutal-white
          shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active
          hover:bg-brutal-yellow hover:text-brutal-black
          dark:hover:bg-brutal-yellow dark:hover:text-brutal-black
          transition-all duration-100 ease-out
          flex items-center justify-between gap-3
          ${disabled || authenticating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-3">
          {authenticating ? (
            <Loader2 className="w-5 h-5 animate-spin text-brutal-black dark:text-brutal-yellow" />
          ) : (
            /* Official Google 'G' Multi-Color SVG */
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
          )}

          <span className="font-mono font-bold text-xs uppercase tracking-wider">
            {authenticating ? 'Authorizing Google Account...' : 'Continue with Google'}
          </span>
        </div>

        {/* Institutional Domain Scope Badge */}
        <span className="font-mono text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 bg-brutal-paper dark:bg-brutal-dark border border-brutal-black/20 dark:border-brutal-yellow/30 text-brutal-black/80 dark:text-brutal-white/80">
          @kitcoek.in / @gmail
        </span>
      </div>

      {/* 2. Top-Layer Transparent GIS Click Interceptor */}
      {/* Sits right over the visual button with full-bleed scale so any click initiates Google GIS */}
      {gisLoaded && !authenticating && !disabled && (
        <div
          ref={hiddenGisRef}
          className="absolute inset-0 w-full h-full opacity-[0.0001] overflow-hidden cursor-pointer z-10 flex items-center justify-center [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:scale-125"
          style={{ colorScheme: 'light' }}
        />
      )}

      {/* 3. Fallback Click Target if GIS hasn't initialized */}
      {(!gisLoaded || disabled) && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={disabled || authenticating}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Continue with Google"
        />
      )}
    </div>
  );
}
