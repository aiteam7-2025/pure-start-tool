@echo off
echo Starting Game Platform Backend...
echo.
echo Make sure you have Node.js installed: https://nodejs.org/
echo.
cd server
echo Installing dependencies...
npm install
echo.
echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause
