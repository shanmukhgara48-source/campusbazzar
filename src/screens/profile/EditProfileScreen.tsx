import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../services/userService';
import { pickAndCompressImage } from '../../services/imageService';
import { uploadImageToR2 } from '../../services/r2Service';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;
};

export default function EditProfileScreen({ navigation }: Props) {
  const insets    = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [name, setName]       = useState(user?.name       ?? '');
  const [college, setCollege] = useState(user?.college    ?? '');
  const [bio, setBio]         = useState((user as any)?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentAvatar = avatarUri ?? user?.avatar ?? '';

  const pickAvatar = async () => {
    const result = await pickAndCompressImage();
    if (result) setAvatarUri(result.uri);
  };

  const uploadAvatar = async (_uid: string, uri: string): Promise<string> => {
    setUploading(true);
    try {
      return await uploadImageToR2(uri, 'avatars', 0);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    if (!user?.uid) return;
    setSaving(true);
    try {
      const updates: Record<string, string> = {
        name:    name.trim(),
        college: college.trim(),
        bio:     bio.trim(),
      };
      if (avatarUri) {
        updates.avatar = await uploadAvatar(user.uid, avatarUri);
      }
      await updateUser(user.uid, updates);
      await refreshUser();
      Alert.alert('Saved', 'Profile updated successfully.');
      navigation.goBack();
    } catch (e: any) {
      console.error('[EditProfile] save error:', e);
      Alert.alert('Error', e.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraBtn} onPress={pickAvatar} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Fields */}
        <View style={styles.form}>
          <Field label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" />
          <Field label="College" value={college} onChangeText={setCollege} placeholder="Your college name" />
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others a bit about yourself..."
            multiline
            numberOfLines={3}
          />

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.info} />
            <Text style={styles.infoText}>
              Email and roll number cannot be changed. Contact support if needed.
            </Text>
          </View>

          <View style={styles.readonlyField}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.readonlyValue}>{user?.email}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, multiline, numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && { height: (numberOfLines ?? 3) * 22 + 20, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label:     { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textSecondary, marginBottom: spacing.xs },
  input:     { backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, ...shadows.small },
});

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  backBtn:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { flex: 1, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary, marginLeft: spacing.sm },
  saveBtn:          { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md, minWidth: 64, alignItems: 'center' },
  saveBtnText:      { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: '#fff' },
  content:          { padding: spacing.xl },
  avatarSection:    { alignItems: 'center', marginBottom: spacing.xl },
  avatarContainer:  { position: 'relative', marginBottom: spacing.sm },
  avatar:           { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary + '40' },
  avatarPlaceholder:{ backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:    { fontSize: 40, fontWeight: typography.weights.bold, color: colors.primary },
  cameraBtn:        { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarHint:       { fontSize: typography.sizes.xs, color: colors.textTertiary },
  form:             {},
  infoBox:          { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.info + '10', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
  infoText:         { flex: 1, fontSize: typography.sizes.xs, color: colors.info, lineHeight: 18 },
  readonlyField:    { marginBottom: spacing.lg },
  fieldLabel:       { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textSecondary, marginBottom: spacing.xs },
  readonlyValue:    { fontSize: typography.sizes.md, color: colors.textTertiary, paddingVertical: spacing.sm },
});
