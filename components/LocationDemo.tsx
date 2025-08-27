import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocation } from '@/hooks/useLocation';
import { Colors } from '@/common/styles';

export const LocationDemo: React.FC = () => {
  const { 
    locationPermission, 
    isLocationEnabled, 
    currentLocation, 
    getCurrentLocation,
    requestLocationPermission 
  } = useLocation();

  const handleTestLocation = async () => {
    try {
      console.log('Testing location capture...');
      const location = await getCurrentLocation();
      if (location) {
        Alert.alert(
          'Location Captured!',
          `Lat: ${location.latitude.toFixed(6)}\nLng: ${location.longitude.toFixed(6)}\n\nGoogle Maps URL:\n${location.googleMapsUrl}`
        );
      } else {
        Alert.alert('Location Failed', 'Could not capture location. Check permissions and settings.');
      }
    } catch (error) {
      console.error('Location test error:', error);
      Alert.alert('Error', 'Failed to test location functionality.');
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await requestLocationPermission();
      if (granted) {
        Alert.alert('Success', 'Location permission granted!');
      } else {
        Alert.alert('Permission Denied', 'Location permission was denied.');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Testing Demo</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Permission: {locationPermission || 'Unknown'}
        </Text>
        <Text style={styles.statusText}>
          Location Enabled: {isLocationEnabled ? 'Yes' : 'No'}
        </Text>
        {currentLocation && (
          <Text style={styles.statusText}>
            Last Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRequestPermission}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleTestLocation}
        >
          <Text style={styles.buttonText}>Test Location Capture</Text>
        </TouchableOpacity>
      </View>

      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>Captured Location:</Text>
          <Text style={styles.locationText}>
            Latitude: {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Longitude: {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Accuracy: {currentLocation.accuracy?.toFixed(1)}m
          </Text>
          <Text style={styles.locationText}>
            Timestamp: {new Date(currentLocation.timestamp).toLocaleString()}
          </Text>
          <Text style={styles.locationText}>
            Google Maps: {currentLocation.googleMapsUrl}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.primary,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  locationContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.primary,
  },
  locationText: {
    fontSize: 12,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
});
