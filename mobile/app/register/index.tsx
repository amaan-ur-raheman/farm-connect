import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TextInput as RNTextInput,
  useColorScheme,
  ActivityIndicator,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ShieldCheck,
  TrendingUp,
  Sprout,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, theme, getShadow } from '../../src/config/theme';
import { Card, Button } from '../../src/components/ui';
import { useRegistrationStore, useAuthStore } from '../../src/stores';
import { Input } from '../../src/components/ui/Input';
import {
  validatePhone,
  validateEmail,
  validateName,
} from '../../src/utils/validation';

export default function RegisterStep1() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const {
    userRole,
    setUserRole,
    formData,
    updateFormData,
    errors,
    setError,
    clearError,
  } = useRegistrationStore();

  const { sendOtp, isLoading, error } = useAuthStore();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const lastNameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const phoneRef = useRef<RNTextInput>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const validateField = (field: string, value: string) => {
    let result;
    switch (field) {
      case 'firstName':
        result = validateName(value, 'First name');
        break;
      case 'lastName':
        result = validateName(value, 'Last name');
        break;
      case 'email':
        result = validateEmail(value);
        break;
      case 'phone':
        result = validatePhone(value);
        break;
      default:
        return true;
    }

    if (!result.isValid) {
      setError(field, result.error || '');
      return false;
    } else {
      clearError(field);
      return true;
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const validateForm = () => {
    clearError('role');
    clearError('firstName');
    clearError('lastName');
    clearError('email');
    clearError('phone');
    let valid = true;

    if (!userRole) {
      setError('role', 'Please select Investor or Farmer');
      valid = false;
    }

    const firstNameValid = validateField('firstName', formData.firstName);
    const lastNameValid = validateField('lastName', formData.lastName);
    const emailValid = validateField('email', formData.email);
    const phoneValid = validateField('phone', formData.phone);

    if (!firstNameValid || !lastNameValid || !emailValid || !phoneValid) {
      valid = false;
    }

    return valid;
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before continuing.');
      return;
    }

    const result = await sendOtp(formData.phone);
    if (result.success) {
      if (result.devOtp) {
        Alert.alert(
          'OTP Sent',
          `Your OTP is: ${result.devOtp}\n\n(In production, this would be sent via SMS)`,
          [{ text: 'OK', onPress: () => router.push('/register/verification') }]
        );
      } else {
        router.push('/register/verification');
      }
    } else {
      Alert.alert('Error', error || 'Failed to send OTP. Please try again.');
    }
  };

  const getRoleCardStyles = (role: 'consumer' | 'farmer') => {
    const isSelected = userRole === role;
    const styles: { container: ViewStyle; iconContainer: ViewStyle; iconColor: string; titleColor: string; subtitleColor: string } = {
      container: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 2,
        borderColor: isSelected ? currentTheme.primary : currentTheme.border,
        backgroundColor: isSelected ? `${currentTheme.primary}0D` : currentTheme.surface,
        minHeight: 44,
      },
      iconContainer: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: isSelected ? currentTheme.primary : `${colors.primary[500]}1A`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
      },
      iconColor: isSelected ? '#FFFFFF' : colors.primary[500],
      titleColor: currentTheme.text,
      subtitleColor: currentTheme.textTertiary,
    };
    return styles;
  };

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing['2xl'],
            paddingBottom: spacing['3xl'],
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={false}
        >
          {/* Progress Bar */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <View
              style={{
                height: 6,
                backgroundColor: isDark ? '#2A382A' : colors.primary[100],
                borderRadius: radii.full,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: '25%',
                  backgroundColor: currentTheme.primary,
                  borderRadius: radii.full,
                }}
              />
            </View>
            <Text
              style={{
                ...typography.caption,
                color: currentTheme.textTertiary,
                marginTop: spacing.sm,
              }}
            >
              Step 1 of 4 {'\u2022'} Account Setup
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{
              ...typography.display,
              color: currentTheme.text,
              marginBottom: spacing.sm,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              ...typography.bodySm,
              color: currentTheme.textTertiary,
              marginBottom: spacing['2xl'],
            }}
          >
            Join FarmConnect to start your agricultural journey
          </Text>

          {/* Role Selection */}
          <Text
            style={{
              ...typography.caption,
              fontWeight: '700',
              color: currentTheme.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: spacing.md,
              marginLeft: spacing.sm,
            }}
          >
            Select your role
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'] }}>
            {/* Investor Card */}
            <TouchableOpacity
              onPress={() => { setUserRole('consumer'); clearError('role'); }}
              style={getRoleCardStyles('consumer').container}
              activeOpacity={0.8}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Investor role"
              accessibilityState={{ selected: userRole === 'consumer' }}
            >
              <View style={getRoleCardStyles('consumer').iconContainer}>
                <TrendingUp size={20} color={getRoleCardStyles('consumer').iconColor} />
              </View>
              <Text
                style={{
                  ...typography.labelSm,
                  color: getRoleCardStyles('consumer').titleColor,
                  marginBottom: spacing.sm / 2,
                }}
              >
                Investor
              </Text>
              <Text
                style={{
                  ...typography.captionXs,
                  color: getRoleCardStyles('consumer').subtitleColor,
                  fontWeight: '500',
                }}
              >
                Fund farms {'&'} earn returns
              </Text>
              {userRole === 'consumer' && (
                <View
                  style={{
                    position: 'absolute',
                    top: spacing.md,
                    right: spacing.md,
                  }}
                >
                  <ShieldCheck size={18} color={colors.primary[500]} />
                </View>
              )}
            </TouchableOpacity>

            {/* Farmer Card */}
            <TouchableOpacity
              onPress={() => { setUserRole('farmer'); clearError('role'); }}
              style={getRoleCardStyles('farmer').container}
              activeOpacity={0.8}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Farmer role"
              accessibilityState={{ selected: userRole === 'farmer' }}
            >
              <View style={getRoleCardStyles('farmer').iconContainer}>
                <Sprout size={20} color={getRoleCardStyles('farmer').iconColor} />
              </View>
              <Text
                style={{
                  ...typography.labelSm,
                  color: getRoleCardStyles('farmer').titleColor,
                  marginBottom: spacing.sm / 2,
                }}
              >
                Farmer
              </Text>
              <Text
                style={{
                  ...typography.captionXs,
                  color: getRoleCardStyles('farmer').subtitleColor,
                  fontWeight: '500',
                }}
              >
                List farm {'&'} get funding
              </Text>
              {userRole === 'farmer' && (
                <View
                  style={{
                    position: 'absolute',
                    top: spacing.md,
                    right: spacing.md,
                  }}
                >
                  <ShieldCheck size={18} color={colors.primary[500]} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          {errors.role && (
            <Text
              style={{
                ...typography.caption,
                color: currentTheme.error,
                marginBottom: spacing.md,
                marginLeft: spacing.sm,
              }}
            >
              {errors.role}
            </Text>
          )}

          {/* Form Fields */}
          <Card variant="elevated" padding="lg" style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(v: string) => {
                    updateFormData('firstName', v);
                    if (touchedFields.firstName) validateField('firstName', v);
                  }}
                  onBlur={() => handleFieldBlur('firstName', formData.firstName)}
                  placeholder="John"
                  error={errors.firstName}
                  autoComplete="name-given"
                  textContentType="givenName"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  ref={lastNameRef}
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(v: string) => {
                    updateFormData('lastName', v);
                    if (touchedFields.lastName) validateField('lastName', v);
                  }}
                  onBlur={() => handleFieldBlur('lastName', formData.lastName)}
                  placeholder="Doe"
                  error={errors.lastName}
                  autoComplete="name-family"
                  textContentType="familyName"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
            </View>

            <Input
              ref={emailRef}
              label="Email Address"
              value={formData.email}
              onChangeText={(v: string) => {
                updateFormData('email', v);
                if (touchedFields.email) validateField('email', v);
              }}
              onBlur={() => handleFieldBlur('email', formData.email)}
              placeholder="john.doe@email.com"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              icon={<Mail size={18} color={currentTheme.inputPlaceholder} />}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />

            <Input
              ref={phoneRef}
              label="Phone Number"
              value={formData.phone}
              onChangeText={(v: string) => {
                updateFormData('phone', v);
                if (touchedFields.phone) validateField('phone', v);
              }}
              onBlur={() => handleFieldBlur('phone', formData.phone)}
              placeholder="+91 98765 43210"
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              icon={<Phone size={18} color={currentTheme.inputPlaceholder} />}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </Card>

          {/* Terms */}
          <TouchableOpacity
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginTop: spacing.lg,
              gap: spacing.md,
              padding: spacing.sm,
              minHeight: 44,
            }}
            activeOpacity={0.7}
            accessible
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreedToTerms }}
            accessibilityLabel="Agree to Terms of Service and Privacy Policy"
          >
            <View
              style={{
                width: 20,
                height: 20,
                marginTop: 2,
                borderRadius: radii.sm,
                borderWidth: 2,
                borderColor: agreedToTerms ? currentTheme.primary : currentTheme.border,
                backgroundColor: agreedToTerms ? currentTheme.primary : currentTheme.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {agreedToTerms && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: currentTheme.onPrimary,
                    borderRadius: radii.full,
                  }}
                />
              )}
            </View>
            <Text
              style={{
                flex: 1,
                ...typography.caption,
                color: currentTheme.textTertiary,
                lineHeight: 20,
              }}
            >
              I agree to the{' '}
              <Text
                style={{
                  color: currentTheme.primary,
                  fontWeight: '700',
                }}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={{
                  color: currentTheme.primary,
                  fontWeight: '700',
                }}
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <View style={{ marginTop: spacing['2xl'] }}>
            <Button
              label="Continue"
              onPress={handleContinue}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={!agreedToTerms}
              fullWidth
              rightIcon={!isLoading ? <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} /> : undefined}
            />
          </View>

          {/* Sign In Link */}
          <View
            style={{
              marginTop: spacing['2xl'],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              minHeight: 44,
            }}
          >
            <Text
              style={{
                ...typography.bodySm,
                color: currentTheme.textTertiary,
              }}
            >
              Already have an account?
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={{
                minHeight: 44,
                justifyContent: 'center',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={{
                  ...typography.bodySm,
                  fontWeight: '700',
                  color: colors.primary[500],
                }}
              >
                {' '}Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
