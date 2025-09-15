# Easemind App

Easemind is a React Native application designed to help users manage their screen time effectively. The app provides insights into app usage, allowing users to monitor their daily screen time and make informed decisions about their digital habits.

## Features

- **Screen Time Tracking**: View total screen time for today and a breakdown of usage per app.
- **Usage Access Permissions**: The app checks for and requests necessary permissions to access usage statistics.
- **User-Friendly Interface**: Intuitive navigation and UI components for a seamless user experience.

## Project Structure

```
easemind-app
├── src
│   ├── components
│   │   └── BottomNav.tsx
│   ├── nativeModules
│   │   └── AppBlockingService.ts
│   ├── screens
│   │   ├── MusicScreen.tsx
│   │   └── TodayScreenTime.tsx
│   ├── types
│   │   └── index.ts
│   └── utils
│       └── timeUtils.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/easemind-app.git
   ```
2. Navigate to the project directory:
   ```
   cd easemind-app
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage

To run the app, use the following command:
```
npm start
```

This will start the Metro bundler. You can then run the app on an emulator or a physical device.

## Development

- **Components**: Reusable UI components are located in the `src/components` directory.
- **Native Modules**: Custom native modules for accessing device features are in `src/nativeModules`.
- **Screens**: The main screens of the app are located in `src/screens`.
- **Types**: TypeScript types and interfaces are defined in `src/types`.
- **Utilities**: Helper functions for time manipulation can be found in `src/utils`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.