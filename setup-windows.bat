@echo off
echo Setting up Maverick Marketplace for Windows...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js and try again.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo npm is not installed. Please install npm and try again.
    exit /b 1
)

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Docker is not installed or not in PATH. You'll need Docker to run Appwrite.
    echo You can continue setup, but Appwrite won't start until Docker is installed.
    timeout /t 5
)

REM Run the setup script
echo Running setup script...
node setup-dev.js

if %ERRORLEVEL% neq 0 (
    echo Setup failed. Please check the error messages above.
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo You can now:
echo  1. Start Appwrite if it's not already running with: npm run restart-appwrite
echo  2. Set up Appwrite collections with: npm run setup-appwrite
echo  3. Start the development server with: npm run win-start
echo.
echo Press any key to exit...
pause >nul