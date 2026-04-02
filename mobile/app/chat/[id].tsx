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
} from "react-native";
import { Camera, MapPin, Mic, Send, Play } from "lucide-react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../../src/components/ui/Header";
import { useUserStore, useSocketStore } from "../../src/stores";
import api, { ChatMessage, Conversation, BASE_URL } from "../../src/config/api";
import { useAuthStore } from "../../src/stores/authStore";

export default function ChatScreen() {
	const { id } = useLocalSearchParams();
	const { profile } = useUserStore();
	const { authUser } = useAuthStore();
	const { socket } = useSocketStore();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputText, setInputText] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [otherUser, setOtherUser] = useState<{
		name: string;
		avatar: string;
	}>({ name: "User", avatar: "" });
	const scrollViewRef = useRef<ScrollView>(null);

	const fetchMessages = useCallback(async () => {
		try {
			const res = await api.get<{ data: ChatMessage[] }>(`/api/chat/conversations/${id}/messages`);
			const data: ChatMessage[] = res.data.data || [];
			setMessages(data);

			// Get conversation details for other user
			const convRes = await api
				.get<{ data: Conversation[] }>("/api/chat/conversations")
				.catch(() => null);
			if (convRes) {
				const conversations: Conversation[] = convRes.data.data || [];
				const conv = conversations.find((c) => c.id === id);
				if (conv?.other_user) {
					setOtherUser({
						name: conv.other_user.name || "User",
						avatar:
							conv.other_user.avatar_url ||
							`https://i.pravatar.cc/100?u=${conv.other_user.id}`,
					});
				}
			}
		} catch {
		} finally {
			setLoading(false);
		}
	}, [id]);

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
		const text = inputText.trim();
		setInputText("");
		setSending(true);
		try {
			await api.post(`/api/chat/conversations/${id}/messages`, { text });
			await fetchMessages();
			scrollViewRef.current?.scrollToEnd({ animated: true });
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
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-background-light dark:bg-background-dark"
		>
			<StatusBar barStyle="dark-content" />

			<Header
				variant="back-avatar"
				userName={otherUser.name}
				userStatus="Online"
				userAvatar={otherUser.avatar}
				onActionPress={() => {}}
			/>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#4cae4f" />
				</View>
			) : (
				<ScrollView
					ref={scrollViewRef}
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingVertical: 20,
						paddingBottom: 150,
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
			)}

			<View className="bg-white/80 dark:bg-[#1e291e]/80 backdrop-blur-xl border-t border-[#eaf0ea] dark:border-[#2a382a] px-4 pt-4 pb-10">
				<View className="flex-row items-center gap-2">
					<View className="flex-row bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl p-1 gap-1 border border-gray-100/50 dark:border-white/5">
						<TouchableOpacity className="size-10 items-center justify-center rounded-xl">
							<Camera
								size={20}
								color="#608562"
								strokeWidth={2.2}
							/>
						</TouchableOpacity>
						<TouchableOpacity className="size-10 items-center justify-center rounded-xl">
							<MapPin
								size={20}
								color="#608562"
								strokeWidth={2.2}
							/>
						</TouchableOpacity>
					</View>

					<View className="flex-1 h-12 bg-white dark:bg-gray-900 rounded-full px-5 flex-row items-center border border-[#eaf0ea] dark:border-[#2a382a] shadow-sm shadow-black/5">
						<TextInput
							placeholder="Type message..."
							placeholderTextColor="#8ba88c"
							value={inputText}
							onChangeText={setInputText}
							onSubmitEditing={handleSend}
							returnKeyType="send"
							className="flex-1 h-full text-[15px] text-[#111811] dark:text-white font-semibold"
						/>
						<TouchableOpacity className="p-1">
							<Mic size={20} color="#4cae4f" strokeWidth={2.2} />
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						onPress={handleSend}
						disabled={!inputText.trim() || sending}
						className={`size-12 rounded-full items-center justify-center shadow-lg ${inputText.trim() ? "bg-[#4cae4f] shadow-[#4cae4f]/30" : "bg-gray-300 dark:bg-gray-700"}`}
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
		</KeyboardAvoidingView>
	);
}
