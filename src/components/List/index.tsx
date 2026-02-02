import React, { FC, memo } from 'react';
import Animated, {
  useAnimatedStyle, useDerivedValue, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import StoryAnimation from '../Animation';
import ListStyles from './List.styles';
import StoryImage from '../Image';
import Progress from '../Progress';
import StoryHeader from '../Header';
import { StoryListProps } from '../../core/dto/componentsDTO';
import { HEIGHT } from '../../core/constants';
import StoryContent from '../Content';
import StoryFooter from '../Footer';

const StoryList: FC<StoryListProps> = ( {
  id, stories, index, x, activeUser, activeStory, progress, seenStories, paused,
  onLoad, videoProps, progressColor, progressActiveColor, mediaContainerStyle, imageStyles,
  imageProps, progressContainerStyle, imageOverlayView, hideElements, hideOverlayViewOnLongPress,
  videoDuration, loaderColor, loaderBackgroundColor, storyContainerStyles, ...props
} ) => {

  const imageHeight = useSharedValue( HEIGHT );
  const isActive = useDerivedValue( () => activeUser.value === id );

  const activeStoryIndex = useDerivedValue(
    () => stories.findIndex( ( item ) => item.id === activeStory.value ),
  );

  const animatedStyles = useAnimatedStyle( () => ( {
    height: Platform.OS === 'android' ? HEIGHT : imageHeight.value,
  } ) );
  const contentStyles = useAnimatedStyle( () => ( {
    opacity: withTiming( hideElements.value ? 0 : 1 ),
  } ) );

  const onImageLayout = ( height: number ) => {

    // No Android, fixar altura para evitar tremor durante transições
    if ( Platform.OS === 'android' ) {

      return;

    }

    imageHeight.value = height;

  };

  const lastSeenIndex = stories.findIndex(
    ( item ) => item.id === seenStories.value[id],
  );

  return (
    <StoryAnimation x={x} index={index}>
      <Animated.View style={[ animatedStyles, ListStyles.container, storyContainerStyles ]}>
        <StoryImage
          stories={stories}
          activeStory={activeStory}
          defaultStory={stories[lastSeenIndex + 1] ?? stories[0]}
          isDefaultVideo={( stories[lastSeenIndex + 1]?.mediaType ?? stories[0]?.mediaType ) === 'video'}
          onImageLayout={onImageLayout}
          onLoad={onLoad}
          paused={paused}
          isActive={isActive}
          videoProps={videoProps}
          mediaContainerStyle={mediaContainerStyle}
          imageStyles={imageStyles}
          imageProps={imageProps}
          videoDuration={videoDuration}
          loaderColor={loaderColor}
          loaderBackgroundColor={loaderBackgroundColor}
        />
        <Animated.View
          style={[
            hideOverlayViewOnLongPress ? contentStyles : {},
            ListStyles.content,
          ]}
          pointerEvents="auto"
        >
          {imageOverlayView}
          <Animated.View style={[ contentStyles, ListStyles.content ]} pointerEvents="box-none">
            <Progress
              active={isActive}
              activeStory={activeStoryIndex}
              progress={progress}
              length={stories.length}
              progressColor={progressColor}
              progressActiveColor={progressActiveColor}
              progressContainerStyle={progressContainerStyle}
            />
            <StoryHeader {...props} />
            <StoryContent stories={stories} active={isActive} activeStory={activeStory} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      <StoryFooter stories={stories} active={isActive} activeStory={activeStory} />
    </StoryAnimation>
  );

};

export default memo( StoryList );
