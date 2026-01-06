// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

type Props = {
  navigation: SettingsScreenNavigationProp;
};

const COMMON_PATHS = [
  '/DCIM/Screenshots',
  '/Pictures/Screenshots',
  '/DCIM/Camera',
];

export default function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const [screenshotPath, setScreenshotPath] = useState('/DCIM/Screenshots');
  const [deleteOriginals, setDeleteOriginals] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const path = await AsyncStorage.getItem('screenshotPath');
      const deleteOrig = await AsyncStorage.getItem('deleteOriginals');
      const showNotif = await AsyncStorage.getItem('showNotifications');

      if (path) setScreenshotPath(path);
      if (deleteOrig) setDeleteOriginals(deleteOrig === 'true');
      if (showNotif !== null) setShowNotifications(showNotif === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handlePathChange = async (path: string) => {
    setScreenshotPath(path);
    await AsyncStorage.setItem('screenshotPath', path);
  };

  const handleDeleteOriginalsChange = async (value: boolean) => {
    setDeleteOriginals(value);
    await AsyncStorage.setItem('deleteOriginals', value.toString());
  };

  const handleShowNotificationsChange = async (value: boolean) => {
    setShowNotifications(value);
    await AsyncStorage.setItem('showNotifications', value.toString());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Screenshot Source Folder</Text>
          <Text style={styles.cardSubtitle}>
            Select where your device saves screenshots
          </Text>

          {COMMON_PATHS.map((path, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pathOption,
                screenshotPath === path && styles.pathOptionSelected,
              ]}
              onPress={() => handlePathChange(path)}
            >
              <Text
                style={[
                  styles.pathText,
                  screenshotPath === path && styles.pathTextSelected,
                ]}
              >
                {path}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.pathOption}>
            <Text style={styles.pathText}>Custom path...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Destination Folder</Text>
          <Text style={styles.destinationPath}>
            Internal Storage/ScreenshotTest
          </Text>
          <TouchableOpacity>
            <Text style={styles.browseButton}>Browse to change location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Import Options</Text>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Delete originals after copy</Text>
            <Switch
              value={deleteOriginals}
              onValueChange={handleDeleteOriginalsChange}
              trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
              thumbColor={deleteOriginals ? '#4F46E5' : '#F3F4F6'}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Show notification on copy</Text>
            <Switch
              value={showNotifications}
              onValueChange={handleShowNotificationsChange}
              trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
              thumbColor={showNotifications ? '#4F46E5' : '#F3F4F6'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2026.01.05</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  pathOption: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pathOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  pathText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  pathTextSelected: {
    color: '#4F46E5',
  },
  destinationPath: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  browseButton: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionLabel: {
    fontSize: 14,
    color: '#374151',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});