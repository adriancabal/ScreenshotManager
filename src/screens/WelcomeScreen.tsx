// src/screens/WelcomeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { requestPermissions, copyExistingScreenshots } from '../services/PermissionService';
import { SCREENSHOT_TEST_FOLDER } from '../utils/constants';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

type Props = {
  navigation: WelcomeScreenNavigationProp;
};

export default function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const [importExisting, setImportExisting] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    
    try {
      console.log('Requesting permissions...');
      const hasPermissions = await requestPermissions();
      console.log('Permissions result:', hasPermissions);
      
      if (!hasPermissions) {
        setLoading(false);
        Alert.alert(
          'Permission Needed',
          'After granting "All files access" in Settings, please come back and press "Get Started" again.'
        );
        return;
      }

      console.log('Creating folder...');
      const folderPath = `${RNFS.ExternalStorageDirectoryPath}/${SCREENSHOT_TEST_FOLDER}`;
      console.log('Folder path:', folderPath);
      
      // Try to create folder - if it fails, permissions weren't granted
      try {
        const folderExists = await RNFS.exists(folderPath);
        
        if (!folderExists) {
          await RNFS.mkdir(folderPath);
          console.log('Folder created successfully');
        }
      } catch (mkdirError) {
        console.error('Folder creation error:', mkdirError);
        Alert.alert(
          'Permission Required',
          'Could not create folder. Please go to Settings > Apps > Screenshot Manager > Permissions and enable "Files and media" or "All files access", then try again.'
        );
        setLoading(false);
        return;
      }

      if (importExisting) {
        console.log('Copying existing screenshots...');
        const copiedCount = await copyExistingScreenshots(folderPath);
        console.log('Copied count:', copiedCount);
        await AsyncStorage.setItem('copiedCount', copiedCount.toString());
      } else {
        await AsyncStorage.setItem('copiedCount', '0');
      }

      await AsyncStorage.setItem('hasLaunched', 'true');
      await AsyncStorage.setItem('importExisting', importExisting.toString());

      setLoading(false);
      navigation.replace('Main');
    } catch (error) {
      console.error('Setup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to set up: ${errorMessage}\n\nCheck console for details.`);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📁</Text>
        </View>

        <Text style={styles.title}>Screenshot Manager</Text>
        <Text style={styles.subtitle}>Organize your screenshots automatically</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>This app will:</Text>
            <Text style={styles.infoText}>
              Create a new folder called <Text style={styles.bold}>ScreenshotTest</Text> in 
              your device's internal storage to organize all your screenshots.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setImportExisting(!importExisting)}
          activeOpacity={0.7}
        >
          <CheckBox
            value={importExisting}
            onValueChange={setImportExisting}
            tintColors={{ true: '#4F46E5', false: '#9CA3AF' }}
          />
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxTitle}>Import all existing screenshots</Text>
            <Text style={styles.checkboxSubtitle}>
              Copy all screenshots from your camera folder into the ScreenshotTest folder
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get Started</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.permissionNote}>
          Permissions for storage access will be requested
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#E0E7FF',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 35,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  checkboxContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  checkboxSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionNote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});