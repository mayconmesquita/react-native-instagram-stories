jest.mock('react-native-reanimated', () => {

  const View = require('react-native').View;

  return {
    Value: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    eq: jest.fn(),
    set: jest.fn(),
    cond: jest.fn(),
    interpolate: jest.fn(),
    View: (props) => <View {...props} />,
    createAnimatedComponent: (cb) => cb,
    Extrapolate: { CLAMP: jest.fn() },
    Transition: {
      Together: 'Together',
      Out: 'Out',
      In: 'In',
    },
    useSharedValue: jest.fn(),
    useDerivedValue: (a) => ({ value: a() }),
    useAnimatedScrollHandler: () => () => {},
    useAnimatedGestureHandler: ({onStart, onActive, onFinish}) => ({onStart, onActive, onFinish}),
    useAnimatedStyle: (cb) => cb(),
    useAnimatedRef: () => ({ current: null }),
    useAnimatedReaction: jest.fn(),
    useAnimatedProps: (cb) => cb(),
    withTiming: (toValue, configOrCb, maybeCb) => {
      // Handle both withTiming(value, cb) and withTiming(value, config, cb)
      const cb = typeof configOrCb === 'function' ? configOrCb : maybeCb;
      cb && cb(true);
      return toValue;
    },
    withSpring: (toValue, configOrCb, maybeCb) => {
      const cb = typeof configOrCb === 'function' ? configOrCb : maybeCb;
      cb && cb(true);
      return toValue;
    },
    withDecay: (_, cb) => {
      cb && cb(true);
      return 0;
    },
    withDelay: (_, animationValue) => {
      return animationValue;
    },
    withSequence: (..._animations) => {
      return 0;
    },
    withRepeat: (animation, _, __, cb) => {
      cb?.();
      return animation;
    },
    cancelAnimation: () => {},
    measure: () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      pageX: 0,
      pageY: 0,
    }),
    Easing: {
      linear: (cb) => cb(),
      ease: (cb) => cb(),
      quad: (cb) => cb(),
      cubic: (cb) => cb(),
      poly: (cb) => cb(),
      sin: (cb) => cb(),
      circle: (cb) => cb(),
      exp: (cb) => cb(),
      elastic: (cb) => cb(),
      back: (cb) => cb(),
      bounce: (cb) => cb(),
      bezier: () => ({ factory: (cb) => cb() }),
      bezierFn: (cb) => cb(),
      steps: (cb) => cb(),
      in: (cb) => cb(),
      out: (cb) => cb(),
      inOut: (cb) => cb(),
    },
    Extrapolation: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
  };
});

jest.mock('react-native-gesture-handler', () => {

  const View = require('react-native').View;
  const React = require('react');

  return {
    PanGestureHandler: ({onGestureEvent, children}) => (
      <View
        onResponderStart={onGestureEvent?.onStart} 
        onResponderEnd={onGestureEvent?.onFinish} 
        onResponderMove={onGestureEvent?.onActive}
        testID="gestureContainer"
      >
        {children}
      </View>
    ),
    GestureDetector: ({ children }) => <View testID="gestureDetector">{children}</View>,
    GestureHandlerRootView: ({ children, style }) => <View style={style} testID="gestureHandlerRootView">{children}</View>,
    Gesture: {
      Pan: () => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
        onFinalize: jest.fn().mockReturnThis(),
        minDistance: jest.fn().mockReturnThis(),
        activeOffsetX: jest.fn().mockReturnThis(),
        activeOffsetY: jest.fn().mockReturnThis(),
      }),
    },
    gestureHandlerRootHOC: (Component) => Component,
  };

});

// Mock the GestureHandler component directly to handle gestures in tests
jest.mock('./src/components/Modal/gesture', () => {
  const View = require('react-native').View;
  const React = require('react');

  return ({ children, onStart, onUpdate, onEnd }) => (
    <View 
      testID="gestureContainer"
      onResponderStart={(e, ctx) => onStart?.(e, ctx || {})}
      onResponderMove={(e, ctx) => onUpdate?.(e, ctx || {})}
      onResponderEnd={(e, ctx) => onEnd?.(e, ctx || {})}
    >
      {children}
    </View>
  );
});

jest.mock('./src/core/helpers/storage', () => ({
  clearProgressStorage: () => {},
  getProgressStorage: jest.fn(),
  setProgressStorage: jest.fn(),
}));

jest.mock('./src/components/Image/video', () => {

  const React = require('react');
  const { View } = require('react-native');

  return ( props ) => {
  
    const { onLoad, onLayout } = props;

    onLoad?.({ duration: 10, currentTime: 0, width: 1080, height: 1920, orientation: 'portrait' });
    onLayout?.({ nativeEvent: { layout: { width: 100, height: 100 } } });

    return <View testID="storyVideo" />;
  };
});

jest.mock('@shopify/flash-list', () => {

  const React = require('react');
  const { ScrollView } = require('react-native');

  return {FlashList: ({ data, renderItem, ...props }) => {

    return (
      <ScrollView {...props}>
        {data.map(( item, index ) => renderItem({ item, index }))}
      </ScrollView>
    )

  }};

});