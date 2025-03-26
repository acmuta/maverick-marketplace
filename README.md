# Maverick Marketplace

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app), integrated with [Appwrite](https://appwrite.io) for backend services.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Setup Appwrite Backend

Follow these steps to set up your Appwrite backend:

1. Navigate to the `appwrite` directory:
   ```bash
   cd appwrite
   ```

2. Follow the instructions in the `appwrite/README.md` file to set up Appwrite:
   - Create the `.env` file as specified
   - Start Appwrite using Docker Compose
   - Set up your project, auth, and database configurations

3. Make sure the project ID in `appwrite/config.ts` matches your Appwrite project ID.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo and Appwrite:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
- [Appwrite documentation](https://appwrite.io/docs): Learn how to use Appwrite services.
- [Appwrite SDK for React Native](https://appwrite.io/docs/sdks/react-native/setup): Detailed documentation for using Appwrite with React Native.

## Join the community

Join our communities of developers:

- [Expo on GitHub](https://github.com/expo/expo): View Expo's open source platform and contribute.
- [Expo Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
- [Appwrite Discord community](https://appwrite.io/discord): Connect with Appwrite users and developers.
