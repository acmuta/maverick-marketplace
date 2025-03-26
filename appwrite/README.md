# Appwrite Backend Setup

This directory contains the configuration for the Appwrite backend used by Maverick Marketplace.

## Setup Instructions

1. **Create a `.env` file** in this directory with the following content:

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

2. **Start Appwrite** using Docker Compose:

```bash
cd appwrite
docker-compose up -d
```

3. **Access the Appwrite Console** at http://localhost/console

4. **Create your project**:
   - Create a new project named "Maverick Marketplace"
   - Note the project ID and update it in `../appwrite/config.ts` if needed

5. **Set up authentication**:
   - Go to Authentication → Settings
   - Enable Email/Password authentication
   - Optionally enable other providers as needed

6. **Create a database**:
   - Go to Databases → Create Database
   - Create your database collections and attributes as needed

## Project Structure

- `docker-compose.yml`: Docker Compose configuration for Appwrite
- `config.ts`: Appwrite client configuration for the React Native app
- `.env`: Environment variables for Appwrite (you need to create this)

## Important Notes

1. For development, we're using http://localhost. For production, make sure to:
   - Update to https
   - Set _APP_OPTIONS_FORCE_HTTPS=enabled
   - Use a proper domain name

2. The default project ID in `config.ts` is '67e334db001b3a5acbf2'. Make sure this matches the project ID from your Appwrite console.

3. Update the platform name in `config.ts` if needed. It's currently set to 'com.company.MaverickMarketPlace'.