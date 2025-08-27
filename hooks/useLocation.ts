import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export interface JobLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  googleMapsUrl: string;
}

export interface JobLocationData {
  startMap: string;
  endMap: string;
}

export const useLocation = () => {
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<JobLocation | null>(null);

  // Open device settings
  const openDeviceSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening device settings:', error);
      // Fallback: try to open app settings
      try {
        await Linking.openURL('app-settings:');
      } catch (fallbackError) {
        console.error('Error opening app settings:', fallbackError);
      }
    }
  }, []);

  // Request location permissions
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        setIsLocationEnabled(true);
        return true;
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to track job start and completion locations. Please enable location permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: openDeviceSettings }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
      return false;
    }
  }, [openDeviceSettings]);

  // Check if location services are enabled
  const checkLocationEnabled = useCallback(async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      setIsLocationEnabled(enabled);
      
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services on your device to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: openDeviceSettings }
          ]
        );
      }
      
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }, [openDeviceSettings]);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<JobLocation | null> => {
    try {
      // Check permissions first
      if (locationPermission !== 'granted') {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return null;
      }

      // Check if location services are enabled
      if (!isLocationEnabled) {
        const isEnabled = await checkLocationEnabled();
        if (!isEnabled) return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const jobLocation: JobLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
        googleMapsUrl: `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`,
      };

      setCurrentLocation(jobLocation);
      return jobLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please check your location settings.');
      return null;
    }
  }, [locationPermission, isLocationEnabled, requestLocationPermission, checkLocationEnabled]);

  // Initialize location services
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Check current permission status
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationPermission(status);
        
        if (status === 'granted') {
          setIsLocationEnabled(true);
        }
      } catch (error) {
        console.error('Error initializing location:', error);
      }
    };

    initializeLocation();
  }, []);

  return {
    locationPermission,
    isLocationEnabled,
    currentLocation,
    requestLocationPermission,
    checkLocationEnabled,
    getCurrentLocation,
  };
};
