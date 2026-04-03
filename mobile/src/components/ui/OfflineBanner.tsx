import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';

/**
 * OfflineBanner component
 * Shows a banner at the top of the screen when the device is offline.
 * Automatically listens to network state changes.
 */
export function OfflineBanner() {
	const [isConnected, setIsConnected] = useState<boolean>(true);
	const [slideAnim] = useState(new Animated.Value(-50));

	useEffect(() => {
		// Subscribe to network state changes
		const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
			const connected = state.isConnected ?? false;
			setIsConnected(connected);

			// Animate banner in/out
			Animated.spring(slideAnim, {
				toValue: connected ? -50 : 0,
				useNativeDriver: true,
				tension: 65,
				friction: 11,
			}).start();
		});

		// Get initial state
		NetInfo.fetch().then((state: NetInfoState) => {
			setIsConnected(state.isConnected ?? false);
		});

		return () => unsubscribe();
	}, [slideAnim]);

	if (isConnected) return null;

	return (
		<Animated.View
			style={{
				transform: [{ translateY: slideAnim }],
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 9999,
			}}
		>
			<View className="bg-red-500 px-4 py-2 flex-row items-center justify-center gap-2">
				<WifiOff size={16} color="white" />
				<Text className="text-white font-semibold text-sm">
					You are offline. Some features may not work.
				</Text>
			</View>
		</Animated.View>
	);
}
