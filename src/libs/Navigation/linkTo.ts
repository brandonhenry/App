import {getActionFromState} from '@react-navigation/core';
import {NavigationAction, NavigationContainerRef, NavigationState, PartialState} from '@react-navigation/native';
import {Writable} from 'type-fest';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import {Route} from '@src/ROUTES';
import dismissModal from './dismissModal';
import getStateFromPath from './getStateFromPath';
import getTopmostReportId from './getTopmostReportId';
import linkingConfig from './linkingConfig';
import {NavigationRoot, RootStackParamList, StackNavigationAction} from './types';

type ActionPayloadParams = {
    screen?: string;
    params?: unknown;
    path?: string;
};

type ActionPayload = {
    params?: ActionPayloadParams;
};

/**
 * Motivation for this function is described in NAVIGATION.md
 *
 * @param action action generated by getActionFromState
 * @param state The root state
 * @returns minimalAction minimal action is the action that we should dispatch
 */
function getMinimalAction(action: NavigationAction, state: NavigationState): Writable<NavigationAction> {
    let currentAction: NavigationAction = action;
    let currentState: NavigationState | PartialState<NavigationState> | undefined = state;
    let currentTargetKey: string | undefined;

    while (currentAction.payload && 'name' in currentAction.payload && currentState?.routes[currentState.index ?? -1].name === currentAction.payload.name) {
        if (!currentState?.routes[currentState.index ?? -1].state) {
            break;
        }

        currentState = currentState?.routes[currentState.index ?? -1].state;
        currentTargetKey = currentState?.key;

        const payload = currentAction.payload as ActionPayload;

        // Creating new smaller action
        currentAction = {
            type: currentAction.type,
            payload: {
                name: payload?.params?.screen,
                params: payload?.params?.params,
                path: payload?.params?.path,
            },
            target: currentTargetKey,
        };
    }
    return currentAction;
}

function isModalNavigator(targetNavigator?: string) {
    return targetNavigator === NAVIGATORS.LEFT_MODAL_NAVIGATOR || targetNavigator === NAVIGATORS.RIGHT_MODAL_NAVIGATOR;
}

export default function linkTo(navigation: NavigationContainerRef<RootStackParamList> | null, path: Route, type?: string, isActiveRoute?: boolean) {
    if (!navigation) {
        throw new Error("Couldn't find a navigation object. Is your component inside a screen in a navigator?");
    }

    let root: NavigationRoot = navigation;
    let current: NavigationRoot | undefined;

    // Traverse up to get the root navigation
    // eslint-disable-next-line no-cond-assign
    while ((current = root.getParent())) {
        root = current;
    }

    const rootState = root.getState();
    const state = getStateFromPath(path);
    const action: StackNavigationAction = getActionFromState(state, linkingConfig.config);

    // If action type is different than NAVIGATE we can't change it to the PUSH safely
    if (action?.type === CONST.NAVIGATION.ACTION_TYPE.NAVIGATE) {
        const topRouteName = rootState?.routes?.at(-1)?.name;
        const isTargetNavigatorOnTop = topRouteName === action.payload.name;

        // In case if type is 'FORCED_UP' we replace current screen with the provided. This means the current screen no longer exists in the stack
        if (type === CONST.NAVIGATION.TYPE.FORCED_UP) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.REPLACE;

            // If this action is navigating to the report screen and the top most navigator is different from the one we want to navigate - PUSH the new screen to the top of the stack
        } else if (action.payload.name === NAVIGATORS.CENTRAL_PANE_NAVIGATOR && getTopmostReportId(rootState) !== getTopmostReportId(state)) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;

            // If the type is UP, we deeplinked into one of the RHP flows and we want to replace the current screen with the previous one in the flow
            // and at the same time we want the back button to go to the page we were before the deeplink
        } else if (type === CONST.NAVIGATION.TYPE.UP) {
            action.type = CONST.NAVIGATION.ACTION_TYPE.REPLACE;

            // If this action is navigating to the ModalNavigator and the last route on the root navigator is not already opened ModalNavigator then push
        } else if (isModalNavigator(action.payload.name) && !isTargetNavigatorOnTop) {
            if (isModalNavigator(topRouteName)) {
                dismissModal('', navigation);
            }
            action.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;
        }
    }

    if (action && 'payload' in action && action.payload && 'name' in action.payload && isModalNavigator(action.payload.name)) {
        const minimalAction = getMinimalAction(action, navigation.getRootState());
        if (minimalAction) {
            // There are situations where a route already exists on the current navigation stack
            // But we want to push the same route instead of going back in the stack
            // Which would break the user navigation history
            if (!isActiveRoute && type === CONST.NAVIGATION.ACTION_TYPE.PUSH) {
                minimalAction.type = CONST.NAVIGATION.ACTION_TYPE.PUSH;
            }
            // There are situations when the user is trying to access a route which he has no access to
            // So we want to redirect him to the right one and replace the one he tried to access
            if (type === CONST.NAVIGATION.ACTION_TYPE.REPLACE) {
                minimalAction.type = CONST.NAVIGATION.ACTION_TYPE.REPLACE;
            }
            root.dispatch(minimalAction);
            return;
        }
    }

    if (action !== undefined) {
        root.dispatch(action);
    } else {
        root.reset(state);
    }
}
