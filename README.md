# Authentication Boilerplate

A complete full-stack authentication boilerplate with React, Node.js, Express, and MongoDB.

## 🚀 Features

### Backend (Server)
- **Express.js** server with RESTful API
- **MongoDB** with Mongoose ODM
- **JWT** authentication with bcrypt password hashing
- **Input validation** with express-validator
- **Error handling** middleware
- **Email utilities** for password reset (Nodemailer)
- **Security headers** with Helmet
- **Rate limiting** with express-rate-limit
- **CORS** configuration
- **Environment variables** management

### Frontend (Client)
- **React 19** with Vite
- **Tailwind CSS 3.x** for styling
- **React Router DOM** with protected routes
- **TanStack Query** for server state management
- **Zustand** for client state management
- **React Hook Form** with Yup validation
- **Axios** for HTTP requests
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Error boundaries** for better error handling

## 📁 Project Structure

```
Boiler Plate Code/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Database and environment config
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── validation/    # Validation schemas
│   ├── app.js            # Express app setup
│   ├── package.json
│   └── .env              # Environment variables
└── client/               # Frontend React App
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── services/     # API services
    │   ├── stores/       # Zustand stores
    │   ├── utils/        # Utility functions
    │   ├── schemas/      # Validation schemas
    │   └── config/       # App configuration
    ├── package.json
    └── .env              # Environment variables
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
```

### 2. Environment Configuration

#### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/auth_boilerplate
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
```

#### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Servers

```bash
# Start backend server (from server directory)
npm start
# or for development with auto-restart
npm run dev

# Start frontend server (from client directory)
npm run dev
```

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)

### User Routes (`/api/users`)
- `GET /` - Get all users (protected)
- `GET /:id` - Get user by ID (protected)
- `PUT /:id` - Update user (protected)
- `DELETE /:id` - Delete user (protected)

## 🎨 Frontend Routes

- `/` - Landing page
- `/login` - Login form
- `/register` - Registration form
- `/dashboard` - Protected dashboard (requires authentication)

## 🔧 Development Notes

### Known Issues & Solutions

1. **React 19 Compatibility**: Some packages may show peer dependency warnings. Use `--legacy-peer-deps` when installing.

2. **Tailwind CSS**: Using version 3.x for stability. Update `tailwind.config.js` if needed.

3. **MongoDB Connection**: Ensure MongoDB is running on `mongodb://localhost:27017` or update the connection string in `.env`.

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Thunder Client (for API testing)

## 🚀 Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Ensure MongoDB connection string is updated for production
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to platforms like Vercel, Netlify, or GitHub Pages
3. Update the `VITE_API_URL` to point to your deployed backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Server won't start:**
- Check if MongoDB is running
- Verify environment variables in `.env`
- Ensure port 5000 is not in use

**Client build errors:**
- Clear node_modules and reinstall with `--legacy-peer-deps`
- Check for syntax errors in components
- Verify all imports are correct

**Authentication not working:**
- Check JWT_SECRET is set in server .env
- Verify API URL in client .env
- Check browser network tab for API errors

---

Built with ❤️ for developers who want to get started quickly with authentication.
