// src/screens/GalleryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import RNFS from 'react-native-fs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { SCREENSHOT_TEST_FOLDER } from '../utils/constants';
import ImageView from 'react-native-image-viewing';

type GalleryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Gallery'>;

type Props = {
  navigation: GalleryScreenNavigationProp;
};

interface Screenshot {
  name: string;
  path: string;
}

const { width, height } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 3; // 3 images per row with padding

export default function GalleryScreen({ navigation }: Props): React.JSX.Element {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    loadScreenshots();
  }, []);

  const loadScreenshots = async () => {
    try {
      setLoading(true);
      const folderPath = `${RNFS.ExternalStorageDirectoryPath}/${SCREENSHOT_TEST_FOLDER}`;
      const exists = await RNFS.exists(folderPath);
      
      if (!exists) {
        setScreenshots([]);
        setLoading(false);
        return;
      }

      const files = await RNFS.readDir(folderPath);
      
      // Filter for image files and sort by date (newest first)
      const imageFiles = files
        .filter(file => 
          file.isFile() && 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
        )
        .sort((a, b) => (b.mtime?.getTime() || 0) - (a.mtime?.getTime() || 0))
        .map(file => ({
          name: file.name,
          path: file.path,
        }));

      setScreenshots(imageFiles);
    } catch (error) {
      console.error('Error loading screenshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderScreenshot = ({ item, index }: { item: Screenshot; index: number }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => {
        setSelectedIndex(index);
        setIsViewerOpen(true);
      }}
    >
      <Image
        source={{ uri: `file://${item.path}` }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screenshots Gallery</Text>
        <TouchableOpacity onPress={loadScreenshots}>
          <Text style={styles.refreshButton}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading screenshots...</Text>
        </View>
      ) : screenshots.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyText}>No screenshots yet</Text>
          <Text style={styles.emptySubtext}>
            Take a screenshot or start monitoring to see them here
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.countText}>
            {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
          </Text>
          <FlatList
            data={screenshots}
            renderItem={renderScreenshot}
            keyExtractor={(item) => item.path}
            numColumns={3}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Full Screen Image Viewer with Pinch-to-Zoom */}
      <ImageView
        images={screenshots.map(s => ({ uri: `file://${s.path}` }))}
        imageIndex={selectedIndex}
        visible={isViewerOpen}
        onRequestClose={() => setIsViewerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  grid: {
    paddingBottom: 16,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
