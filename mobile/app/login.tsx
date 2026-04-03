import React, { useState, useRef, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StatusBar,
	ImageBackground,
	Platform,
	ScrollView,
	Alert,
	Keyboard,
	KeyboardEvent,
	TouchableWithoutFeedback,
	TextInput as RNTextInput,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { Phone, Sprout, Lock, ShieldCheck, Fingerprint } from "lucide-react-native";
import { router } from "expo-router";
import { Input } from "../src/components/ui/Input";
import { useAuthStore } from "../src/stores";
import { validatePhone, validateOtp } from "../src/utils/validation";
import { haptic } from "../src/utils/haptics";
import { biometric } from "../src/utils/biometric";
import { BASE_URL, testConnection } from "../src/config/api";

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		padding: 16,
	},
	card: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		padding: 32,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		maxWidth: 480,
		width: "100%",
		alignSelf: "center",
	},
	roleButtonContainer: {
		flexDirection: "row",
		backgroundColor: "#f0f4f0",
		padding: 6,
		borderRadius: 12,
		marginBottom: 32,
		width: "100%",
	},
	roleButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	roleButtonActive: {
		backgroundColor: "#ffffff",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	roleTextActive: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#111b0e",
	},
	roleTextInactive: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#6b7280",
	},
	submitButton: {
		width: "100%",
		paddingVertical: 16,
		borderRadius: 16,
		backgroundColor: "#4cae4f",
		shadowColor: "#4cae4f",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
		alignItems: "center",
		marginTop: 8,
	},
	submitButtonDisabled: {
		opacity: 0.5,
	},
});

export default function LoginScreen() {
	const [phone, setPhone] = useState("");
	const [otp, setOtp] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
	const [touchedPhone, setTouchedPhone] = useState(false);
	const [touchedOtp, setTouchedOtp] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [showBiometric, setShowBiometric] = useState(false);
	const [biometricLoading, setBiometricLoading] = useState(false);

	const {
		userRole,
		setUserRole,
		loginWithOtp,
		sendOtp,
		isLoading,
		error,
		clearError,
	} = useAuthStore();

	const phoneRef = useRef<RNTextInput>(null);
	const otpRef = useRef<RNTextInput>(null);
	const scrollViewRef = useRef<ScrollView>(null);

	useEffect(() => {
		// Check if biometric login is available and enabled
		const checkBiometric = async () => {
			const enabled = await biometric.isBiometricEnabled();
			const compatible = await biometric.isCompatible();
			const enrolled = await biometric.isEnrolled();
			
			if (enabled && compatible && enrolled) {
				setShowBiometric(true);
			}
		};
		checkBiometric();

		// Test API connection on mount
		testConnection().then(result => {
			console.log('[Login] API Connection:', result.message);
			console.log('[Login] Using API URL:', BASE_URL);
		});
		
		const showSubscription = Keyboard.addListener(
			Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
			(e: KeyboardEvent) => {
				setKeyboardHeight(e.endCoordinates.height);
			},
		);
		const hideSubscription = Keyboard.addListener(
			Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
			() => {
				setKeyboardHeight(0);
			},
		);

		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, []);

	const scrollToInput = (node: RNTextInput | null) => {
		if (node && scrollViewRef.current && keyboardHeight > 0) {
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
	};

	const phoneValidation = validatePhone(phone);
	const otpValidation = validateOtp(otp);
	const isPhoneValid = phoneValidation.isValid;
	const isOtpValid = otpValidation.isValid;

	const handlePhoneBlur = () => {
		setTouchedPhone(true);
	};

	const handleOtpBlur = () => {
		setTouchedOtp(true);
	};

	const handleSendOtp = async () => {
		if (!userRole) {
			Alert.alert(
				"Select Role",
				"Please select Investor or Farmer to continue.",
			);
			return;
		}

		if (!isPhoneValid) {
			Alert.alert("Invalid Phone", phoneValidation.error);
			return;
		}

		const result = await sendOtp(phone);
		if (result.success) {
			setOtpSent(true);
			if (result.devOtp) {
				setDevOtpHint(result.devOtp);
				Alert.alert("OTP Sent", `Your OTP is: ${result.devOtp}`, [
					{ text: "OK" },
				]);
			} else {
				Alert.alert(
					"OTP Sent",
					"Check backend terminal for the OTP code.",
				);
			}
		} else {
			Alert.alert(
				"Error",
				error || "Failed to send OTP. Please try again.",
			);
		}
	};

	const handleVerifyOtp = async () => {
		if (!isOtpValid) {
			Alert.alert("Invalid OTP", otpValidation.error);
			return;
		}

		const success = await loginWithOtp(phone, otp);
		if (success) {
			haptic.success();
			// Navigate to tab-based navigation
			router.replace("/(tabs)/dashboard");
		} else {
			Alert.alert("Error", error || "Invalid OTP. Please try again.");
		}
	};

	const handleBiometricLogin = async () => {
		setBiometricLoading(true);
		try {
			const success = await biometric.authenticate('Login to FarmConnect');
			
			if (success) {
				haptic.success();
				// Get stored phone number and login
				const { authUser } = useAuthStore.getState();
				if (authUser?.phone) {
					// We need to verify OTP silently or use a refresh token
					// For now, we'll just navigate if already authenticated
					router.replace("/(tabs)/dashboard");
				} else {
					Alert.alert('Session Expired', 'Please login with OTP again.');
				}
			}
		} catch (error) {
			console.error('Biometric login failed:', error);
		} finally {
			setBiometricLoading(false);
		}
	};

	const handleRoleSelect = (role: "farmer" | "investor") => {
		haptic.light();
		setUserRole(role);
		clearError();
	};

	const isSubmitDisabled =
		isLoading ||
		(!otpSent && (!userRole || !isPhoneValid)) ||
		(otpSent && !isOtpValid);

	const submitText = isLoading
		? "Processing..."
		: !otpSent
			? "Send OTP"
			: "Verify & Login";

	return (
		<ImageBackground
			source={{
				uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
			}}
			style={styles.container}
		>
			<StatusBar barStyle="dark-content" />
			<View
				style={[
					styles.container,
					{ backgroundColor: "rgba(246, 248, 246, 0.8)" },
				]}
			>
				<ScrollView
					ref={scrollViewRef}
					style={styles.scrollView}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: keyboardHeight + 20 },
					]}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					bounces={false}
				>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={styles.card}>
							{/* Logo */}
							<View
								style={{
									width: 56,
									height: 56,
									backgroundColor: "rgba(76, 175, 80, 0.1)",
									borderRadius: 16,
									alignItems: "center",
									justifyContent: "center",
									marginBottom: 16,
									alignSelf: "center",
								}}
							>
								<Sprout
									size={28}
									color="#3db814"
									strokeWidth={1.5}
								/>
							</View>

							<Text
								style={{
									fontSize: 28,
									fontWeight: "bold",
									color: "#111b0e",
									letterSpacing: -0.5,
									textAlign: "center",
								}}
							>
								Welcome Back
							</Text>
							<Text
								style={{
									marginTop: 8,
									fontSize: 14,
									color: "#6b7280",
									textAlign: "center",
									marginBottom: 32,
								}}
							>
								{otpSent
									? `We've sent a 6-digit code to ${phone}`
									: "Log in to manage your farm or portfolio."}
							</Text>

							{/* Role Selection */}
							{!otpSent && (
								<View style={styles.roleButtonContainer}>
									{/* Investor Button */}
									<TouchableOpacity
										onPress={() =>
											handleRoleSelect("investor")
										}
										style={[
											styles.roleButton,
											userRole === "investor" &&
												styles.roleButtonActive,
										]}
									>
										<Text
											style={
												userRole === "investor"
													? styles.roleTextActive
													: styles.roleTextInactive
											}
										>
											Investor
										</Text>
									</TouchableOpacity>

									{/* Farmer Button */}
									<TouchableOpacity
										onPress={() =>
											handleRoleSelect("farmer")
										}
										style={[
											styles.roleButton,
											userRole === "farmer" &&
												styles.roleButtonActive,
										]}
									>
										<Text
											style={
												userRole === "farmer"
													? styles.roleTextActive
													: styles.roleTextInactive
											}
										>
											Farmer
										</Text>
									</TouchableOpacity>
								</View>
							)}

							{/* Phone Input */}
							<Input
								ref={phoneRef}
								label="Phone Number"
								placeholder="+91 98765 43210"
								value={phone}
								onFocus={() => scrollToInput(phoneRef.current)}
								onChangeText={(text) => {
									setPhone(text);
									if (error) clearError();
								}}
								onBlur={handlePhoneBlur}
								error={
									touchedPhone && !isPhoneValid
										? phoneValidation.error
										: undefined
								}
								keyboardType="phone-pad"
								autoComplete="tel"
								maxLength={13}
								editable={!otpSent && !isLoading}
								icon={
									<Phone
										size={20}
										color={!otpSent ? "#4cae4f" : "#9ca3af"}
									/>
								}
								onClear={
									!otpSent ? () => setPhone("") : undefined
								}
								returnKeyType="done"
								onSubmitEditing={handleSendOtp}
							/>

							{/* OTP Input */}
							{otpSent && (
								<View style={{ marginTop: 8 }}>
									<Input
										ref={otpRef}
										label="Verification Code"
										placeholder="0 0 0 0 0 0"
										value={otp}
										onFocus={() =>
											scrollToInput(otpRef.current)
										}
										onChangeText={(text) => {
											setOtp(
												text
													.replace(/\D/g, "")
													.slice(0, 6),
											);
											if (error) clearError();
										}}
										onBlur={handleOtpBlur}
										error={
											touchedOtp && !isOtpValid
												? otpValidation.error
												: undefined
										}
										keyboardType="number-pad"
										maxLength={6}
										icon={
											<Lock size={20} color="#4cae4f" />
										}
										returnKeyType="go"
										onSubmitEditing={handleVerifyOtp}
									/>

									{devOtpHint && (
										<View
											style={{
												backgroundColor:
													"rgba(254, 252, 232, 1)",
												borderRadius: 12,
												paddingHorizontal: 16,
												paddingVertical: 12,
												marginBottom: 16,
												borderWidth: 1,
												borderColor:
													"rgba(254, 243, 199, 1)",
											}}
										>
											<Text
												style={{
													fontSize: 11,
													fontWeight: "bold",
													color: "#a16207",
													textTransform: "uppercase",
													letterSpacing: 1,
													marginBottom: 4,
												}}
											>
												Developer Mode
											</Text>
											<Text
												style={{
													fontSize: 14,
													fontWeight: "500",
													color: "#ca8a04",
													fontFamily: "monospace",
												}}
											>
												Auto-fill: {devOtpHint}
											</Text>
										</View>
									)}

									<TouchableOpacity
										onPress={() => {
											setOtpSent(false);
											setOtp("");
											setTouchedOtp(false);
										}}
										style={{
											paddingVertical: 8,
											marginBottom: 16,
										}}
									>
										<Text
											style={{
												fontSize: 14,
												fontWeight: "500",
												color: "#4cae4f",
												textAlign: "center",
											}}
										>
											Didn't receive code? Resend
										</Text>
									</TouchableOpacity>
								</View>
							)}

							{/* Error display */}
							{error && (
								<View
									style={{
										backgroundColor:
											"rgba(254, 242, 242, 1)",
										borderRadius: 12,
										paddingHorizontal: 16,
										paddingVertical: 12,
										marginBottom: 16,
										borderWidth: 1,
										borderColor: "rgba(254, 226, 226, 1)",
										width: "100%",
									}}
								>
									<Text
										style={{
											fontSize: 14,
											fontWeight: "500",
											color: "#dc2626",
										}}
									>
										{error}
									</Text>
								</View>
							)}

							{/* Biometric Login Button */}
							{showBiometric && !otpSent && (
								<>
									<View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
										<View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
										<Text style={{ marginHorizontal: 12, fontSize: 12, color: '#6b7280', fontWeight: '500' }}>
											Or login with
										</Text>
										<View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
									</View>
									<TouchableOpacity
										onPress={handleBiometricLogin}
										disabled={biometricLoading}
										activeOpacity={0.8}
										style={{
											width: '100%',
											paddingVertical: 16,
											borderRadius: 16,
											backgroundColor: 'white',
											borderWidth: 2,
											borderColor: '#4cae4f',
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'center',
											gap: 10,
										}}
									>
										{biometricLoading ? (
											<ActivityIndicator size="small" color="#4cae4f" />
										) : (
											<>
												<Fingerprint size={24} color="#4cae4f" />
												<Text style={{ color: '#4cae4f', fontWeight: 'bold', fontSize: 16 }}>
													Use Biometric
												</Text>
											</>
										)}
									</TouchableOpacity>
								</>
							)}

							{/* Submit Button */}
							<TouchableOpacity
								onPress={
									!otpSent ? handleSendOtp : handleVerifyOtp
								}
								disabled={isSubmitDisabled}
								activeOpacity={0.8}
								style={[
									styles.submitButton,
									isSubmitDisabled &&
										styles.submitButtonDisabled,
								]}
							>
								<Text
									style={{
										color: "#ffffff",
										fontWeight: "bold",
										fontSize: 16,
									}}
								>
									{submitText}
								</Text>
							</TouchableOpacity>

							{/* Sign Up Link */}
							<View
								style={{
									marginTop: 32,
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									gap: 4,
								}}
							>
								<Text
									style={{
										fontSize: 14,
										color: "#6b7280",
									}}
								>
									Don't have an account?
								</Text>
								<TouchableOpacity
									onPress={() => router.push("/register")}
								>
									<Text
										style={{
											fontSize: 14,
											fontWeight: "bold",
											color: "#4cae4f",
										}}
									>
										{" "}
										Sign up
									</Text>
								</TouchableOpacity>
							</View>

							{/* Security Badge */}
							<View
								style={{
									marginTop: 24,
									flexDirection: "row",
									alignItems: "center",
									gap: 8,
									backgroundColor: "rgba(249, 250, 251, 1)",
									paddingHorizontal: 16,
									paddingVertical: 8,
									borderRadius: 8,
									justifyContent: "center",
								}}
							>
								<ShieldCheck size={14} color="#9ca3af" />
								<Text
									style={{
										fontSize: 12,
										color: "#6b7280",
										fontWeight: "500",
									}}
								>
									Secure login with OTP verification
								</Text>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</ScrollView>
			</View>
		</ImageBackground>
	);
}
