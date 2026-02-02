/* eslint-disable react/require-default-props */
import React, { memo } from 'react';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';

interface GestureHandlerProps {
  children: React.ReactNode;
  onStart?: ( e: any, ctx: any ) => void;
  onUpdate?: ( e: any, ctx: any ) => void;
  onEnd?: ( e: any, ctx: any ) => void;
}

/**
 * Cross-platform gesture handler using Gesture API v2
 * Works on both web and native platforms
 */
const GestureHandler = ( {
  children, onStart, onUpdate, onEnd,
}: GestureHandlerProps ) => {

  // Context object to share state between gesture callbacks
  // Using useSharedValue so it can be accessed from worklets
  const ctx = useSharedValue<any>( {} );

  // eslint-disable-next-line new-cap
  const panGesture = Gesture.Pan()
    .onStart( ( e ) => {

      'worklet';

      // Reset context on gesture start
      ctx.value = {};
      onStart?.( e, ctx.value );

    } )
    .onUpdate( ( e ) => {

      'worklet';

      onUpdate?.( e, ctx.value );

    } )
    .onEnd( ( e ) => {

      'worklet';

      onEnd?.( e, ctx.value );

    } )
    .minDistance( 0 )
    .activeOffsetX( [ -10, 10 ] )
    .activeOffsetY( [ -10, 10 ] );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={{ flex: 1 }}>
          {children}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );

};

export default memo( GestureHandler );
