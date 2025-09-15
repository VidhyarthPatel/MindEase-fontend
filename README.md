# MindEase - Digital Wellness App

A comprehensive React Native app for tracking phone usage, app usage, screen time, and managing digital wellness through app blocking features.

## Features

### 🔐 Authentication
- User registration and login
- Secure token-based authentication
- Password validation and security

### 📊 Usage Tracking
- Real-time app usage monitoring
- Daily, weekly, and monthly usage statistics
- Detailed app-wise screen time tracking
- Usage session tracking and analysis
- Category-based usage breakdown

### 🛡️ App Blocking
- Schedule-based app blocking
- Custom blocking rules and time periods
- Accessibility service integration
- Notification system for blocked apps
- Emergency override functionality

### 📱 Dashboard
- Comprehensive usage overview
- Visual charts and statistics
- Most used apps tracking
- Weekly trend analysis
- Quick action buttons

### 🔧 Permissions Management
- Usage access permission handling
- Notification permission management
- System alert window permission
- Accessibility service permission
- Graceful permission request flow

## Tech Stack

- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Expo** - Development platform and tools
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **Expo SecureStore** - Secure token storage
- **Expo Notifications** - Push notifications
- **Date-fns** - Date manipulation utilities
- **Axios** - HTTP client for API calls

## Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MindEase-fontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   API_BASE_URL=https://your-api-url.com
   APP_NAME=MindEase
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Run on device/emulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## Project Structure

```
MindEase-fontend/
├── app/                    # Expo Router pages
├── components/             # Reusable components
├── navigation/             # Navigation configuration
├── screens/               # Screen components
├── services/              # API and business logic services
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── assets/                # Images, fonts, and other assets
├── App.tsx                # Main app component
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Key Components

### Services

- **ApiService** - Handles all API communications
- **AppUsageService** - Manages app usage tracking
- **AppBlockingService** - Handles app blocking functionality
- **PermissionService** - Manages app permissions

### Screens

- **LoginScreen** - User authentication
- **SignupScreen** - User registration
- **DashboardScreen** - Main dashboard with statistics
- **AppUsageScreen** - Detailed usage tracking
- **AppBlockingScreen** - App blocking management
- **BlockScheduleScreen** - Schedule configuration

### Utils

- **ErrorHandler** - Comprehensive error handling
- **TimeUtils** - Time formatting and calculations

## Permissions Required

### Android
- `PACKAGE_USAGE_STATS` - For app usage tracking
- `SYSTEM_ALERT_WINDOW` - For overlay blocking screens
- `ACCESSIBILITY_SERVICE` - For app blocking functionality
- `POST_NOTIFICATIONS` - For blocking notifications
- `INTERNET` - For API communication
- `ACCESS_NETWORK_STATE` - For network state monitoring

### iOS
- Screen Time API access (iOS 13.4+)
- Notification permissions
- Network access

## API Integration

The app is designed to work with a backend API. Update the `API_BASE_URL` in the ApiService to point to your backend:

```typescript
// services/ApiService.ts
private static readonly BASE_URL = 'https://your-api-url.com';
```

### Required API Endpoints

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /auth/me` - Get current user
- `POST /usage/sync` - Sync usage data
- `GET /usage/history` - Get usage history
- `GET /usage/dashboard` - Get dashboard stats
- `GET /blocking/rules` - Get blocking rules
- `POST /blocking/rules` - Create blocking rule
- `PUT /blocking/rules/:id` - Update blocking rule
- `DELETE /blocking/rules/:id` - Delete blocking rule

## Native Module Integration

For full functionality, you'll need to implement native modules for:

### Android
- **AppUsageModule** - Access to UsageStatsManager
- **AppBlockingModule** - Accessibility service integration

### iOS
- **ScreenTimeModule** - Screen Time API integration

## Development

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Implement proper error handling
- Use functional components with hooks
- Follow the established folder structure

### Testing
```bash
# Run tests
npm test

# Run linting
npm run lint
```

### Building for Production

1. **Configure app.json**
   - Update app name, bundle identifier
   - Configure signing certificates
   - Set up app icons and splash screens

2. **Build for Android**
   ```bash
   expo build:android
   ```

3. **Build for iOS**
   ```bash
   expo build:ios
   ```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure all required permissions are granted
   - Check device settings for usage access
   - Verify accessibility service is enabled

2. **API Connection Issues**
   - Check network connectivity
   - Verify API endpoint URLs
   - Check authentication tokens

3. **Build Issues**
   - Clear cache: `expo r -c`
   - Update dependencies: `npm update`
   - Check Expo CLI version

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('Debug mode enabled');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

## Roadmap

- [ ] Advanced analytics and insights
- [ ] Social features and family sharing
- [ ] AI-powered usage recommendations
- [ ] Integration with health apps
- [ ] Web dashboard
- [ ] Desktop companion app
- [ ] Advanced blocking rules
- [ ] Usage goals and challenges

## Acknowledgments

- React Native community
- Expo team
- Contributors and testers