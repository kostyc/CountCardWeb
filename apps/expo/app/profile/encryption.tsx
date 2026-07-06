import { Screen } from '@/components/ui';
import EncryptionKeyManagement from '@/components/profile/EncryptionKeyManagement';

export default function ProfileEncryptionScreen() {
  return (
    <Screen scroll>
      <EncryptionKeyManagement variant="full" />
    </Screen>
  );
}
