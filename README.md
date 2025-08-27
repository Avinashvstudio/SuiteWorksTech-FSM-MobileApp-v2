# SuiteWorksTech-FSM-MobileApp-v2

Field Work Service Management Mobile App - React Native/Expo application for managing field service operations, job orders, equipment usage, and technician workflows.

## About

This is a [React Native](https://reactnative.dev/) project built with [Expo](https://expo.dev) for Field Service Management operations. The app provides comprehensive tools for managing field service workflows, including job orders, equipment usage tracking, and technician management.

## Features

- **Job Management**: Create, view, and manage job orders
- **Equipment Tracking**: Monitor equipment usage and maintenance
- **Technician Workflow**: Streamline field service operations
- **Location Services**: Track and manage field locations
- **Authentication**: Secure login and user management

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Custom hooks and global store
- **Platforms**: iOS and Android

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Expo CLI**: Install globally with `npm install -g @expo/cli`
- **Expo Go App**: Install on your mobile device for testing

## Get Started

1. **Install dependencies**
   
   Due to React Native version compatibility, use the legacy peer deps flag:
   
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the development server**
   
   ```bash
   npm start
   # or
   npx expo start
   ```

3. **Run on your preferred platform**:
   - **Android**: Press 'a' in the terminal or scan QR code with Expo Go
   - **iOS**: Press 'i' in the terminal or scan QR code with Expo Go
   - **Web**: Press 'w' in the terminal

## Troubleshooting

### Dependency Conflicts
If you encounter dependency resolution errors during installation, this is likely due to React Native version compatibility issues. The `--legacy-peer-deps` flag resolves these conflicts.

### Alternative Installation Methods
If issues persist, you can also try:
```bash
npm install --force
```

### Security Vulnerabilities
After installation, you may see security warnings. These are common in React Native projects and typically don't affect development builds. For production, consider updating to more recent React Native versions.

## Project Structure

```
├── app/                    # Main application screens
│   ├── (auth)/            # Authentication screens
│   ├── (drawer)/          # Main app screens with drawer navigation
│   └── _layout.tsx        # Root layout
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── services/               # API and service layer
├── store/                  # Global state management
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## Development

This project uses [file-based routing](https://docs.expo.dev/router/introduction) with Expo Router. You can start developing by editing the files inside the **app** directory.

## Learn More

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals and advanced topics
- [React Native documentation](https://reactnative.dev/docs/getting-started): React Native guides and API reference
- [Expo Router](https://docs.expo.dev/router/introduction): File-based routing for Expo apps
