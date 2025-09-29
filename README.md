# Accenture Login Application

A full-stack authentication application with Vue.js 3 frontend and Node.js/TypeScript backend.

## Features

- User registration and login
- JWT authentication
- Form validation
- Responsive design
- Secure password hashing

## Prerequisites

- Node.js 16+ and npm
- MongoDB (local or MongoDB Atlas)

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

1. Create a `.env` file in the `backend` directory with the following content:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/accenture-login
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 3. Start the Development Servers

Run both frontend and backend with a single command:

```bash
# Install concurrently globally if you haven't
npm install -g concurrently

# Start both frontend and backend
npm run dev:all
```

This will start:
- Frontend at http://localhost:5173
- Backend API at http://localhost:3001

## Available Scripts

- `npm run dev` - Start frontend only
- `npm run server` - Start backend only
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /health` - Health check endpoint

## Project Structure

```
├── backend/               # Node.js/TypeScript backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── validations/  # Request validations
│   │   └── index.ts      # Entry point
│   ├── .env              # Environment variables
│   ├── package.json
│   └── tsconfig.json
├── src/                  # Vue.js frontend
└── package.json          # Root package.json
```

## Technologies Used

- **Frontend**: Vue.js 3, Pinia, Vue Router, Vite
- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose
- **Authentication**: JWT
- **Validation**: Zod
