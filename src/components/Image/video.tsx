import React, {
  FC, memo, useRef, useState, useEffect,
} from 'react';
import { LayoutChangeEvent, Platform } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { StoryVideoProps } from '../../core/dto/componentsDTO';
import { WIDTH } from '../../core/constants';

/**
 * Interface for react-native-video v6 onLoad event data
 * @see https://docs.thewidlarzgroup.com/react-native-video/component/events#onload
 */
interface OnLoadData {
  currentTime: number;
  duration: number;
  width?: number;
  height?: number;
  orientation?: 'portrait' | 'landscape' | 'square' | 'unknown';
  // v5 compatibility
  naturalSize?: {
    width: number;
    height: number;
    orientation: string;
  };
}

const StoryVideo: FC<StoryVideoProps> = ( {
  source, paused, isActive, onLoad, onLayout, ...props
} ) => {

  try {

    // eslint-disable-next-line global-require
    const Video = require( 'react-native-video' ).default;

    const ref = useRef<any>( null );
    const hasStartedRef = useRef<boolean>( false );
    const isMountedRef = useRef<boolean>( false );
    const isVideoReadyRef = useRef<boolean>( false );

    // Initialize as false (not paused) - video should always start playing
    // The useAnimatedReaction will sync with the actual paused state
    const [ pausedValue, setPausedValue ] = useState( false );
    const pausedValueRef = useRef( false );

    // Update ref when state changes
    useEffect( () => {

      pausedValueRef.current = pausedValue;

    }, [ pausedValue ] );

    const getVideoElement = () => {

      if ( Platform.OS === 'web' ) {

        // Method 1: Try react-native-video's internal player
        const internal = ref.current?.getInternalPlayer?.();
        if ( internal ) {

          return internal;

        }

        // Method 2: Try direct video property
        if ( ref.current?.video ) {

          return ref.current.video;

        }

        // Method 3: DOM Search
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const doc = typeof window !== 'undefined' ? window.document : null;
        if ( doc ) {

          // Try to find the video element that matches our source or is visible
          const videos = doc.querySelectorAll( 'video' );
          for ( let i = 0; i < videos.length; i += 1 ) {

            const video = videos[i];
            const rect = video.getBoundingClientRect();
            // If it's visible or has dimensions, it's likely ours
            // Also check source if possible, but src might be blob/different format
            if ( rect.width > 0 && rect.height > 0 ) {

              return video;

            }

          }

        }

      }

      return null;

    };

    const stop = () => {

      if ( isMountedRef.current ) {

        setPausedValue( true );

        if ( Platform.OS === 'web' ) {

          const video = getVideoElement();
          if ( video ) {

            video.pause();

          }

        }

      }

    };

    const start = () => {

      // Only seek/resume if component is mounted and video is ready
      if ( ref.current && isMountedRef.current && isVideoReadyRef.current ) {

        try {

          // Ensure state is unpaused
          setPausedValue( false );

          if ( Platform.OS !== 'web' ) {

            ref.current.seek( 0 );
            // resume() is available in v6, play() might not exist
            // In v6, setting paused=false via state is the recommended way
            if ( typeof ref.current.resume === 'function' ) {

              ref.current.resume();

            }

          }

          // Force play on web
          if ( Platform.OS === 'web' ) {

            // delay to ensure state update has processed and we don't conflict with props
            setTimeout( () => {

              const video = getVideoElement();
              if ( video ) {

                video.currentTime = 0;
                video.play().catch( () => {} );

              }

            }, 50 );

          }

        } catch ( e ) {

          // Silently ignore errors if video is not ready

        }

      }

    };

    // Track component mount state and cleanup
    useEffect( () => {

      isMountedRef.current = true;

      return () => {

        isMountedRef.current = false;
        isVideoReadyRef.current = false;
        // Force cleanup/stop on unmount
        stop();

      };

    }, [] );

    // Reset refs when source changes
    useEffect( () => {

      hasStartedRef.current = false;
      isVideoReadyRef.current = false;

    }, [ source ] );

    // Web-specific: Listen to native HTML5 video events directly
    useEffect( () => {

      if ( Platform.OS !== 'web' ) {

        return () => {};

      }

      let videoElement: any = null;
      let timeoutId: any = null;
      let retryCount = 0;
      const maxRetries = 20; // Try for up to 2 seconds

      const findVideoElement = (): any => getVideoElement();

      const handleVideoReady = ( duration: number ) => {

        if ( !isVideoReadyRef.current && duration > 0 ) {

          isVideoReadyRef.current = true;
          onLoad( duration * 1000 );

          if ( isActive.value && !pausedValueRef.current ) {

            start();

          }

        }

      };

      const handleLoadedMetadata = ( e: any ) => {

        const video = e.target;
        if ( video?.duration > 0 ) {

          handleVideoReady( video.duration );

        }

      };

      const handleCanPlay = ( e: any ) => {

        const video = e.target;
        if ( video?.duration > 0 ) {

          handleVideoReady( video.duration );

        }

      };

      const handleDurationChange = ( e: any ) => {

        const video = e.target;
        if ( video?.duration > 0 && !Number.isNaN( video.duration ) ) {

          handleVideoReady( video.duration );

        }

      };

      const attachListeners = (): boolean => {

        videoElement = findVideoElement();

        if ( videoElement ) {

          // Add multiple event listeners for redundancy
          videoElement.addEventListener( 'loadedmetadata', handleLoadedMetadata );
          videoElement.addEventListener( 'canplay', handleCanPlay );
          videoElement.addEventListener( 'durationchange', handleDurationChange );
          videoElement.addEventListener( 'loadeddata', handleCanPlay );

          // Check if already loaded
          if ( videoElement.readyState >= 1 && videoElement.duration > 0 ) {

            handleVideoReady( videoElement.duration );

          }

          return true;

        }

        return false;

      };

      const tryAttach = () => {

        if ( !attachListeners() && retryCount < maxRetries ) {

          retryCount += 1;
          timeoutId = setTimeout( tryAttach, 100 );

        }

      };

      // Start trying to attach
      tryAttach();

      return () => {

        if ( timeoutId ) {

          clearTimeout( timeoutId );

        }

        if ( videoElement ) {

          videoElement.removeEventListener( 'loadedmetadata', handleLoadedMetadata );
          videoElement.removeEventListener( 'canplay', handleCanPlay );
          videoElement.removeEventListener( 'durationchange', handleDurationChange );
          videoElement.removeEventListener( 'loadeddata', handleCanPlay );

        }

      };

    }, [ source ] );

    useAnimatedReaction(
      () => paused.value,
      ( res, prev ) => {

        // Only sync when value actually changes (not on first run)
        // This prevents the initial paused.value from overriding our "start playing" intent
        if ( prev !== undefined && res !== prev ) {

          runOnJS( setPausedValue )( res );

        }

      },
      [ paused.value ],
    );

    useAnimatedReaction(
      () => isActive.value,
      ( res ) => {

        // Only start on initial activation, not on every isActive change
        // This prevents seek(0) from being called repeatedly which causes HLS rebuffering
        if ( res && !hasStartedRef.current ) {

          hasStartedRef.current = true;
          runOnJS( start )();

        } else if ( !res ) {

          // Pause when inactive
          runOnJS( stop )();
          // Reset start flag so if we come back to this story, it starts from beginning
          hasStartedRef.current = false;

        }

      },
      [ isActive.value ],
    );

    /**
     * Handle onLoad event - compatible with both v5 and v6
     * v6: { currentTime, duration, width, height, orientation }
     * v5: { currentTime, duration, naturalSize: { width, height, orientation }, ... }
     */
    const handleLoad = ( data: OnLoadData ) => {

      // Prevent duplicate calls
      if ( isVideoReadyRef.current ) {

        return;

      }

      const duration = data?.duration;
      if ( typeof duration === 'number' && !Number.isNaN( duration ) && duration > 0 ) {

        isVideoReadyRef.current = true;
        onLoad( duration * 1000 );

        // If isActive, try to start the video now that it's ready
        if ( isActive.value && !pausedValue ) {

          start();

        }

      }

    };

    /**
     * Handle onReadyForDisplay event (v6) - used as fallback for web
     * This event fires when the first video frame is ready to display
     */
    const handleReadyForDisplay = () => {

      // Prevent duplicate calls
      if ( isVideoReadyRef.current ) {

        return;

      }

      // On web, onLoad might not fire properly for some video formats
      // This serves as a fallback to ensure the video can start playing
      if ( Platform.OS === 'web' ) {

        // Get duration from the video element if possible
        const videoElement = ref.current?.getInternalPlayer?.();
        if ( videoElement && typeof videoElement.duration === 'number' && !Number.isNaN( videoElement.duration ) && videoElement.duration > 0 ) {

          isVideoReadyRef.current = true;
          onLoad( videoElement.duration * 1000 );

          // If isActive, try to start the video now that it's ready
          if ( isActive.value && !pausedValue ) {

            start();

          }

        }

      }

    };

    interface ProgressData {
      currentTime: number;
      playableDuration?: number;
      seekableDuration?: number;
    }

    /**
     * Handle onProgress event - fallback for web when onLoad doesn't fire
     * This fires periodically during playback with current time info
     */
    const handleProgress = ( data: ProgressData ) => {

      // On web, use this as a last resort fallback if onLoad didn't fire
      if ( Platform.OS === 'web' && !isVideoReadyRef.current ) {

        const videoElement = ref.current?.getInternalPlayer?.();
        const duration = videoElement?.duration || data?.seekableDuration || data?.playableDuration;

        if ( duration && typeof duration === 'number' && !Number.isNaN( duration ) && duration > 0 ) {

          isVideoReadyRef.current = true;
          onLoad( duration * 1000 );

        }

      }

    };

    // On web, aspectRatio alone may not work properly - need explicit dimensions
    const videoStyle = Platform.OS === 'web'
      ? { width: WIDTH, height: WIDTH / 0.5626 }
      : { width: WIDTH, aspectRatio: 0.5626 };

    // Buffer configuration for HLS streams on iOS
    // This helps prevent buffering pauses during playback
    const bufferConfig = Platform.OS === 'ios' ? {
      minBufferMs: 15000,
      maxBufferMs: 50000,
      bufferForPlaybackMs: 2500,
      bufferForPlaybackAfterRebufferMs: 5000,
    } : undefined;

    return (
      <Video
        ref={ref}
        style={videoStyle}
        {...props}
        source={source}
        paused={pausedValue}
        controls={false}
        repeat={false}
        resizeMode="contain"
        playInBackground={false}
        playWhenInactive={false}
        allowsExternalPlayback={false}
        ignoreSilentSwitch="ignore"
        bufferConfig={bufferConfig}
        automaticallyWaitsToMinimizeStalling={false}
        preferredForwardBufferDuration={10}
        onLoad={handleLoad}
        onReadyForDisplay={handleReadyForDisplay}
        onProgress={handleProgress}
        onLayout={( e: LayoutChangeEvent ) => onLayout( e.nativeEvent.layout.height )}
      />
    );

  } catch ( error ) {

    return null;

  }

};

export default memo( StoryVideo );
