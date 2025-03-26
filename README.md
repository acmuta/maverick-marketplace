# Maverick Marketplace

This project is integrated with [Appwrite](https://appwrite.io) for backend services.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Create a `.env` file in the root directory with the following content:

   ```
   EXPO_PUBLIC_APPWRITE_ENDPOINT=http://localhost/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id # Update after creating project in Appwrite
   EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace # Update with your app's platform/bundle ID
   ```

   This file will be automatically ignored by git to protect your sensitive information.

3. Set up Appwrite Backend

   Follow these steps to set up your Appwrite backend:

   a. Navigate to the `appwrite` directory:
   ```bash
   cd appwrite
   ```

   b. Create the `.env` file **only if it doesn't already exist**, using the content below or the template in `appwrite/README.md`:

   > 📌 Skip this step if `appwrite/.env` already exists.

   ```
   # Appwrite Environment Variables

   # Environment mode: production or development
   _APP_ENV=development

   # Appwrite console configuration
   _APP_CONSOLE_WHITELIST_ROOT=enabled
   _APP_CONSOLE_WHITELIST_EMAILS=
   _APP_CONSOLE_WHITELIST_IPS=
   _APP_SYSTEM_EMAIL_NAME=Maverick Marketplace
   _APP_SYSTEM_EMAIL_ADDRESS=noreply@maverick.local

   # Security
   _APP_OPENSSL_KEY_V1=your-secret-key
   _APP_USAGE_STATS=enabled
   _APP_OPTIONS_ABUSE=enabled
   _APP_OPTIONS_FORCE_HTTPS=disabled  # Set to enabled for production
   _APP_DOMAIN=localhost
   _APP_DOMAIN_TARGET=localhost

   # Database credentials
   _APP_DB_HOST=mariadb
   _APP_DB_PORT=3306
   _APP_DB_SCHEMA=appwrite
   _APP_DB_USER=appwrite
   _APP_DB_PASS=appwrite-password
   _APP_DB_ROOT_PASS=appwrite-root-password

   # Redis configuration
   _APP_REDIS_HOST=redis
   _APP_REDIS_PORT=6379
   _APP_REDIS_USER=
   _APP_REDIS_PASS=

   # Storage limits
   _APP_STORAGE_LIMIT=10000000
   _APP_STORAGE_PREVIEW_LIMIT=20000000
   _APP_STORAGE_ANTIVIRUS=disabled

   # Functions configuration
   _APP_FUNCTIONS_SIZE_LIMIT=30000000
   _APP_FUNCTIONS_TIMEOUT=900
   _APP_FUNCTIONS_BUILD_TIMEOUT=900
   _APP_FUNCTIONS_CPUS=1
   _APP_FUNCTIONS_MEMORY=1024
   _APP_FUNCTIONS_RUNTIMES=node-18.0,php-8.1,python-3.10,ruby-3.1,dart-2.17

   # Executor configuration
   _APP_EXECUTOR_SECRET=your-executor-secret
   _APP_EXECUTOR_HOST=http://openruntimes-executor:3000

   # SMTP configuration (for email sending)
   _APP_SMTP_HOST=
   _APP_SMTP_PORT=
   _APP_SMTP_SECURE=
   _APP_SMTP_USERNAME=
   _APP_SMTP_PASSWORD=
   ```

   c. Start Appwrite using Docker Compose:
   ```bash
   docker-compose up -d
   ```

   This will start all the Appwrite services in detached mode. The first startup may take some time as it downloads the necessary Docker images.

   d. To stop Appwrite services:
   ```bash
   docker-compose down
   ```

   e. Access the Appwrite Console at http://localhost/console

   f. Create your project:
      - Create a new project named "Maverick Marketplace"
      - Note the project ID and update it in your root `.env` file's `EXPO_PUBLIC_APPWRITE_PROJECT_ID` value

## Project Structure

- `appwrite/`: Appwrite configuration
  - `config.ts`: Appwrite client configuration 
  - `docker-compose.yml`: Docker Compose setup for Appwrite services
- `.env`: App environment variables (not committed to git)
- `appwrite/.env`: Appwrite environment variables (not committed to git)
