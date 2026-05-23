# SmartLib Frontend (React)

This frontend is a React application (Create React App) with Login and Register pages.

Quick start:

1. From `frontend` folder install dependencies and start dev server:

```powershell
cd "C:\Users\Emma Pascua\Desktop\new proj3\frontend"
npm install
npm start
```

2. Open http://localhost:3000

Notes:
- The frontend expects the backend API at `http://localhost:5000`. You can override with `REACT_APP_API_URL`.
- If you encounter `ajv`/`ajv-keywords` errors when starting, try:

```powershell
npm install ajv ajv-keywords schema-utils --save
npm start
```

If you want, I can run the frontend locally and test the Login/Register flows against the backend once your backend is running.
