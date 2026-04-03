import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@farmconnect_biometric_enabled';

export const biometric = {
  // Check if device supports biometric authentication
  isCompatible: async (): Promise<boolean> => {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  },

  // Check if biometrics are enrolled on the device
  isEnrolled: async (): Promise<boolean> => {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch {
      return false;
    }
  },

  // Get supported biometric types
  getSupportedTypes: async (): Promise<LocalAuthentication.AuthenticationType[]> => {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch {
      return [];
    }
  },

  // Get human-readable biometric type name
  getBiometricTypeName: (types: LocalAuthentication.AuthenticationType[]): string => {
    const names: Record<number, string> = {
      1: 'Fingerprint',
      2: 'Facial Recognition',
      3: 'Iris Recognition',
    };
    return types.map(t => names[t] || 'Biometric').join(' / ');
  },

  // Authenticate user with biometrics
  authenticate: async (promptMessage: string = 'Authenticate to continue'): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN or Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  },

  // Enable biometric login for this user
  enableBiometric: async (): Promise<boolean> => {
    try {
      const compatible = await biometric.isCompatible();
      const enrolled = await biometric.isEnrolled();

      if (!compatible || !enrolled) {
        return false;
      }

      const authenticated = await biometric.authenticate('Enable biometric login for faster access');
      
      if (authenticated) {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  },

  // Disable biometric login
  disableBiometric: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Failed to disable biometric:', error);
    }
  },

  // Check if biometric login is enabled
  isBiometricEnabled: async (): Promise<boolean> => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  },
};
