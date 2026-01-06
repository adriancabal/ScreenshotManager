// src/screens/MainScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startFileWatcher, stopFileWatcher } from '../services/FileWatcherService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

type Props = {
  navigation: MainScreenNavigationProp;
};

export default function MainScreen({ navigation }: Props): React.JSX.Element {
  const [serviceRunning, setServiceRunning] = useState(false);
  const [copiedCount, setCopiedCount] = useState(0);
  const [screenshotPath, setScreenshotPath] = useState('/DCIM/Screenshots');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const count = await AsyncStorage.getItem('copiedCount');
      const path = await AsyncStorage.getItem('screenshotPath');
      
      if (count) setCopiedCount(parseInt(count));
      if (path) setScreenshotPath(path);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleService = async () => {
    try {
      if (serviceRunning) {
        await stopFileWatcher();
        setServiceRunning(false);
        Alert.alert('Service Stopped', 'Screenshot monitoring has been stopped.');
      } else {
        const success = await startFileWatcher(screenshotPath);
        if (success) {
          setServiceRunning(true);
          Alert.alert(
            'Monitoring Started',
            'The app is now watching for new screenshots. You\'ll see a notification in your status bar.'
          );
        } else {
          Alert.alert('Error', 'Failed to start monitoring service.');
        }
      }
    } catch (error) {
      console.error('Toggle service error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleManualScan = async () => {
    Alert.alert('Manual Scan', 'This feature will be implemented to scan for new screenshots.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Screenshot Manager</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Screenshots Copied</Text>
            <Text style={styles.statValue}>{copiedCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>{serviceRunning ? 'Monitoring' : 'Stopped'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusDot, serviceRunning && styles.statusDotActive]} />
            <Text style={styles.cardTitle}>Background Monitoring</Text>
          </View>

          <Text style={styles.cardDescription}>
            {serviceRunning
              ? 'Watching for new screenshots and automatically copying them to ScreenshotTest folder'
              : 'Start monitoring to automatically copy new screenshots'}
          </Text>

          <TouchableOpacity
            style={[styles.button, serviceRunning && styles.buttonStop]}
            onPress={toggleService}
          >
            <Text style={styles.buttonText}>
              {serviceRunning ? '⏹️ Stop Monitoring' : '▶️ Start Monitoring'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Source folder:</Text>
            <Text style={styles.settingValue}>{screenshotPath}</Text>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Destination:</Text>
            <Text style={styles.settingValue}>/ScreenshotTest</Text>
          </View>
          
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <Text style={styles.settingLabel}>Existing imported:</Text>
            <Text style={styles.settingValue}>Yes</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleManualScan}
        >
          <Text style={styles.secondaryButtonText}>
            Manually Scan for New Screenshots
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Gallery')}
        >
          <Text style={styles.primaryButtonText}>
            📸 View Screenshots
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsIcon: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#E0E7FF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonStop: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});