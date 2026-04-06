import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	View,
	Text,
	ScrollView,
	Image,
	TouchableOpacity,
	StatusBar,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Keyboard,
} from "react-native";
import { Camera, MapPin, Send, Play } from "lucide-react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../../src/components/ui/Header";
import { useUserStore, useSocketStore } from "../../src/stores";
import api, { ChatMessage, BASE_URL } from "../../src/config/api";
import { useAuthStore } from "../../src/stores/authStore";
import { haptic } from "../../src/utils/haptics";

export default function ChatScreen() {
	const { id } = useLocalSearchParams();
	const { profile } = useUserStore();
	const { authUser } = useAuthStore();
	const { socket } = useSocketStore();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputText, setInputText] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [inputHeight, setInputTextHeight] = useState(48);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [otherUser, setOtherUser] = useState<{
		name: string;
		avatar: string;
	}>({ name: "User", avatar: "" });
	const scrollViewRef = useRef<ScrollView>(null);

	// Keyboard event listeners
	useEffect(() => {
		// Use keyboardWillShow for iOS (better timing), keyboardDidShow for Android
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
		
		const keyboardDidShowListener = Keyboard.addListener(
			showEvent,
			(e) => {
				const kbHeight = e.endCoordinates.height;
				console.log('[Chat] Keyboard SHOW - height:', kbHeight, 'platform:', Platform.OS);
				setKeyboardHeight(kbHeight);
				// Scroll to bottom when keyboard appears
				setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
			}
		);
		const keyboardDidHideListener = Keyboard.addListener(
			hideEvent,
			(e) => {
				console.log('[Chat] Keyboard HIDE');
				setKeyboardHeight(0);
			}
		);

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	const fetchMessages = useCallback(async () => {
		try {
			// Fetch conversation details to get participant info
			const convRes = await api.get<{ 
				participant_one: { id: string; name: string | null; avatar_url: string | null };
				participant_two: { id: string; name: string | null; avatar_url: string | null };
			}>(`/api/chat/conversations/${id}`);
			const conversation = convRes.data.data || convRes.data;

			// Determine the other participant
			const currentUserId = authUser?.id;
			const participantOne = conversation.participant_one;
			const participantTwo = conversation.participant_two;

			const otherParticipant = participantOne?.id === currentUserId
				? participantTwo
				: participantOne;

			if (otherParticipant) {
				setOtherUser({
					name: otherParticipant.name || "User",
					avatar: otherParticipant.avatar_url || `https://i.pravatar.cc/100?u=${otherParticipant.id}`,
				});
			}

			// Fetch messages
			const res = await api.get<{ data: ChatMessage[] }>(`/api/chat/conversations/${id}/messages`);
			const data: ChatMessage[] = res.data.data || [];
			setMessages(data);
		} catch (err) {
			console.error('Failed to fetch chat data:', err);
		} finally {
			setLoading(false);
		}
	}, [id, authUser?.id]);

	useEffect(() => {
		// Load message history via REST
		fetchMessages();

		if (!socket) return;

		const onNewMessage = (msg: ChatMessage) => {
			if (msg.conversation_id === id) {
				setMessages((prev) => {
					// Deduplicate by id
					if (prev.some((m) => m.id === msg.id)) return prev;
					return [...prev, msg];
				});
			}
		};

		socket.on("new_message", onNewMessage);

		return () => {
			socket.off("new_message", onNewMessage);
		};
	}, [id, socket, fetchMessages]);

	const handleSend = async () => {
		if (!inputText.trim() || sending) return;
		haptic.light();
		const text = inputText.trim();
		setInputText("");
		setInputTextHeight(48);
		setSending(true);
		try {
			await api.post(`/api/chat/conversations/${id}/messages`, { text });
			setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
		} catch {
			setInputText(text); // restore on error
		} finally {
			setSending(false);
		}
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const isOwnMessage = (msg: ChatMessage) => msg.sender_id === authUser?.id;

	return (
		<View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
			<StatusBar barStyle="dark-content" />

			<Header
				variant="back-avatar"
				userName={otherUser.name}
				userStatus="Online"
				userAvatar={otherUser.avatar}
				onActionPress={() => {}}
			/>

			<View className="flex-1">
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					className="flex-1"
					keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
				>
					{loading ? (
						<View className="flex-1 items-center justify-center">
							<ActivityIndicator size="large" color="#4cae4f" />
						</View>
					) : (
						<>
							<ScrollView
								ref={scrollViewRef}
								className="flex-1"
								showsVerticalScrollIndicator={false}
								keyboardShouldPersistTaps="handled"
								contentContainerStyle={{
									paddingHorizontal: 16,
									paddingVertical: 20,
								}}
								onContentSizeChange={() =>
									scrollViewRef.current?.scrollToEnd({ animated: false })
								}
							>
					{messages.length === 0 ? (
						<View className="flex-1 items-center justify-center py-20">
							<Text className="text-sm text-gray-500">
								No messages yet. Say hello!
							</Text>
						</View>
					) : (
						messages.map((msg, index) => {
							const isOwn = isOwnMessage(msg);
							const showTimestamp =
								index === 0 ||
								new Date(msg.created_at).getTime() -
									new Date(
										messages[index - 1].created_at,
									).getTime() >
									300000;

							return (
								<View key={msg.id}>
									{showTimestamp && (
										<View className="items-center my-4">
											<View className="bg-gray-200/50 dark:bg-gray-800/50 px-4 py-1.5 rounded-full">
												<Text className="text-[10px] font-black text-[#608562] dark:text-[#8ba88c] uppercase tracking-widest">
													{new Date(
														msg.created_at,
													).toLocaleDateString()}{" "}
													{formatTime(msg.created_at)}
												</Text>
											</View>
										</View>
									)}
									<View
										className={`flex-row items-end gap-3 mb-4 ${isOwn ? "justify-end" : "justify-start"}`}
									>
										{!isOwn && (
											<View className="size-10 rounded-full border border-[#eaf0ea] overflow-hidden bg-slate-100">
												<Image
													source={{
														uri:
															otherUser.avatar ||
															"https://i.pravatar.cc/100?u=farmer",
													}}
													className="w-full h-full"
												/>
											</View>
										)}

										<View className={`max-w-[80%]`}>
											<View
												className={`p-4 shadow-sm ${
													isOwn
														? "bg-primary rounded-2xl rounded-br-none"
														: "bg-white dark:bg-surface-dark border border-[#f0f4f0] dark:border-[#2a382a] rounded-2xl rounded-bl-none"
												}`}
											>
												{msg.text && (
													<Text
														className={`text-base leading-relaxed font-bold ${isOwn ? "text-black" : "text-[#111811] dark:text-white"}`}
													>
														{msg.text}
													</Text>
												)}
												{msg.media_url && (
													<View className="w-full aspect-[4/3] rounded-xl overflow-hidden mt-3 bg-slate-50 border border-slate-100 dark:border-slate-800">
														<Image
															source={{
																uri: msg.media_url,
															}}
															className="w-full h-full"
															resizeMode="cover"
														/>
													</View>
												)}
											</View>
										</View>

										{isOwn && (
											<View className="size-10 rounded-full border-2 border-primary overflow-hidden">
												<Image
													source={{
														uri:
															profile?.avatar ||
															`https://i.pravatar.cc/100?u=${authUser?.id}`,
													}}
													className="w-full h-full"
												/>
											</View>
										)}
									</View>
								</View>
							);
						})
					)}
							</ScrollView>

							<View className="bg-white dark:bg-[#1e291e] border-t border-[#eaf0ea] dark:border-[#2a382a] px-4 pt-3" style={{ paddingBottom: 8 + keyboardHeight }}>
								<View className="flex-row items-end gap-2">
					<View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1 border border-gray-100 dark:border-white/5 mb-1">
						<TouchableOpacity className="size-10 items-center justify-center rounded-xl">
							<Camera
								size={20}
								color="#608562"
								strokeWidth={2.2}
							/>
						</TouchableOpacity>
					</View>

					<View className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-[24px] px-4 py-1 flex-row items-end border border-[#eaf0ea] dark:border-[#2a382a]">
						<TextInput
							placeholder="Message..."
							placeholderTextColor="#8ba88c"
							value={inputText}
							onChangeText={setInputText}
							multiline
							onContentSizeChange={(e) => {
								const newHeight = Math.min(120, Math.max(48, e.nativeEvent.contentSize.height + 10));
								setInputTextHeight(newHeight);
								// Auto-scroll when typing in multi-line
								if (newHeight > 48) {
									setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
								}
							}}
							onFocus={() => {
								// Scroll to bottom when input is focused
								setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
							}}
							style={{ height: inputHeight }}
							className="flex-1 text-[15px] text-[#111811] dark:text-white font-semibold py-2"
						/>
					</View>

					<TouchableOpacity
						onPress={handleSend}
						disabled={!inputText.trim() || sending}
						className={`size-12 rounded-full items-center justify-center shadow-lg mb-0.5 ${inputText.trim() ? "bg-[#4cae4f] shadow-[#4cae4f]/30" : "bg-gray-300 dark:bg-gray-700"}`}
					>
						<Send
							size={22}
							color="white"
							strokeWidth={2.5}
							className="ml-0.5"
						/>
					</TouchableOpacity>
								</View>
							</View>
						</>
					)}
				</KeyboardAvoidingView>
			</View>
		</View>
	);
}
