// src/services/PermissionService.ts
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { SCREENSHOT_PATHS } from '../utils/constants';

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const androidVersion = Platform.Version;

    // Android 13+ (API 33+) requires READ_MEDIA_IMAGES
    if (androidVersion >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'Screenshot Manager Permissions',
          message: 'This app needs access to your photos and screenshots to organize them.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } 
    // Android 11-12 (API 30-32)
    else if (androidVersion >= 30) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Screenshot Manager Permissions',
          message: 'This app needs access to your storage to organize screenshots.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // Android 10 and below
    else {
      const readGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      const writeGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
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