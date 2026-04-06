import { Tabs, useRouter } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Home, Sprout, FileText, MessageSquare, User, Bell } from 'lucide-react-native';
import { useAuthStore } from '../../src/stores';
import { useUnreadCounts } from '../../src/config/unread-context';

export default function TabLayout() {
	const router = useRouter();
	const { userRole } = useAuthStore();
	const { unreadCounts } = useUnreadCounts();

	const totalNotifications = unreadCounts.notifications + unreadCounts.chat;
	const isFarmer = userRole === 'farmer';

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: '#ffffff',
					borderTopWidth: 1,
					borderTopColor: '#eaf0ea',
					paddingBottom: Platform.OS === 'ios' ? 20 : 8,
					paddingTop: 8,
					height: Platform.OS === 'ios' ? 88 : 68,
				},
				tabBarActiveTintColor: '#4cae4f',
				tabBarInactiveTintColor: '#9ca3af',
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: '600',
					marginTop: 4,
				},
				tabBarItemStyle: {
					flex: 1,
				},
			}}
		>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: isFarmer ? 'My Farm' : 'Portfolio',
					tabBarIcon: ({ color, size }) => (
						<Home size={size} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="marketplace"
				options={{
					title: 'Marketplace',
					tabBarIcon: ({ color, size }) => (
						<Sprout size={size} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="contracts"
				options={{
					title: 'Contracts',
					tabBarIcon: ({ color, size }) => (
						<FileText size={size} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="chat"
				options={{
					title: 'Messages',
					tabBarIcon: ({ color, size }) => (
						<View style={{ position: 'relative' }}>
							<MessageSquare size={size} color={color} />
							{unreadCounts.chat > 0 && (
								<View
									style={{
										position: 'absolute',
										top: -4,
										right: -8,
										backgroundColor: '#ef4444',
										borderRadius: 10,
										minWidth: 18,
										height: 18,
										justifyContent: 'center',
										alignItems: 'center',
										paddingHorizontal: 4,
									}}
								>
									<Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
										{unreadCounts.chat > 99 ? '99+' : unreadCounts.chat}
									</Text>
								</View>
							)}
						</View>
					),
				}}
			/>

			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ color, size }) => (
						<View style={{ position: 'relative' }}>
							<User size={size} color={color} />
							{totalNotifications > 0 && (
								<View
									style={{
										position: 'absolute',
										top: -4,
										right: -8,
										backgroundColor: '#ef4444',
										borderRadius: 10,
										minWidth: 18,
										height: 18,
										justifyContent: 'center',
										alignItems: 'center',
										paddingHorizontal: 4,
									}}
								>
									<Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
										{totalNotifications > 99 ? '99+' : totalNotifications}
									</Text>
								</View>
							)}
						</View>
					),
				}}
			/>
		</Tabs>
	);
}
