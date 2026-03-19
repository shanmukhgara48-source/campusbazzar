import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { auth } from '../../services/firebase';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { ItemCategory, ItemCondition } from '../../types';
import { mockListings } from '../../data/mockData';
import { useWatcher } from '../../context/WatcherContext';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

type PriceStatus = 'great' | 'fair' | 'high' | null;

const PRICE_STATUS_CONFIG: Record<NonNullable<PriceStatus>, { label: string; color: string; icon: string }> = {
  great: { label: '🟢 Great Price — likely to sell fast!', color: '#1a5c3a', icon: 'trending-down' },
  fair:  { label: '🟡 Fair Price — in line with market.',  color: '#c8960c', icon: 'remove'        },
  high:  { label: '🔴 Above Average — consider lowering.', color: '#d90429', icon: 'trending-up'   },
};

function getPriceStatus(inputPrice: number, avgPrice: number): PriceStatus {
  if (!avgPrice || inputPrice <= 0) return null;
  const ratio = inputPrice / avgPrice;
  if (ratio <= 0.8)  return 'great';
  if (ratio <= 1.15) return 'fair';
  return 'high';
}

const CATEGORIES: ItemCategory[] = ['Books', 'Laptops', 'Calculators', 'Electronics', 'Other'];
const CONDITIONS: ItemCondition[] = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const conditionDesc: Record<ItemCondition, string> = {
  'New': 'Unused, in original packaging',
  'Like New': 'Used once or twice, no damage',
  'Good': 'Minor wear, fully functional',
  'Fair': 'Visible wear, works fine',
  'Poor': 'Heavy wear or minor defects',
};

// Must match storageBucket in firebaseConfig (firebase.ts)
const STORAGE_BUCKET = 'campusbazaar-a222f.firebasestorage.app';

/**
 * Expo-compatible image upload.
 *
 * Upload chain that avoids every known React Native incompatibility:
 *
 *  ✗ uploadBytes(blob)    — Firebase SDK wraps blob in new Blob([blob])
 *                           internally, hitting the ArrayBufferView error
 *  ✗ uploadString(base64) — Firebase SDK decodes base64 → Uint8Array →
 *                           new Blob([uint8array]) → same ArrayBufferView error
 *  ✗ FileSystem.uploadAsync / BINARY_CONTENT — FileSystemUploadType is
 *                           undefined in Expo Go (module not yet native-loaded)
 *
 *  ✓ fetch(localUri).blob() → fetch POST to Firebase Storage REST API
 *    React Native's fetch reads local file:// URIs natively and sends the
 *    blob body via the OS HTTP stack — no JS Blob constructor involved.
 */
async function uploadImages(uris: string[], userId: string): Promise<string[]> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('User not authenticated');

  return Promise.all(uris.map(async (uri, i) => {
    console.log(`[Upload] uri[${i}]:`, uri);

    // 1. Compress → fresh local file:// URI (smaller payload, consistent MIME)
    const imgRef     = await ImageManipulator.manipulate(uri)
      .resize({ width: 1080 })
      .renderAsync();
    const compressed = await imgRef.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    console.log(`[Upload] compressed[${i}]:`, compressed.uri);

    // 2. Read local URI → Blob via React Native's native fetch
    const localResponse = await fetch(compressed.uri);
    const blob          = await localResponse.blob();
    console.log(`[Upload] blob[${i}]: size=${blob.size} type=${blob.type}`);
    if (!blob || blob.size === 0) throw new Error(`Empty blob for image ${i}`);

    // 3. POST blob directly to Firebase Storage REST API
    //    Plain fetch POST never touches the Blob constructor internally —
    //    React Native pipes the blob body through the OS HTTP layer.
    const path        = `listings/${userId}/${Date.now()}_${i}.jpg`;
    const encodedPath = encodeURIComponent(path);
    const uploadUrl   = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o` +
                        `?uploadType=media&name=${encodedPath}`;

    const uploadRes = await fetch(uploadUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'image/jpeg',
        'Authorization': `Bearer ${token}`,
      },
      body: blob,
    });

    const body = await uploadRes.text();
    console.log(`[Upload] response[${i}]: status=${uploadRes.status}`, body.slice(0, 300));
    if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status}): ${body}`);

    // 4. Build permanent download URL from the token in the REST response
    const { downloadTokens } = JSON.parse(body) as { downloadTokens: string };
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o` +
                        `/${encodedPath}?alt=media&token=${downloadTokens}`;

    console.log(`[Upload] url[${i}]:`, downloadUrl);
    return downloadUrl;
  }));
}

export default function SellScreen() {
  const { checkListing } = useWatcher();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const avgPrice = useMemo(() => {
    const filtered = category
      ? mockListings.filter(l => l.category === category && l.price > 0)
      : mockListings.filter(l => l.price > 0);
    if (!filtered.length) return 0;
    return filtered.reduce((sum, l) => sum + l.price, 0) / filtered.length;
  }, [category]);

  const priceStatus = useMemo(
    () => getPriceStatus(Number(price), avgPrice),
    [price, avgPrice],
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!title.trim()) { Alert.alert('Missing Info', 'Please add a title.'); return; }
    if (!price.trim()) { Alert.alert('Missing Info', 'Please set a price.'); return; }
    if (!category)    { Alert.alert('Missing Info', 'Please select a category.'); return; }
    if (!condition)   { Alert.alert('Missing Info', 'Please select the condition.'); return; }
    if (!user)        { Alert.alert('Not logged in', 'Please log in to post a listing.'); return; }

    setIsPosting(true);
    try {
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadImages(images, user.uid);
      }

      await addDoc(collection(db, 'listings'), {
        title:         title.trim(),
        description:   description.trim(),
        price:         Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        category,
        condition,
        images:        uploadedImages,
        sellerId:      user.uid,
        sellerName:    user.name || user.email || '',
        status:        'active',
        views:         0,
        createdAt:     serverTimestamp(),
      });
      checkListing(title.trim());
      Alert.alert('Success!', 'Your listing has been posted.', [{
        text: 'OK', onPress: () => {
          setTitle(''); setDescription(''); setPrice('');
          setOriginalPrice(''); setCategory(null);
          setCondition(null); setImages([]);
        },
      }]);
    } catch (e: any) {
      console.error('[SellScreen] handlePost failed:', e);
      Alert.alert('Error', e?.message || 'Failed to post listing. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <Text style={styles.headerSubtitle}>Sell your items to fellow students</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photos <Text style={styles.required}>*</Text></Text>
          <Text style={styles.sectionHint}>Add up to 5 photos. First photo is the cover.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageThumb}>
                <Image source={{ uri }} style={styles.thumbImg} />
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverText}>Cover</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. CLRS Algorithms Book, 3rd Edition"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.optionsGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.optionPill, category === cat && styles.optionPillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.optionText, category === cat && styles.optionTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Condition <Text style={styles.required}>*</Text></Text>
          {CONDITIONS.map(cond => (
            <TouchableOpacity
              key={cond}
              style={[styles.conditionRow, condition === cond && styles.conditionRowActive]}
              onPress={() => setCondition(cond)}
            >
              <View style={[styles.radioOuter, condition === cond && styles.radioOuterActive]}>
                {condition === cond && <View style={styles.radioInner} />}
              </View>
              <View style={styles.conditionInfo}>
                <Text style={[styles.conditionName, condition === cond && styles.conditionNameActive]}>
                  {cond}
                </Text>
                <Text style={styles.conditionDesc}>{conditionDesc[cond]}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Asking Price <Text style={styles.required}>*</Text></Text>
          <View style={styles.priceInputRow}>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Original (optional)"
                placeholderTextColor={colors.textTertiary}
                value={originalPrice}
                onChangeText={setOriginalPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Text style={styles.sectionHint}>Original price helps buyers see the discount</Text>
          {priceStatus && (
            <View style={[styles.priceIndicator, { borderColor: PRICE_STATUS_CONFIG[priceStatus].color }]}>
              <Text style={[styles.priceIndicatorText, { color: PRICE_STATUS_CONFIG[priceStatus].color }]}>
                {PRICE_STATUS_CONFIG[priceStatus].label}
              </Text>
              {avgPrice > 0 && (
                <Text style={styles.priceAvgText}>
                  Avg for {category ?? 'all categories'}: ₹{Math.round(avgPrice).toLocaleString('en-IN')}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your item — edition, usage, included accessories, etc."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Post Button */}
        <TouchableOpacity
          style={[styles.postBtn, isPosting && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={isPosting}
          activeOpacity={0.85}
        >
          {isPosting ? (
            <Text style={styles.postBtnText}>Posting...</Text>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.postBtnText}>Post Listing</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  form: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  sectionHint: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  imagesRow: {
    flexDirection: 'row',
  },
  imageThumb: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    overflow: 'visible',
  },
  thumbImg: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
  },
  coverBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  coverText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  addImageText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  charCount: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: '#fff',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  conditionRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#f0f7f3',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  conditionInfo: { flex: 1 },
  conditionName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  conditionNameActive: {
    color: colors.primary,
  },
  conditionDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  priceInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    gap: spacing.xs,
  },
  currencySymbol: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  priceInput: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  postBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  postBtnDisabled: { opacity: 0.7 },
  postBtnText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  priceIndicator: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  priceIndicatorText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  priceAvgText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
