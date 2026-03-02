import React, {
  FC, memo, useState, useMemo,
} from 'react';
import { View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { StoryContentProps } from '../../core/dto/componentsDTO';
import ContentStyles from './Content.styles';

const StoryContent: FC<StoryContentProps> = ( { stories, active, activeStory } ) => {

  const [ storyIndex, setStoryIndex ] = useState( 0 );

  // Only capture plain IDs in the worklet to avoid Reanimated serialising
  // the full story objects (which carry renderContent closures → storiesRef)
  // as read-only shareables, which would break React ref mutation.
  const storyIds = stories.map( ( item ) => item.id );

  const onChange = () => {

    'worklet';

    const index = storyIds.findIndex( ( id ) => id === activeStory.value );
    if ( active.value && index >= 0 && index !== storyIndex ) {

      runOnJS( setStoryIndex )( index );

    }

  };

  useAnimatedReaction(
    () => active.value,
    ( res, prev ) => res !== prev && onChange(),
    [ active, onChange ],
  );

  useAnimatedReaction(
    () => activeStory.value,
    ( res, prev ) => res !== prev && onChange(),
    [ activeStory, onChange ],
  );

  const content = useMemo( () => stories[storyIndex]?.renderContent?.(), [ storyIndex ] );

  return content ? <View style={ContentStyles.container} pointerEvents="box-none">{content}</View> : null;

};

export default memo( StoryContent );
