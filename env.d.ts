/// <reference types="node" />

declare namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_APPWRITE_ENDPOINT: string;
      EXPO_PUBLIC_APPWRITE_PROJECT_ID: string;
      EXPO_PUBLIC_APPWRITE_PLATFORM: string;
      EXPO_ROUTER_APP_ROOT: string;
      EXPO_ROUTER_IMPORT_MODE: string;
    }
  }