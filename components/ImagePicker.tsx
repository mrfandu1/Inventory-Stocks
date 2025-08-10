import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Camera, Image as ImageIcon, Upload } from 'lucide-react-native';

interface ImagePickerProps {
  imageUrl?: string;
  onImageSelected: (uri: string) => void;
  placeholder?: string;
}

export default function ImagePicker({ imageUrl, onImageSelected, placeholder = "Add Image" }: ImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePickerExpo.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library permissions are required to add images.'
        );
        return false;
      }
    }
    return true;
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Remove Image', onPress: removeImage, style: 'destructive' },
      ]
    );
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePickerExpo.launchCameraAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    onImageSelected('');
  };

  return (
    <TouchableOpacity
      style={[styles.container, imageUrl && styles.containerWithImage]}
      onPress={showImageOptions}
      disabled={isLoading}
    >
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <View style={styles.overlay}>
            <Camera color="white" size={24} />
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <ImageIcon color="#9CA3AF" size={32} />
          <Text style={styles.placeholderText}>{placeholder}</Text>
          <Text style={styles.placeholderSubtext}>Tap to add photo</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  containerWithImage: {
    borderStyle: 'solid',
    borderColor: '#D1D5DB',
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});