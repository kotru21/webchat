<center>

# LocalWebChat

</center>

<p align="center">
  <b>Modern web chat with rich functionality and reactive interface</b><br>
  <i>In active development, changes may occur</i>
</p>

![Project Status](https://img.shields.io/badge/Status-In_Development-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **Real-time communication** - Instant messaging
- **Private messages** - Secure conversations between users
- **Media content** - Send images and videos
- **Message management** - Edit, delete, and pin messages
- **Read receipts** - Track read messages
- **User statuses** - Online/offline indicators
- **Profile customization** - Avatars, banners, and user descriptions
- **Dark mode** - Comfortable use at any time of day

## 🛠️ Technology Stack

### Frontend

- **React** - User interface library
- **Vite** - Modern build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - WebSockets for real-time communication

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - WebSocket library
- **JWT** - Token-based authentication

## 📋 Requirements

- Node.js 14.x or higher
- MongoDB 4.x or higher
- NPM 6.x or higher

## 🚀 Installation and Launch

### Clone Repository

```bash
git clone https://github.com/yourusername/local-webchat.git
cd local-webchat
```

### Environment Setup

1. **Create .env file in the root directory:**

```
VITE_API_URL=http://localhost:5000
```

2. **Create .env file in the /server directory:**

```
# MongoDB URI
MONGODB_URI=mongodb://localhost:27017/webchat
# Cookie secret
JWT_SECRET=your_jwt_secret_key
# Back-end port
PORT=5000
# Back-end URL
HOST=http://localhost
# Front-end port for CORS
CLIENT_PORT=5173
# Front-end URL for CORS
CLIENT_URL=http://localhost:5173
```

### Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Run Project

```bash
# Start server
cd server
npm start

# In another terminal, start client
npm run dev
```

The application will be available at: http://localhost:5173

## 📸 Screenshots

<div align="center">
  <img src="https://github.com/user-attachments/assets/8ae98cb1-25e3-4b9a-90eb-92f4ec3c00e6" width="80%" alt="Auth Screenshot">
  <p><i>Auth system with JWT</i></p>
  
  <img src="https://github.com/user-attachments/assets/629e5b93-9f8d-40a3-bbd6-bbc1d1beb7e2" width="80%" alt="Messages">
  <p><i>Send and recieve messages in real-time</i></p>
  
  <img src="https://github.com/user-attachments/assets/b84104ba-fac6-4d0a-9b69-76e211a69960" width="80%" alt="Messages Screenshot">
  <p><i>View and manage(edit) messages</i></p>
</div>

## 📁 Project Structure

```
local-webchat/
├── public/            # Static files
├── server/            # Backend
│   ├── config/        # Server configuration
│   ├── controllers/   # API controllers
│   ├── middleware/    # Middleware handlers
│   ├── Models/        # MongoDB models
│   └── routes/        # API routes
└── src/               # Frontend
    ├── components/    # React components
    ├── context/       # React contexts
    ├── hooks/         # Custom hooks
    ├── pages/         # Application pages
    └── services/      # API services
```

## 🤝 Contribution

Any suggestions and feature requests are welcome! To contribute:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to your fork (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📬 Contact

Developer Name - [@kotru21](https://github.com/kotru21)
