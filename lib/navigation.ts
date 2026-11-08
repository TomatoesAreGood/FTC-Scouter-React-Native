import { Animated, Easing } from 'react-native';
import {
  CardStyleInterpolators,
  type StackCardStyleInterpolator,
  type StackNavigationOptions,
} from 'expo-router/js-stack';
import { colors } from './theme';

type TransitionSpec = NonNullable<StackNavigationOptions['transitionSpec']>['open'];

/*
 * Screen transitions.
 *
 * iOS uses the native stack: its push/pop slides both ways and supports swipe-back.
 *
 * Android uses expo-router's JavaScript stack. With the native stack (react-native-screens)
 * on the new architecture, popping a screen tears its content out before the exit
 * animation runs, so going back showed the closing page as a blank white sheet sliding
 * away. Short default animations hide that; a full slide makes it obvious. The JavaScript
 * stack keeps the closing screen mounted until its animation has finished, so going back
 * looks exactly like going forward.
 */

/** Native stack (iOS): pushed screens use the platform push/pop. */
export const nativePushAnimation = 'default' as const;

/**
 * Top-level groups ((tabs), (auth)) only appear by replacement (launch redirect, sign in,
 * sign out), never by a push you can go back from, so they cross-fade.
 */
export const nativeRootSwapAnimation = 'fade' as const;

/**
 * Android push/pop: the new page slides in from the right while the current one slides
 * out to the left, both the full width (the native "slide_from_right"); going back is
 * the exact reverse.
 */
const forSlideFromRight: StackCardStyleInterpolator = ({ current, next, inverted, layouts: { screen } }) => ({
  cardStyle: {
    transform: [
      // This page entering (forward) or leaving (back).
      {
        translateX: Animated.multiply(
          current.progress.interpolate({ inputRange: [0, 1], outputRange: [screen.width, 0], extrapolate: 'clamp' }),
          inverted,
        ),
      },
      // The page on top of this one entering or leaving pushes this one sideways.
      {
        translateX: next
          ? Animated.multiply(
              next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, -screen.width], extrapolate: 'clamp' }),
              inverted,
            )
          : 0,
      },
    ],
  },
});

/** 400 ms with accelerate-decelerate easing: Android's medium duration and default curve. */
const slideSpec: TransitionSpec = {
  animation: 'timing',
  config: { duration: 400, easing: Easing.inOut(Easing.sin) },
};

/** JavaScript stack (Android): options shared by every screen. */
export const jsStackScreenOptions: StackNavigationOptions = {
  headerShown: false,
  gestureEnabled: false,
  // The motion is horizontal (Android's stack default is vertical).
  gestureDirection: 'horizontal',
  cardStyle: { backgroundColor: colors.background },
  cardShadowEnabled: false,
  cardOverlayEnabled: false,
  // Keep the page underneath attached, so it is fully drawn the moment you go back.
  detachPreviousScreen: false,
  cardStyleInterpolator: forSlideFromRight,
  transitionSpec: { open: slideSpec, close: slideSpec },
};

const fadeSpec: TransitionSpec = {
  animation: 'timing',
  config: { duration: 200, easing: Easing.out(Easing.quad) },
};

/** JavaScript stack (Android): the (tabs)/(auth) groups cross-fade, as on iOS. */
export const jsStackRootSwapOptions: StackNavigationOptions = {
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
  transitionSpec: { open: fadeSpec, close: fadeSpec },
};
