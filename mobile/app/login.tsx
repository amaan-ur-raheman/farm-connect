import React, { useState, useRef, useEffect } from "react";
import {
	View,
	Text,
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
	useColorScheme,
	TouchableOpacity,
} from "react-native";
import { Phone, Sprout, Lock, ShieldCheck, Fingerprint } from "lucide-react-native";
import { router } from "expo-router";
import { Input, Button, Card, EmptyState } from "../src/components/ui";
import { useAuthStore } from "../src/stores";
import { validatePhone, validateOtp } from "../src/utils/validation";
import { haptic } from "../src/utils/haptics";
import { biometric } from "../src/utils/biometric";
import { BASE_URL, testConnection } from "../src/config/api";
import { colors, spacing, radii, typography, theme, getShadow } from "../src/config/theme";

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

	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const t = isDark ? theme.dark : theme.light;

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
		const checkBiometric = async () => {
			const enabled = await biometric.isBiometricEnabled();
			const compatible = await biometric.isCompatible();
			const enrolled = await biometric.isEnrolled();

			if (enabled && compatible && enrolled) {
				setShowBiometric(true);
			}
		};
		checkBiometric();

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
		haptic.light();
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
		haptic.light();
		if (!isOtpValid) {
			haptic.error();
			Alert.alert("Invalid OTP", otpValidation.error);
			return;
		}

		const success = await loginWithOtp(phone, otp);
		if (success) {
			haptic.success();
			router.replace("/(tabs)/dashboard");
		} else {
			haptic.error();
			Alert.alert("Error", error || "Invalid OTP. Please try again.");
		}
	};

	const handleBiometricLogin = async () => {
		setBiometricLoading(true);
		try {
			const success = await biometric.authenticate('Login to FarmConnect');

			if (success) {
				haptic.success();
				const biometricPhone = await biometric.getBiometricPhone();
				const { authUser, refreshTokens, accessToken } = useAuthStore.getState();

				if (!authUser?.phone || (biometricPhone && biometricPhone !== authUser.phone)) {
					Alert.alert('Different Account', 'Biometric login is for a different account. Please login with OTP.');
					return;
				}

				if (accessToken) {
					router.replace("/(tabs)/dashboard");
				} else {
					const newToken = await refreshTokens();
					if (newToken) {
						router.replace("/(tabs)/dashboard");
					} else {
						Alert.alert('Session Expired', 'Please login with OTP again.');
					}
				}
			}
		} catch (error) {
			console.error('Biometric login failed:', error);
		} finally {
			setBiometricLoading(false);
		}
	};

	const handleRoleSelect = (role: "farmer" | "consumer") => {
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

	const logoIconColor = !otpSent ? t.primary : t.textTertiary;
	const roleActiveBg = t.surface;
	const roleInactiveText = t.textSecondary;
	const roleActiveText = t.text;

	return (
		<ImageBackground
			source={{
				uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
			}}
			style={styles.container}
		>
			<StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
			<View
				style={[
					styles.container,
					{ backgroundColor: isDark ? "rgba(15, 26, 15, 0.85)" : "rgba(240, 253, 244, 0.85)" },
				]}
			>
				<ScrollView
					ref={scrollViewRef}
					style={styles.scrollView}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: keyboardHeight + spacing.lg },
					]}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					bounces={false}
				>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<Card variant="elevated" padding="2xl" style={styles.card}>
							{/* Logo */}
							<View
								style={{
									width: 56,
									height: 56,
									backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "rgba(76, 175, 80, 0.1)",
									borderRadius: radii.lg,
									alignItems: "center",
									justifyContent: "center",
									marginBottom: spacing.md,
									alignSelf: "center",
								}}
							>
								<Sprout
									size={28}
									color={t.primary}
									strokeWidth={1.5}
								/>
							</View>

							<Text
								style={{
									...typography.display,
									color: t.text,
									textAlign: "center",
								}}
							>
								Welcome Back
							</Text>
							<Text
								style={{
									...typography.bodySm,
									color: t.textSecondary,
									textAlign: "center",
									marginTop: spacing.sm,
									marginBottom: spacing.xl,
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
											handleRoleSelect("consumer")
										}
										style={[
											styles.roleButton,
											{
												backgroundColor: userRole === "consumer" ? roleActiveBg : "transparent",
												...(userRole === "consumer" ? getShadow("sm", isDark) : {}),
											},
										]}
										accessibilityRole="button"
										accessibilityLabel="Select Investor role"
										accessibilityState={{ selected: userRole === "consumer" }}
									>
										<Text
											style={{
												...typography.labelSm,
												color: userRole === "consumer" ? roleActiveText : roleInactiveText,
											}}
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
											{
												backgroundColor: userRole === "farmer" ? roleActiveBg : "transparent",
												...(userRole === "farmer" ? getShadow("sm", isDark) : {}),
											},
										]}
										accessibilityRole="button"
										accessibilityLabel="Select Farmer role"
										accessibilityState={{ selected: userRole === "farmer" }}
									>
										<Text
											style={{
												...typography.labelSm,
												color: userRole === "farmer" ? roleActiveText : roleInactiveText,
											}}
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
										color={logoIconColor}
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
								<View style={{ marginTop: spacing.sm }}>
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
											<Lock size={20} color={t.primary} />
										}
										returnKeyType="go"
										onSubmitEditing={handleVerifyOtp}
									/>

									{devOtpHint && (
										<View
											style={{
												backgroundColor: isDark ? "rgba(66, 32, 6, 0.4)" : colors.accent[50],
												borderRadius: radii.md,
												paddingHorizontal: spacing.lg,
												paddingVertical: spacing.md,
												marginBottom: spacing.md,
												borderWidth: 1,
												borderColor: isDark ? colors.accent[700] : colors.accent[200],
											}}
										>
											<Text
												style={{
													...typography.caption,
													fontWeight: "700",
													color: isDark ? colors.accent[300] : colors.accent[600],
													textTransform: "uppercase",
													letterSpacing: 1,
													marginBottom: spacing.xs,
												}}
											>
												Developer Mode
											</Text>
											<Text
												style={{
													...typography.bodySm,
													fontWeight: "500",
													color: isDark ? colors.accent[400] : colors.warning.light,
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
											paddingVertical: spacing.md,
											marginBottom: spacing.md,
											minHeight: 44,
											justifyContent: "center",
										}}
										accessibilityRole="button"
										accessibilityLabel="Resend OTP code"
									>
										<Text
											style={{
												...typography.bodySm,
												fontWeight: "500",
												color: t.primary,
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
										backgroundColor: isDark ? "rgba(127, 29, 29, 0.4)" : colors.error.light + "10",
										borderRadius: radii.md,
										paddingHorizontal: spacing.lg,
										paddingVertical: spacing.md,
										marginBottom: spacing.md,
										borderWidth: 1,
										borderColor: isDark ? "rgba(248, 113, 113, 0.4)" : colors.error.light + "20",
										width: "100%",
									}}
								>
									<Text
										style={{
											...typography.bodySm,
											fontWeight: "500",
											color: isDark ? colors.error.dark : colors.error.light,
										}}
									>
										{error}
									</Text>
								</View>
							)}

							{/* Biometric Login Button */}
							{showBiometric && !otpSent && (
								<>
									<View style={styles.dividerRow}>
										<View style={[styles.dividerLine, { backgroundColor: t.border }]} />
										<Text style={{ ...typography.caption, color: t.textSecondary, fontWeight: "500", marginHorizontal: spacing.sm }}>
											Or login with
										</Text>
										<View style={[styles.dividerLine, { backgroundColor: t.border }]} />
									</View>
									<TouchableOpacity
										onPress={handleBiometricLogin}
										disabled={biometricLoading}
										activeOpacity={0.8}
										style={{
											width: '100%',
											paddingVertical: spacing.xl,
											borderRadius: radii.lg,
											backgroundColor: t.surface,
											borderWidth: 2,
											borderColor: t.primary,
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'center',
											gap: spacing.sm,
											minHeight: 56,
										}}
										accessibilityRole="button"
										accessibilityLabel="Login with biometric"
									>
										{biometricLoading ? (
											<ActivityIndicator size="small" color={t.primary} />
										) : (
											<>
												<Fingerprint size={24} color={t.primary} />
												<Text style={{ ...typography.label, color: t.primary }}>
													Use Biometric
												</Text>
											</>
										)}
									</TouchableOpacity>
								</>
							)}

							{/* Submit Button */}
							<Button
								label={submitText}
								onPress={!otpSent ? handleSendOtp : handleVerifyOtp}
								disabled={isSubmitDisabled}
								loading={isLoading}
								size="lg"
								fullWidth
								style={styles.submitButton}
							/>

							{/* Sign Up Link */}
							<View
								style={{
									marginTop: spacing.xl,
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									gap: spacing.xs,
								}}
							>
								<Text
									style={{
										...typography.bodySm,
										color: t.textSecondary,
									}}
								>
									Don't have an account?
								</Text>
								<TouchableOpacity
									onPress={() => router.push("/register")}
									style={{ minHeight: 44, justifyContent: "center" }}
									accessibilityRole="link"
									accessibilityLabel="Sign up for a new account"
								>
									<Text
										style={{
											...typography.bodySm,
											fontWeight: "700",
											color: t.primary,
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
									marginTop: spacing.lg,
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.sm,
									backgroundColor: isDark ? t.divider : t.divider,
									paddingHorizontal: spacing.lg,
									paddingVertical: spacing.sm,
									borderRadius: radii.sm,
									justifyContent: "center",
								}}
							>
								<ShieldCheck size={14} color={t.textTertiary} />
								<Text
									style={{
										...typography.caption,
										color: t.textSecondary,
										fontWeight: "500",
									}}
								>
									Secure login with OTP verification
								</Text>
							</View>
						</Card>
					</TouchableWithoutFeedback>
				</ScrollView>
			</View>
		</ImageBackground>
	);
}

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
		padding: spacing.lg,
	},
	card: {
		maxWidth: 480,
		width: "100%",
		alignSelf: "center",
	},
	roleButtonContainer: {
		flexDirection: "row",
		backgroundColor: colors.primary[100],
		padding: spacing.xs,
		borderRadius: radii.md,
		marginBottom: spacing.xl,
		width: "100%",
	},
	roleButton: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: radii.sm,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: spacing.sm,
		minHeight: 44,
	},
	submitButton: {
		marginTop: spacing.sm,
	},
	dividerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.lg,
	},
	dividerLine: {
		flex: 1,
		height: 1,
	},
});
