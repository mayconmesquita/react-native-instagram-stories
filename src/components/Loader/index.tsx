import React, {
  FC, memo, useEffect, useMemo, useState,
} from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import Animated, {
  cancelAnimation, interpolate, runOnJS, useAnimatedProps, useAnimatedReaction, useAnimatedStyle,
  useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import {
  Circle, Defs, LinearGradient, Stop, Svg,
} from 'react-native-svg';
import {
  AVATAR_SIZE, LOADER_ID, LOADER_URL, STROKE_WIDTH,
} from '../../core/constants';
import { StoryLoaderProps } from '../../core/dto/componentsDTO';

// Only create animated components for native platforms
// Web doesn't support setNativeProps on SVG elements
const AnimatedCircle = Platform.OS !== 'web'
  ? Animated.createAnimatedComponent( Circle )
  : Circle;
const AnimatedSvg = Platform.OS !== 'web'
  ? Animated.createAnimatedComponent( Svg )
  : Svg;

const Loader: FC<StoryLoaderProps> = ( {
  loading, color, size = AVATAR_SIZE + 10,
} ) => {

  const RADIUS = useMemo( () => ( size - STROKE_WIDTH ) / 2, [ size ] );
  const CIRCUMFERENCE = useMemo( () => RADIUS * 2 * Math.PI, [ RADIUS ] );

  const [ colors, setColors ] = useState<string[]>( color.value );
  const [ isLoading, setIsLoading ] = useState( loading.value );

  const rotation = useSharedValue( 0 );
  const progress = useSharedValue( 0 );

  // Native animated props - only used on native platforms
  const animatedProps = useAnimatedProps( (): { strokeDashoffset?: number } => {

    if ( Platform.OS === 'web' ) {

      return {};

    }

    return {
      strokeDashoffset: interpolate( progress.value, [ 0, 1 ], [ 0, CIRCUMFERENCE * 2 / 3 ] ),
    };

  } );

  const animatedStyles = useAnimatedStyle( () => {

    if ( Platform.OS === 'web' ) {

      return {};

    }

    return {
      transform: [ { rotate: `${rotation.value}deg` } ],
    };

  } );

  const startAnimation = () => {

    'worklet';

    if ( Platform.OS === 'web' ) {

      runOnJS( setIsLoading )( true );

      return;

    }

    progress.value = withRepeat( withTiming( 1, { duration: 3000 } ), -1, true );
    rotation.value = withRepeat( withTiming( 720, { duration: 3000 } ), -1, false, () => {

      rotation.value = 0;

    } );

  };

  const stopAnimation = () => {

    'worklet';

    if ( Platform.OS === 'web' ) {

      runOnJS( setIsLoading )( false );

      return;

    }

    cancelAnimation( progress );
    progress.value = withTiming( 0 );

    cancelAnimation( rotation );
    rotation.value = withTiming( 0 );

  };

  const onColorChange = ( newColors: string[] ) => {

    'worklet';

    if ( JSON.stringify( colors ) === JSON.stringify( newColors ) ) {

      return;

    }

    runOnJS( setColors )( newColors );

  };

  useAnimatedReaction(
    () => loading.value,
    ( res ) => ( res ? startAnimation() : stopAnimation() ),
    [ loading.value ],
  );
  useAnimatedReaction(
    () => color.value,
    ( res ) => onColorChange( res ),
    [ color.value ],
  );

  // Web fallback: Poll the loading value since useAnimatedReaction
  // may not work reliably on web
  useEffect( () => {

    if ( Platform.OS !== 'web' ) {

      return () => {};

    }

    // Check immediately
    setIsLoading( loading.value );

    // Poll for changes since web may not trigger useAnimatedReaction reliably
    const interval = setInterval( () => {

      if ( isLoading !== loading.value ) {

        setIsLoading( loading.value );

      }

    }, 100 );

    return () => clearInterval( interval );

  }, [ loading, isLoading ] );

  // Web-specific loader using ActivityIndicator
  if ( Platform.OS === 'web' ) {

    if ( !isLoading ) {

      return null;

    }

    return (
      <ActivityIndicator
        size={size > 50 ? 'large' : 'small'}
        color={colors?.[0] || '#fff'}
      />
    );

  }

  return (
    <AnimatedSvg width={size} height={size} style={animatedStyles}>
      <Defs>
        <LinearGradient id={LOADER_ID} x1="0%" y1="0%" x2="100%" y2="0%">
          {colors?.map( ( item, i ) => (
            <Stop key={item} offset={i / colors.length} stopColor={item} />
          ) )}
        </LinearGradient>
      </Defs>
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={RADIUS}
        fill="none"
        stroke={LOADER_URL}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={[ CIRCUMFERENCE ]}
        animatedProps={animatedProps}
      />
    </AnimatedSvg>
  );

};

export default memo( Loader );
