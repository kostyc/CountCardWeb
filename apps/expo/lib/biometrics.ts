import * as LocalAuthentication from 'expo-local-authentication';

export async function requireBiometricUnlock(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return true;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock CountCard',
    cancelLabel: 'Cancel',
  });

  return result.success;
}
