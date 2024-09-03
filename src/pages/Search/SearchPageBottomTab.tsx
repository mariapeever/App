import React, {useMemo} from 'react';
import {View} from 'react-native';
import type {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import FullPageNotFoundView from '@components/BlockingViews/FullPageNotFoundView';
import ScreenWrapper from '@components/ScreenWrapper';
import Search from '@components/Search';
import SearchStatusBar from '@components/Search/SearchStatusBar';
import useActiveCentralPaneRoute from '@hooks/useActiveCentralPaneRoute';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import useWindowDimensions from '@hooks/useWindowDimensions';
import Navigation from '@libs/Navigation/Navigation';
import type {AuthScreensParamList} from '@libs/Navigation/types';
import * as SearchUtils from '@libs/SearchUtils';
import TopBar from '@navigation/AppNavigator/createCustomBottomTabNavigator/TopBar';
import variables from '@styles/variables';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SCREENS from '@src/SCREENS';
import SearchSelectionModeHeader from './SearchSelectedModeHeader';
import SearchTypeMenu from './SearchTypeMenu';

const TOO_CLOSE_TO_TOP_DISTANCE = 20;
const TOO_CLOSE_TO_BOTTOM_DISTNACE = 10;
const ANIMATION_DURATION_IN_MS = 300;

function SearchPageBottomTab() {
    const {translate} = useLocalize();
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const {windowHeight} = useWindowDimensions();
    const activeCentralPaneRoute = useActiveCentralPaneRoute();
    const styles = useThemeStyles();
    const [selectionMode] = useOnyx(ONYXKEYS.MOBILE_SELECTION_MODE);

    const scrollOffset = useSharedValue(0);
    const topBarOffset = useSharedValue(0);
    const headerHeight = useSharedValue(variables.searchHeaderHeight + variables.typeAndStatusBarHeight);
    const animatedTopBarStyle = useAnimatedStyle(() => ({
        transform: [{translateY: topBarOffset.value}],
        zIndex: -1,
    }));
    const animatedHeaderStyle = useAnimatedStyle(() => ({
        height: headerHeight.value,
    }));

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const {contentOffset, layoutMeasurement, contentSize} = event.nativeEvent;
        if (windowHeight > contentSize.height) {
            return;
        }

        const currentOffset = contentOffset.y;
        const isScrollingDown = currentOffset > scrollOffset.value;
        if (isScrollingDown && contentOffset.y > TOO_CLOSE_TO_TOP_DISTANCE) {
            const distanceScrolled = currentOffset - scrollOffset.value;
            // eslint-disable-next-line react-compiler/react-compiler
            topBarOffset.value = Math.max(-variables.typeAndStatusBarHeight, topBarOffset.value - distanceScrolled);
            headerHeight.value = Math.max(variables.searchHeaderHeight, headerHeight.value - distanceScrolled);
        } else if (!isScrollingDown && contentOffset.y + layoutMeasurement.height < contentSize.height - TOO_CLOSE_TO_BOTTOM_DISTNACE) {
            topBarOffset.value = withTiming(0, {duration: ANIMATION_DURATION_IN_MS});
            headerHeight.value = withTiming(variables.searchHeaderHeight + variables.typeAndStatusBarHeight, {duration: ANIMATION_DURATION_IN_MS});
        }

        scrollOffset.value = currentOffset;
    };

    const {queryJSON, policyID, isCustomQuery} = useMemo(() => {
        if (activeCentralPaneRoute?.name !== SCREENS.SEARCH.CENTRAL_PANE) {
            return {queryJSON: undefined, policyID: undefined, isCustomQuery: undefined};
        }

        const searchParams = activeCentralPaneRoute?.params as AuthScreensParamList[typeof SCREENS.SEARCH.CENTRAL_PANE];
        const parsedQuery = SearchUtils.buildSearchQueryJSON(searchParams?.q);

        return {
            queryJSON: parsedQuery,
            policyID: parsedQuery && SearchUtils.getPolicyIDFromSearchQuery(parsedQuery),
            isCustomQuery: searchParams.isCustomQuery,
        };
    }, [activeCentralPaneRoute]);

    const handleOnBackButtonPress = () => Navigation.goBack(ROUTES.SEARCH_CENTRAL_PANE.getRoute({query: SearchUtils.buildCannedSearchQuery()}));

    if (!queryJSON) {
        return (
            <ScreenWrapper
                testID={SearchPageBottomTab.displayName}
                style={styles.pv0}
                offlineIndicatorStyle={styles.mtAuto}
            >
                <FullPageNotFoundView
                    shouldShow={!queryJSON}
                    onBackButtonPress={handleOnBackButtonPress}
                    shouldShowLink={false}
                />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper
            testID={SearchPageBottomTab.displayName}
            style={styles.pv0}
            offlineIndicatorStyle={styles.mtAuto}
        >
            {!selectionMode?.isEnabled ? (
                <Animated.View style={animatedHeaderStyle}>
                    <View style={styles.appBG}>
                        <TopBar
                            activeWorkspaceID={policyID}
                            breadcrumbLabel={translate('common.search')}
                            shouldDisplaySearch={false}
                        />
                    </View>
                    <Animated.View style={animatedTopBarStyle}>
                        <SearchTypeMenu
                            isCustomQuery={isCustomQuery}
                            queryJSON={queryJSON}
                        />
                        {shouldUseNarrowLayout && (
                            <SearchStatusBar
                                type={queryJSON.type}
                                status={queryJSON.status}
                            />
                        )}
                    </Animated.View>
                </Animated.View>
            ) : (
                <SearchSelectionModeHeader
                    queryJSON={queryJSON}
                    isCustomQuery={isCustomQuery}
                />
            )}
            {shouldUseNarrowLayout && (
                <Search
                    queryJSON={queryJSON}
                    onSearchListScroll={handleScroll}
                    contentContainerStyle={!selectionMode?.isEnabled ? styles.mt3 : undefined}
                />
            )}
        </ScreenWrapper>
    );
}

SearchPageBottomTab.displayName = 'SearchPageBottomTab';

export default SearchPageBottomTab;
