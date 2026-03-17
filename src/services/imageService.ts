import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_DIMENSION = 1080;
const COMPRESS_QUALITY = 0.75;

export interface CompressedImage {
  uri:    string;
  width:  number;
  height: number;
  base64?: string;
}

export async function compressImage(uri: string): Promise<CompressedImage> {
  const actions: ImageManipulator.Action[] = [
    { resize: { width: MAX_DIMENSION } },
  ];
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: COMPRESS_QUALITY,
    format:   ImageManipulator.SaveFormat.JPEG,
  });
  return result;
}

export async function pickAndCompressImage(): Promise<CompressedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;

  return compressImage(result.assets[0].uri);
}

export async function takeAndCompressPhoto(): Promise<CompressedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;

  return compressImage(result.assets[0].uri);
}

export async function pickMultipleImages(max = 4): Promise<CompressedImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: max,
    quality: 1,
  });

  if (result.canceled) return [];

  return Promise.all(result.assets.map(a => compressImage(a.uri)));
}
