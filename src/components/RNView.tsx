import type {ForwardedRef} from 'react';
import React from 'react';
import type {ViewProps} from 'react-native';
import {View} from 'react-native';
import Animated from 'react-native-reanimated';

// Convert the underlying View into an Animated component so that we can take an animated ref and pass it to a worklet
const AnimatedView = Animated.createAnimatedComponent(View);

type AnimatedViewRef = typeof AnimatedView & View;

function RNViewWithRef(props: ViewProps, ref: ForwardedRef<AnimatedViewRef>) {
    return (
        <AnimatedView
            ref={(refHandle) => {
                if (typeof ref !== 'function') {
                    return;
                }
                ref(refHandle as AnimatedViewRef);
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        />
    );
}

RNViewWithRef.displayName = 'RNViewWithRef';

export default React.forwardRef(RNViewWithRef);
export type {AnimatedViewRef};