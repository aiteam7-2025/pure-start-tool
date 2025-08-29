@echo off
echo Setting up Airtable environment variables...
echo.

cd server

echo Creating .env file with your Airtable credentials...
echo.

echo # Server Configuration > .env
echo PORT=5000 >> .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # MongoDB Connection >> .env
echo MONGODB_URI=mongodb://localhost:27017/game-platform >> .env
echo. >> .env
echo # JWT Secret >> .env
echo JWT_SECRET=your-super-secret-jwt-key-here >> .env
echo. >> .env
echo # Rate Limiting >> .env
echo RATE_LIMIT_WINDOW_MS=900000 >> .env
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
echo. >> .env
echo # Airtable Configuration >> .env
echo AIRTABLE_API_KEY=patpB5Dz8Ex5UTwUs.eecb585c5070ae7f2e0257b75ed8feb6c4a8406fd437f7d26dd32ee7339516d5 >> .env
echo AIRTABLE_BASE_ID=app4gu5hfbOzwzYQA >> .env
echo AIRTABLE_TABLE_ID=tbltRnV2uepgufjT2 >> .env
echo AIRTABLE_VIEW_ID=viwW4tu3lZHAWUpAQ >> .env

echo.
echo .env file created successfully!
echo.
echo Your Airtable credentials have been added:
echo - API Key: patpB5Dz8Ex5UTwUs.eecb585c5070ae7f2e0257b75ed8feb6c4a8406fd437f7d26dd32ee7339516d5
echo - Base ID: app4gu5hfbOzwzYQA
echo - Table ID: tbltRnV2uepgufjT2
echo - View ID: viwW4tu3lZHAWUpAQ
echo.
echo Now you can start the backend with: start-backend.bat
echo.
pause
