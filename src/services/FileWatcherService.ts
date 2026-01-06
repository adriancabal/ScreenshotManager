// src/services/FileWatcherService.ts
import RNFS from 'react-native-fs';
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCREENSHOT_TEST_FOLDER } from '../utils/constants';

interface ScreenshotWatcherModuleType {
  startWatching: (sourcePath: string, destPath: string) => Promise<boolean>;
  stopWatching: () => Promise<boolean>;
}

const ScreenshotWatcherModule = NativeModules.ScreenshotWatcherModule as ScreenshotWatcherModuleType | undefined;
const watcherEmitter = ScreenshotWatcherModule 
  ? new NativeEventEmitter(NativeModules.ScreenshotWatcherModule)
  : null;

let watcherSubscription: EmitterSubscription | null = null;

export const startFileWatcher = async (screenshotPath: string): Promise<boolean> => {
  try {
    const fullSourcePath = `${RNFS.ExternalStorageDirectoryPath}${screenshotPath}`;
    const destinationPath = `${RNFS.ExternalStorageDirectoryPath}/${SCREENSHOT_TEST_FOLDER}`;

    const destExists = await RNFS.exists(destinationPath);
    if (!destExists) {
      await RNFS.mkdir(destinationPath);
    }

    if (ScreenshotWatcherModule && watcherEmitter) {
      await ScreenshotWatcherModule.startWatching(fullSourcePath, destinationPath);
      
      watcherSubscription = watcherEmitter.addListener(
        'onNewScreenshot',
        async (event: { fileName: string; timestamp: number }) => {
          console.log('New screenshot detected:', event.fileName);
          
          const currentCount = await AsyncStorage.getItem('copiedCount');
          const newCount = (parseInt(currentCount || '0')) + 1;
          await AsyncStorage.setItem('copiedCount', newCount.toString());
        }
      );

      return true;
    } else {
      console.error('Native module not available');
      return false;
    }
  } catch (error) {
    console.error('Error starting file watcher:', error);
    return false;
  }
};

export const stopFileWatcher = async (): Promise<boolean> => {
  try {
    if (watcherSubscription) {
      watcherSubscription.remove();
      watcherSubscription = null;
    }

    if (ScreenshotWatcherModule) {
      await ScreenshotWatcherModule.stopWatching();
    }

    return true;
  } catch (error) {
    console.error('Error stopping file watcher:', error);
    return false;
  }
};

export const scanForNewScreenshots = async (screenshotPath: string): Promise<number> => {
  try {
    const fullSourcePath = `${RNFS.ExternalStorageDirectoryPath}${screenshotPath}`;
    const destinationPath = `${RNFS.ExternalStorageDirectoryPath}/${SCREENSHOT_TEST_FOLDER}`;

    const sourceFiles = await RNFS.readDir(fullSourcePath);
    const destFiles = await RNFS.readDir(destinationPath);
    
    const destFileNames = new Set(destFiles.map(f => f.name));
    
    let copiedCount = 0;
    for (const file of sourceFiles) {
      if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) &&
          file.name.toLowerCase().includes('screenshot') &&
          !destFileNames.has(file.name)) {
        
        const destPath = `${destinationPath}/${file.name}`;
        await RNFS.copyFile(file.path, destPath);
        copiedCount++;
      }
    }

    return copiedCount;
  } catch (error) {
    console.error('Error scanning for screenshots:', error);
    return 0;
  }
};