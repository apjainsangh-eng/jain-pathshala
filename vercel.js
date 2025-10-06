// File: vercel.json (Must be in the root of your Git repository)
{
  "version": 2,
  "builds": [
    // 1. Build the React Frontend (Static assets)
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    // 2. Build the Node.js Backend (Serverless function)
    {
      "src": "backend/server.js", 
      "use": "@vercel/node"
    }
  ],
  "routes": [
    // Route all /api/* calls to the serverless function
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    // Route all other traffic to the React frontend index.html
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}