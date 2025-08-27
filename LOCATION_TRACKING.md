# Location Tracking in SuiteWorks Tech FSM

## Overview
The app now includes automatic location tracking for field service jobs. When technicians update job statuses or complete jobs, their location is automatically captured and sent to the server.

## How It Works

### 1. Automatic Start Location Capture
- When a technician changes the **Maintenance Job Status** to "Started", the app automatically captures their current location
- The location is captured using the device's GPS with high accuracy
- A success message shows the captured coordinates

### 2. End Location Capture
- When submitting the job (especially when status is "Completed"), the app captures the final location
- This ensures we have both start and end locations for the complete job timeline

### 3. Location Data Format
The app sends location data to the server in this exact format:
```json
{
  "startMap": "https://www.google.com/maps?q=37.4219999,-122.0840575",
  "endMap": "https://www.google.com/maps?q=37.4279999,-122.0900575"
}
```

## User Experience

### Location Permission
- On first use, the app requests location permissions
- Users can grant "While Using App" permission
- If denied, users are guided to device settings

### Visual Indicators
- **Start Location**: Shows a green checkmark when captured
- **End Location**: Shows a red stop icon when captured
- **Coordinates**: Displayed in decimal format (6 decimal places)
- **Timestamps**: Shows when each location was captured

### Manual Capture
- If automatic capture fails, users can manually tap "Capture Start Location"
- The button appears below the status dropdown when needed

## Technical Implementation

### Dependencies
- `expo-location` for GPS access
- Location permissions configured in `app.json`
- Custom `useLocation` hook for location management

### Location Accuracy
- **Accuracy**: High accuracy GPS
- **Update Interval**: 5 seconds
- **Distance Threshold**: 10 meters
- **Format**: Google Maps URL format

### Error Handling
- Graceful fallback if location services are disabled
- User-friendly error messages
- Automatic retry mechanisms

## Configuration

### iOS Permissions
```json
"infoPlist": {
  "NSLocationWhenInUseUsageDescription": "This app needs access to location to track job start and completion locations for field service management."
}
```

### Android Permissions
```json
"permissions": [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION"
]
```

### Expo Location Plugin
```json
[
  "expo-location",
  {
    "locationAlwaysAndWhenInUsePermission": "Allow SuiteWorks Tech FSM to use your location to track job start and completion locations."
  }
]
```

## Troubleshooting

### Common Issues
1. **Location not captured**: Check device location services and app permissions
2. **Low accuracy**: Ensure device has good GPS signal
3. **Permission denied**: Guide user to device settings

### Debug Information
- Location data is logged to console for debugging
- Check browser console or React Native debugger for location logs
- Verify coordinates are being sent in the correct format

## Security & Privacy
- Location data is only captured when explicitly needed (job start/completion)
- No continuous location tracking
- Data is transmitted securely via HTTPS
- User consent is required through device permissions
