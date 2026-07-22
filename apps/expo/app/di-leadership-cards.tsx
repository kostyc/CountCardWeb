import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import type { DILeadershipCard } from '@countcard/core/types/models';
import {
  createDILeadershipCard,
  appendDIRecommendation,
  signDILeadershipCard,
  listDILeadershipCards,
} from '@countcard/firebase/services/diLeadershipCards';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { pickDiCardImage } from '@/lib/imagePicker';
import { uploadDILeadershipCardImage } from '@/lib/storage';
import type { PickedImage } from '@/lib/imageValidation';
import { Screen, SectionHeader, Button, Input, Select } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

type AuthorRole = 'sdi' | 'chief_di' | 'first_sgt';
type CardType = 'digital_form' | 'three_by_five_import';

const AUTHOR_ROLE_OPTIONS = [
  { value: 'sdi', label: 'Senior DI' },
  { value: 'chief_di', label: 'Chief DI' },
  { value: 'first_sgt', label: 'Company 1stSgt' },
];

const CARD_TYPE_OPTIONS: { value: CardType; label: string }[] = [
  { value: 'digital_form', label: 'Digital form' },
  { value: 'three_by_five_import', label: '3×5 image import' },
];

function formatCardDate(value: DILeadershipCard['createdAt']): string {
  if (!value) return '';
  const date =
    value instanceof Date
      ? value
      : typeof (value as { toDate?: () => Date }).toDate === 'function'
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as unknown as string);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export default function DILeadershipCardsScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();

  const [subjectUserId, setSubjectUserId] = useState('');
  const [authorRole, setAuthorRole] = useState<AuthorRole | ''>('sdi');
  const [cardType, setCardType] = useState<CardType>('three_by_five_import');
  const [summary, setSummary] = useState('');
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [createdImageUrl, setCreatedImageUrl] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [recentCards, setRecentCards] = useState<DILeadershipCard[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const org =
    appUser?.customClaims?.organizationalAssignment ??
    appUser?.profile?.organizationalAssignment;

  const loadRecent = useCallback(async () => {
    setListLoading(true);
    try {
      const result = await listDILeadershipCards(
        org?.company ? { company: org.company } : undefined,
        { pageSize: 10 }
      );
      setRecentCards(result.items);
    } catch {
      setRecentCards([]);
    } finally {
      setListLoading(false);
    }
  }, [org?.company]);

  useFocusEffect(
    useCallback(() => {
      void loadRecent();
    }, [loadRecent])
  );

  async function handlePickImage() {
    setFormError(null);
    const result = await pickDiCardImage();
    if (result.cancelled) return;
    if (!result.ok) {
      setFormError(result.error ?? 'Could not select image');
      return;
    }
    setPickedImage(result.image);
  }

  async function handleCreate() {
    if (!user) return;
    setFormError(null);

    if (!subjectUserId.trim()) {
      setFormError('Subject DI user ID is required');
      return;
    }
    if (cardType === 'three_by_five_import' && !pickedImage) {
      setFormError('Select a 3×5 card photo before creating an import card');
      return;
    }

    setLoading(true);
    try {
      let importImageUrl: string | undefined;
      if (cardType === 'three_by_five_import' && pickedImage) {
        importImageUrl = await uploadDILeadershipCardImage(pickedImage, user.uid);
      }

      const newCardId = `dic-${Date.now()}`;
      await createDILeadershipCard(
        newCardId,
        {
          cardId: newCardId,
          subjectUserId: subjectUserId.trim(),
          authorRole: authorRole || 'sdi',
          cardType,
          importImageUrl,
          summary: summary.trim() || undefined,
          workflowState: 'draft',
          organizationalAssignment: {
            regiment: org?.regiment,
            battalion: org?.battalion,
            company: org?.company,
            series: org?.series,
            platoon: org?.platoon,
          },
          createdBy: user.uid,
        },
        user.uid
      );
      setCardId(newCardId);
      setCreatedImageUrl(importImageUrl ?? null);
      setPickedImage(null);
      Alert.alert('Created', `Card ${newCardId}`);
      await loadRecent();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create card';
      setFormError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppendRecommendation() {
    if (!cardId || !user) return;
    setLoading(true);
    try {
      await appendDIRecommendation(cardId, user.uid, recommendation, user.uid);
      setRecommendation('');
      Alert.alert('Added', 'Recommendation appended');
      await loadRecent();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to append recommendation');
    } finally {
      setLoading(false);
    }
  }

  async function handleSign(which: 'di' | 'senior') {
    if (!cardId || !user) return;
    setLoading(true);
    try {
      await signDILeadershipCard(
        cardId,
        which,
        {
          userId: user.uid,
          signedAt: Timestamp.now(),
          attestationHash: `attest-${Date.now()}`,
        },
        user.uid
      );
      Alert.alert('Signed', `${which === 'di' ? 'DI' : 'Senior'} signature recorded`);
      await loadRecent();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to sign card');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="DI Leadership Cards"
        subtitle="Digital forms or 3×5 photo import — create, recommend, sign"
      />

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Card type</Text>
        <View style={styles.typeRow}>
          {CARD_TYPE_OPTIONS.map((option) => {
            const selected = cardType === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setCardType(option.value);
                  setFormError(null);
                  if (option.value === 'digital_form') setPickedImage(null);
                }}
                style={({ pressed }) => [
                  styles.typeChip,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.background,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: selected ? theme.colors.onPrimary : theme.colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="Subject DI user ID"
          value={subjectUserId}
          onChangeText={setSubjectUserId}
          autoCapitalize="none"
          placeholder="Firebase UID of the DI"
        />
        <Select
          label="Author role"
          value={authorRole}
          onChange={(v) => setAuthorRole(v as AuthorRole)}
          options={AUTHOR_ROLE_OPTIONS}
        />
        <Input
          label="Summary"
          value={summary}
          onChangeText={setSummary}
          multiline
          placeholder={
            cardType === 'three_by_five_import'
              ? 'Optional notes about this scanned card'
              : 'Leadership summary'
          }
        />

        {cardType === 'three_by_five_import' ? (
          <View style={styles.importBlock}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
              3×5 card photo
            </Text>
            <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
              Upload a photo or scan of the physical 3×5 card (JPG, PNG, or WebP, max 5MB).
            </Text>
            {pickedImage ? (
              <Image
                source={{ uri: pickedImage.uri }}
                style={styles.preview}
                contentFit="cover"
                accessibilityLabel="Selected 3x5 card preview"
              />
            ) : null}
            <View style={styles.importActions}>
              <Button
                title={pickedImage ? 'Replace photo' : 'Choose 3×5 photo'}
                variant="secondary"
                onPress={() => void handlePickImage()}
                disabled={loading}
              />
              {pickedImage ? (
                <Button
                  title="Clear"
                  variant="secondary"
                  onPress={() => setPickedImage(null)}
                  disabled={loading}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {formError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{formError}</Text>
        ) : null}

        <Button title="Create card" onPress={() => void handleCreate()} loading={loading} />

        {cardId ? (
          <View style={styles.cardSection}>
            <Text style={[styles.cardId, { color: theme.colors.textMuted }]}>Card ID: {cardId}</Text>
            {createdImageUrl ? (
              <Image
                source={{ uri: createdImageUrl }}
                style={styles.preview}
                contentFit="cover"
                accessibilityLabel="Imported 3x5 card image"
              />
            ) : null}
            <Input
              label="Append recommendation"
              value={recommendation}
              onChangeText={setRecommendation}
              multiline
            />
            <Button
              title="Append recommendation"
              variant="secondary"
              onPress={() => void handleAppendRecommendation()}
              loading={loading}
            />
            <View style={styles.signRow}>
              <Button
                title="DI sign"
                variant="secondary"
                onPress={() => void handleSign('di')}
                loading={loading}
              />
              <Button
                title="Senior sign"
                variant="secondary"
                onPress={() => void handleSign('senior')}
                loading={loading}
              />
            </View>
          </View>
        ) : null}
      </View>

      <SectionHeader title="Recent cards" subtitle="Latest leadership cards in your company" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        {listLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : recentCards.length === 0 ? (
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>No cards yet.</Text>
        ) : (
          recentCards.map((item) => (
            <View
              key={item.cardId}
              style={[styles.listRow, { borderBottomColor: theme.colors.border }]}
            >
              {item.importImageUrl ? (
                <Image
                  source={{ uri: item.importImageUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                  accessibilityLabel={`Card ${item.cardId} image`}
                />
              ) : (
                <View style={[styles.thumbPlaceholder, { backgroundColor: theme.colors.primaryMuted }]}>
                  <Text style={[styles.thumbPlaceholderText, { color: theme.colors.primary }]}>
                    Form
                  </Text>
                </View>
              )}
              <View style={styles.listMeta}>
                <Text style={[styles.listTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.cardType === 'three_by_five_import' ? '3×5 import' : 'Digital form'} ·{' '}
                  {item.workflowState}
                </Text>
                <Text style={[styles.listSub, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  Subject {item.subjectUserId}
                </Text>
                <Text style={[styles.listSub, { color: theme.colors.textMuted }]}>
                  {item.cardId}
                  {formatCardDate(item.createdAt) ? ` · ${formatCardDate(item.createdAt)}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 12,
    marginBottom: spacing.base,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  typeChip: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  typeChipText: {
    ...typography.callout,
    fontWeight: '600',
  },
  importBlock: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    lineHeight: 18,
  },
  preview: {
    width: '100%',
    maxWidth: 240,
    aspectRatio: 3 / 5,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  importActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  errorText: {
    ...typography.caption,
  },
  cardSection: { gap: 12, marginTop: spacing.sm },
  cardId: { ...typography.caption },
  signRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  listRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  thumb: {
    width: 48,
    height: 80,
    borderRadius: radius.sm,
  },
  thumbPlaceholder: {
    width: 48,
    height: 80,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    ...typography.caption,
    fontWeight: '700',
  },
  listMeta: { flex: 1, gap: 2 },
  listTitle: { ...typography.callout, fontWeight: '600' },
  listSub: { ...typography.caption },
});
