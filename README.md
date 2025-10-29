# 🚀 RideX Backend - Smart Ride-Sharing Platform API

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.0-black?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-4.0-white?style=for-the-badge&logo=socket.io" alt="Socket.IO" />
</div>

---

## 🌐 Project Links

- **Live API**: [Coming Soon]
- **Frontend Repository**: [GitHub - RideX Frontend](https://github.com/yourusername/ridex-frontend)
- **Backend Repository**: [GitHub - RideX Backend](https://github.com/yourusername/ridex-backend)
- **API Documentation**: [Coming Soon]

---

## 📋 Project Overview

**RideX Backend** is a robust RESTful API and real-time WebSocket server powering the RideX ride-sharing platform. Built with Node.js, Express, and MongoDB, it provides secure authentication, real-time location tracking, payment processing, and comprehensive analytics for users, riders, and administrators.

## 🎯 Main Goals

- **Secure API**: Provide secure RESTful endpoints with JWT authentication
- **Real-time Communication**: Enable WebSocket connections for live tracking and messaging
- **Scalable Architecture**: Design modular, maintainable code structure
- **Data Management**: Efficient MongoDB operations with Mongoose ODM
- **Analytics Engine**: Generate comprehensive statistics for all user types

## 🔑 Key Features

### 🔐 **Authentication & Authorization**
- **JWT-based Authentication**: Secure token generation and validation
- **Role-based Access Control**: User, Rider, and Admin permissions
- **Password Encryption**: Bcrypt hashing for secure password storage
- **Session Management**: Token refresh and invalidation mechanisms

### 🚗 **Ride Management**
- **Ride Booking**: Create, update, and manage ride requests
- **Rider Matching**: Algorithm to match riders with available rides
- **Status Tracking**: Real-time ride status updates (pending, accepted, ongoing, completed)
- **Ride History**: Complete ride records with detailed information

### 💳 **Payment Processing**
- **Payment Integration**: Support for multiple payment methods
- **Fare Calculation**: Dynamic pricing based on distance and vehicle type
- **Transaction Records**: Comprehensive payment history and receipts
- **Payment Status**: Track payment lifecycle (initiated, completed, failed)

### 📊 **Analytics & Reporting**
- **User Analytics**: Total rides, spending, ratings, and trends
- **Rider Analytics**: Earnings, completed rides, performance metrics
- **Admin Analytics**: Platform-wide statistics and revenue tracking
- **Time-based Reports**: Daily, weekly, and monthly data aggregation

### 💬 **Real-time Communication**
- **WebSocket Server**: Socket.IO for bidirectional communication
- **In-ride Chat**: Direct messaging between riders and passengers
- **Support System**: Admin-user-rider support messaging
- **Notifications**: Real-time alerts for messages and ride updates

### ⭐ **Review & Rating System**
- **Rating Management**: 5-star rating system for rides
- **Review Storage**: Comments and feedback collection
- **Performance Tracking**: Average ratings and review analytics
- **Rating Validation**: Prevent duplicate reviews

### 👥 **User Management**
- **User Registration**: Secure user account creation
- **Profile Management**: Update user information and preferences
- **Rider Approval**: Admin system for rider verification
- **Account Status**: Active/inactive user management

## 🛠️ Technology Stack

### **Core Technologies**
| Technology | Version | Purpose |
|-----------|---------|----------|
| **Node.js** | 18+ | JavaScript runtime environment |
| **Express.js** | 4.0 | Web application framework |
| **MongoDB** | 6.0 | NoSQL database |
| **Mongoose** | 7.0+ | MongoDB object modeling |

### **Authentication & Security**
| Technology | Purpose |
|-----------|----------|
| **jsonwebtoken** | JWT token generation and verification |
| **bcryptjs** | Password hashing and comparison |
| **cors** | Cross-origin resource sharing |
| **helmet** | HTTP security headers |

### **Real-time Communication**
| Technology | Purpose |
|-----------|----------|
| **Socket.IO** | WebSocket server for real-time features |
| **socket.io-client** | Client connections management |

### **File Handling & Utilities**
| Technology | Purpose |
|-----------|----------|
| **Multer** | File upload middleware |
| **dotenv** | Environment variables management |
| **nodemon** | Development auto-restart |

## 📁 Project Structure

```
ridex-backend/
├── config/
│   ├── db.js                 # MongoDB connection configuration
│   └── cloudinary.js         # Cloud storage configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── riderController.js    # Rider management
│   ├── rideController.js     # Ride operations
│   ├── paymentController.js  # Payment processing
│   ├── reviewController.js   # Review and ratings
│   ├── analyticsController.js # Analytics generation
│   ├── supportController.js  # Support messaging
│   └── adminController.js    # Admin operations
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   ├── userRoutes.js         # User endpoints
│   ├── riderRoutes.js        # Rider endpoints
│   ├── rideRoutes.js         # Ride endpoints
│   ├── paymentRoutes.js      # Payment endpoints
│   ├── reviewRoutes.js       # Review endpoints
│   ├── analyticsRoutes.js    # Analytics endpoints
│   └── supportRoutes.js      # Support endpoints
├── socket/
│   └── socket.js             # Socket.IO event handlers
├── utils/
│   └── helpers.js            # Utility functions
├── .env                      # Environment variables
├── index.js                  # Application entry point
└── package.json              # Dependencies and scripts
```

## 🔌 API Endpoints

### **Authentication**
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/me                # Get current user
```

### **Users**
```
GET    /api/users                  # Get all users (Admin)
GET    /api/users/:id              # Get user by ID
PUT    /api/users/:id              # Update user profile
DELETE /api/users/:id              # Delete user (Admin)
```

### **Riders**
```
GET    /api/riders                 # Get all riders
GET    /api/riders/:id             # Get rider by ID
POST   /api/riders/apply           # Apply to become rider
PUT    /api/riders/:id/approve     # Approve rider (Admin)
PUT    /api/riders/:id/reject      # Reject rider (Admin)
```

### **Rides**
```
GET    /api/rides                  # Get all rides
GET    /api/rides/:id              # Get ride by ID
POST   /api/rides/create           # Create ride request
PUT    /api/rides/:id/accept       # Accept ride (Rider)
PUT    /api/rides/:id/reject       # Reject ride (Rider)
PUT    /api/rides/:id/complete     # Complete ride
PUT    /api/rides/:id/cancel       # Cancel ride
```

### **Payments**
```
GET    /api/payment/all            # Get all payments (Admin)
GET    /api/payment/:id            # Get payment by ID
POST   /api/payment/create         # Create payment
PUT    /api/payment/:id/complete   # Complete payment
```

### **Reviews**
```
GET    /api/ride-reviews           # Get all reviews
GET    /api/ride-reviews/:rideId   # Get review by ride ID
POST   /api/ride-reviews/create    # Create review
```

### **Analytics**
```
GET    /api/analytics/user/:userId     # User analytics
GET    /api/analytics/rider/:riderId   # Rider analytics
GET    /api/analytics/admin             # Admin analytics
```

### **Support**
```
GET    /api/support/messages            # Get support messages
POST   /api/support/send                # Send support message
GET    /api/support/conversation/:id    # Get conversation
```

## 🔄 WebSocket Events

### **Connection Events**
```javascript
// Client connects
socket.on('connection', (socket) => {...})

// Client disconnects
socket.on('disconnect', () => {...})
```

### **Ride Events**
```javascript
// Join ride room
socket.emit('join_ride', { rideId, userId })

// Location update
socket.emit('location_update', { rideId, location })

// Ride status update
socket.on('ride_status_update', (data) => {...})
```

### **Chat Events**
```javascript
// Join chat room
socket.emit('join_chat', { rideId, userId })

// Send message
socket.emit('send_message', { rideId, message, sender })

// Receive message
socket.on('new_message', (data) => {...})

// Message notification
socket.on('new_message_notification', (data) => {...})
```

### **Support Events**
```javascript
// Join support room
socket.emit('join_support', { userId })

// Send support message
socket.emit('support_message', { userId, message, sender })

// Receive support message
socket.on('new_support_message', (data) => {...})
```

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js 18 or higher
- MongoDB 6.0 or higher
- npm or yarn package manager

### **Installation Steps**

```bash
# Clone the repository
git clone https://github.com/yourusername/ridex-backend.git
cd ridex-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env file with your credentials

# Start MongoDB (if local)
mongod

# Run development server
npm run dev

# Run production server
npm start
```

### **Environment Variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ridex
# OR for MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ridex

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## 📊 Database Schema

### **User Schema**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (user/rider/admin),
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Rider Schema**
```javascript
{
  userId: ObjectId (ref: User),
  vehicleType: String (bike/car/cng),
  vehicleNumber: String,
  licenseNumber: String,
  documents: [String],
  status: String (pending/approved/rejected),
  reviews: Number,
  rating: Number,
  createdAt: Date
}
```

### **Ride Schema**
```javascript
{
  userId: ObjectId (ref: User),
  riderId: ObjectId (ref: Rider),
  pickup: String,
  drop: String,
  vehicleType: String,
  distance: Number,
  fare: Number,
  status: String (pending/accepted/ongoing/completed/cancelled),
  timestamps: Object,
  createdAt: Date
}
```

### **Payment Schema**
```javascript
{
  rideId: ObjectId (ref: Ride),
  userId: ObjectId (ref: User),
  userEmail: String,
  amount: Number,
  paymentMethod: String,
  status: String (initiated/paid/failed),
  timestamps: Object,
  createdAt: Date
}
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured CORS for frontend origin
- **Input Validation**: Request data validation and sanitization
- **Error Handling**: Centralized error handling middleware
- **Rate Limiting**: (Recommended for production) Prevent API abuse

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient MongoDB connection management
- **Caching**: (Recommended) Redis for frequently accessed data
- **Pagination**: Limit results for large datasets
- **Compression**: Response compression for faster data transfer

## 🧪 Testing

```bash
# Run tests (when test suite is added)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

Detailed API documentation with request/response examples will be available at:
- **Postman Collection**: [Coming Soon]
- **Swagger UI**: [Coming Soon]

## 🔮 Future Enhancements

- **Redis Caching**: Implement caching for improved performance
- **Email Service**: Send email notifications for ride updates
- **SMS Integration**: SMS alerts for important events
- **Advanced Analytics**: Machine learning for ride predictions
- **Payment Gateway**: Integrate multiple payment providers
- **Webhook Support**: Third-party integrations
- **GraphQL API**: Alternative to REST endpoints

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

For questions, issues, or support:
- **Email**: support@ridex.com
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/ridex-backend/issues)
- **Documentation**: https://docs.ridex.com

---

<div align="center">
  <p>Built with ❤️ by the HexaDevs Team</p>
  <p>© 2024 RideX Backend. All rights reserved.</p>
</div>
