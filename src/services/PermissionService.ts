// src/services/PermissionService.ts
import { PermissionsAndroid, Platform, Linking, Alert, NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import { SCREENSHOT_PATHS } from '../utils/constants';

const { ScreenshotWatcherModule } = NativeModules;

const checkStorageAccess = async (): Promise<boolean> => {
  try {
    // Try to create a test file in external storage
    const testPath = `${RNFS.ExternalStorageDirectoryPath}/.screenshot_manager_test`;
    await RNFS.writeFile(testPath, 'test', 'utf8');
    await RNFS.unlink(testPath);
    return true;
  } catch (error) {
    console.log('Storage access check failed:', error);
    return false;
  }
};

const openManageAllFilesSettings = async () => {
  try {
    if (ScreenshotWatcherModule && ScreenshotWatcherModule.openManageAllFilesSettings) {
      await ScreenshotWatcherModule.openManageAllFilesSettings();
    } else {
      // Fallback
      Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening settings:', error);
    Linking.openSettings();
  }
};

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const androidVersion = Platform.Version;

    // Android 11+ (API 30+) requires MANAGE_EXTERNAL_STORAGE
    if (androidVersion >= 30) {
      // First check if we already have access
      const hasAccess = await checkStorageAccess();
      
      if (hasAccess) {
        console.log('Storage access already granted');
        return true;
      }

      // If not, guide user to settings
      return new Promise((resolve) => {
        Alert.alert(
          'Storage Permission Required',
          'This app needs "All files access" permission to manage screenshots.\n\nYou\'ll see a settings page. Please enable "Allow management of all files" for Screenshot Manager.',
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            { 
              text: 'Open Settings', 
              onPress: async () => {
                await openManageAllFilesSettings();
                resolve(false);
              }
            }
          ]
        );
      });
    }
    // Android 10 and below
    else {
      const readGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to manage screenshots.',
          buttonPositive: 'OK',
        }
      );
      const writeGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to write to your storage.',
          buttonPositive: 'OK',
        }
      );
      return (
        readGranted === PermissionsAndroid.RESULTS.GRANTED &&
        writeGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
};

export const copyExistingScreenshots = async (destinationFolder: string): Promise<number> => {
  let totalCopied = 0;

  try {
    for (const path of SCREENSHOT_PATHS) {
      const fullPath = `${RNFS.ExternalStorageDirectoryPath}${path}`;
      
      try {
        const exists = await RNFS.exists(fullPath);
        if (!exists) continue;

        const files = await RNFS.readDir(fullPath);
        const screenshots = files.filter(file => 
          file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) &&
          file.name.toLowerCase().includes('screenshot')
        );

        for (const screenshot of screenshots) {
          try {
            const destinationPath = `${destinationFolder}/${screenshot.name}`;
            const destExists = await RNFS.exists(destinationPath);
            
            if (!destExists) {
              await RNFS.copyFile(screenshot.path, destinationPath);
              totalCopied++;
            }
          } catch (copyError) {
            console.error(`Error copying ${screenshot.name}:`, copyError);
          }
        }
      } catch (pathError) {
        console.log(`Path ${path} not accessible:`, (pathError as Error).message);
      }
    }

    return totalCopied;
  } catch (error) {
    console.error('Error copying screenshots:', error);
    return totalCopied;
  }
};

export const findScreenshotPath = async (): Promise<string> => {
  for (const path of SCREENSHOT_PATHS) {
    const fullPath = `${RNFS.ExternalStorageDirectoryPath}${path}`;
    try {
      const exists = await RNFS.exists(fullPath);
      if (exists) {
        const files = await RNFS.readDir(fullPath);
        const hasScreenshots = files.some(file => 
          file.name.toLowerCase().includes('screenshot')
        );
        if (hasScreenshots) {
          return path;
        }
      }
    } catch (error) {
      console.log(`Cannot access ${path}:`, (error as Error).message);
    }
  }
  
  return SCREENSHOT_PATHS[0];
};