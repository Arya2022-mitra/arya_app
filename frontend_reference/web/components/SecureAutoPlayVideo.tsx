import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export type SecureVideoSource = {
  src: string;
  type?: string;
};

type SecureAutoPlayVideoProps = {
  /** Ordered list of sources for playback fallbacks */
  sources?: SecureVideoSource[];
  /** Legacy single-source API; converted into a one-item source list */
  src?: string;
  /** Poster to display when autoplay is disabled or before load */
  poster?: string;
  className?: string;
  onError?: () => void;
  preload?: 'auto' | 'metadata' | 'none';
  /** Accessible description shown when autoplay is disabled */
  description?: string;
};

const AUTOPLAY_RETRY_DELAY_MS = 120;

const SecureAutoPlayVideo = forwardRef<HTMLVideoElement | null, SecureAutoPlayVideoProps>(
  (
    {
      sources = [],
      src,
      poster,
      className,
      onError,
      preload = 'metadata',
      description = 'Looping visual content',
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [shouldAutoplay, setShouldAutoplay] = useState(false);
    const [hasError, setHasError] = useState(false);

    const sourceList = useMemo<SecureVideoSource[]>(() => {
      if (sources.length > 0) return sources;
      return src ? [{ src, type: src.endsWith('.webm') ? 'video/webm' : 'video/mp4' }] : [];
    }, [sources, src]);

    const sourcesKey = useMemo(
      () => sourceList.map((source) => `${source.src}-${source.type ?? 'unknown'}`).join('|'),
      [sourceList],
    );

    useEffect(() => {
      setHasError(false);
    }, [sourcesKey]);

    useImperativeHandle<HTMLVideoElement | null, HTMLVideoElement | null>(
      ref,
      () => videoRef.current ?? null,
      [],
    );

    // Respect reduced motion preference
    useEffect(() => {
      if (typeof window === 'undefined') return;

      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleChange = () => setShouldAutoplay(!media.matches);
      handleChange();

      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      // Base attributes enforced for security and UX
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.autoplay = shouldAutoplay;
      video.preload = preload;
      video.controls = false;
      video.setAttribute('controlsList', 'nodownload noremoteplayback');
      video.setAttribute('aria-hidden', 'true');
      if (poster) {
        video.poster = poster;
      }

      try {
        video.disablePictureInPicture = true;
      } catch {
        // ignore
      }

      const attemptPlay = () => {
        if (!shouldAutoplay || hasError) return;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Autoplay failure - handle silently as the overlay will show appropriate messaging
            if (process.env.NODE_ENV === 'development') {
              console.log('Video autoplay blocked or failed:', error);
            }
          });
        }
      };

      // Retry play shortly after programmatic pauses without creating a loop
      let retryTimer: ReturnType<typeof setTimeout> | null = null;
      const handlePause = () => {
        if (retryTimer) {
          clearTimeout(retryTimer);
        }
        retryTimer = setTimeout(() => {
          retryTimer = null;
          attemptPlay();
        }, AUTOPLAY_RETRY_DELAY_MS);
      };

      const handleError = () => {
        setHasError(true);
        onError?.();
      };

      video.addEventListener('pause', handlePause);
      video.addEventListener('error', handleError);

      attemptPlay();

      return () => {
        if (retryTimer) {
          clearTimeout(retryTimer);
        }
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('error', handleError);
      };
    }, [shouldAutoplay, preload, poster, onError, hasError, sourcesKey]);

    // Scope keyboard handling to the container to avoid global interference
    useEffect(() => {
      const container = containerRef.current;
      const video = videoRef.current;
      if (!container || !video) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (['Space', 'KeyK', 'MediaPlayPause'].includes(event.code)) {
          event.preventDefault();
          if (shouldAutoplay) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Keyboard-triggered video play failed:', error);
                }
              });
            }
          }
        }
      };

      const handleFocus = () => {
        container.addEventListener('keydown', handleKeyDown, { passive: false });
      };

      const handleBlur = () => {
        container.removeEventListener('keydown', handleKeyDown);
      };

      container.addEventListener('focus', handleFocus);
      container.addEventListener('blur', handleBlur);

      return () => {
        container.removeEventListener('focus', handleFocus);
        container.removeEventListener('blur', handleBlur);
        container.removeEventListener('keydown', handleKeyDown);
      };
    }, [shouldAutoplay]);

    const showAutoplayNotice = !shouldAutoplay || hasError || sourceList.length === 0;

    return (
      <div
        ref={containerRef}
        className={className}
        tabIndex={0}
        role="group"
        aria-label={description}
        style={{ position: 'relative', outline: 'none' }}
      >
        {sourceList.length > 0 ? (
          <video
            ref={videoRef}
            poster={poster}
            autoPlay={shouldAutoplay}
            muted
            playsInline
            loop
            preload={preload}
            controls={false}
            controlsList="nodownload noremoteplayback"
            // @ts-ignore - TS types might not include this
            disablePictureInPicture
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          >
            {sourceList.map((source) => (
              <source key={`${source.src}-${source.type ?? 'unknown'}`} src={source.src} type={source.type} />
            ))}
          </video>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
            }}
          >
            {description}
          </div>
        )}

        {/* Overlay to prevent direct interactions and context menus */}
        <div
          aria-hidden="true"
          onContextMenu={(e) => e.preventDefault()}
          onDoubleClick={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'auto',
            background: 'transparent',
          }}
        >
          {showAutoplayNotice && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                color: 'white',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6))',
                textAlign: 'center',
                fontSize: '0.9rem',
              }}
            >
              <div style={{ maxWidth: 320 }}>
                {hasError
                  ? 'Video unavailable right now. Please try again or use the provided summary.'
                  : 'Autoplay is disabled to respect your accessibility preferences.'}
                {description ? <div className="sr-only">{description}</div> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

SecureAutoPlayVideo.displayName = 'SecureAutoPlayVideo';

export default SecureAutoPlayVideo;
