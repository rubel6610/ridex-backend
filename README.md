# ��� RideX Backend - Smart Ride-Sharing Platform API

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.0-black?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-4.0-white?style=for-the-badge&logo=socket.io" alt="Socket.IO" />
</div>

---

## ��� Project Links

- **Live API**: [Coming Soon]
- **Frontend Repository**: [GitHub - RideX Frontend](https://github.com/yourusername/ridex-frontend)
- **Backend Repository**: [GitHub - RideX Backend](https://github.com/yourusername/ridex-backend)
- **API Documentation**: [Coming Soon]

---

## ��� Project Overview

**RideX Backend** is a robust RESTful API and real-time WebSocket server powering the RideX ride-sharing platform. Built with Node.js, Express, and MongoDB, it provides secure authentication, real-time location tracking, payment processing, and comprehensive analytics for users, riders, and administrators.

## ��� Main Goals

- **Secure API**: Provide secure RESTful endpoints with JWT authentication
- **Real-time Communication**: Enable WebSocket connections for live tracking and messaging
- **Scalable Architecture**: Design modular, maintainable code structure
- **Data Management**: Efficient MongoDB operations with Mongoose ODM
- **Analytics Engine**: Generate comprehensive statistics for all user types

## ��� Key Features

### ��� **Email Integration**
- **Contact Form**: Handle contact form submissions and send emails to admin support
- **Newsletter Subscription**: Manage user subscriptions and send welcome emails
- **Forgot Password**: Email-based password reset functionality

### ��� **Authentication & Authorization**
- **JWT-based Authentication**: Secure token generation and validation
- **Role-based Access Control**: User, Rider, and Admin permissions
- **Password Encryption**: Bcrypt hashing for secure password storage
- **Session Management**: Token refresh and invalidation mechanisms

### ��� **Email API Endpoints**
- **POST** `/api/contact` - Submit contact form
- **POST** `/api/subscribe` - Subscribe to newsletter
- **GET** `/api/subscribers` - Get all subscribers (Admin only)

### ��� **Ride Management**
- **Ride Booking**: Create, update, and manage ride requests
- **Rider Matching**: Algorithm to match riders with available rides
- **Status Tracking**: Real-time ride status updates (pending, accepted, ongoing, completed)
- **Ride History**: Complete ride records with detailed information

### ��� **Payment Processing**
- **Payment Integration**: Support for multiple payment methods
- **Fare Calculation**: Dynamic pricing based on distance and vehicle type
- **Transaction Records**: Comprehensive payment history and receipts
- **Payment Status**: Track payment lifecycle (initiated, completed, failed)

### ��� **Analytics & Reporting**
- **User Analytics**: Total rides, spending, ratings, and trends
- **Rider Analytics**: Earnings, completed rides, performance metrics
- **Admin Analytics**: Platform-wide statistics and revenue tracking
- **Time-based Reports**: Daily, weekly, and monthly data aggregation

### ��� **Real-time Communication**
- **WebSocket Server**: Socket.IO for bidirectional communication
- **In-ride Chat**: Direct messaging between riders and passengers
- **Support System**: Admin-user-rider support messaging
- **Notifications**: Real-time alerts for messages and ride updates

### ⭐ **Review & Rating System**
- **5-Star Rating**: Interactive rating with visual feedback
- **Comment System**: Optional feedback with character limit
- **Driver Performance**: Comprehensive rating analytics
- **Review History**: Track all ratings and reviews

### ���️ **Utility Functions**
- **Geocoding Services**: Location name to coordinates conversion
- **Reverse Geocoding**: Coordinates to location name conversion
- **Route Calculation**: OSRM integration for accurate distance and duration
- **Image Upload**: Cloudinary integration for profile pictures and documents

## ���️ Architecture & Structure

### **Project Structure**
```
ridex-backend/
├── config/          # Database and email configurations
├── controllers/     # Request handlers and business logic
├── middleware/      # Custom middleware functions
├── models/          # Mongoose data models
├── routes/          # API route definitions
├── socket/          # WebSocket event handlers
├── utils/           # Helper functions and utilities
├── .env             # Environment variables
├── .gitignore       # Git ignore file
├── index.js         # Main application entry point
└── package.json     # Project dependencies and scripts
```

### **Core Modules**
1. **Authentication Module**: JWT-based auth with role-based access control
2. **User Management**: CRUD operations for users, riders, and admins
3. **Ride Management**: Complete ride lifecycle from booking to completion
4. **Payment Processing**: Secure payment handling with multiple methods
5. **Real-time Tracking**: WebSocket-based location updates every 5 seconds
6. **Communication System**: In-app chat with message persistence
7. **Analytics Engine**: Data aggregation and reporting for all user types
8. **Review System**: 5-star rating with comment functionality

## ⚙️ Environment Variables

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

# Email Configuration
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## ��� Database Schema

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

## ��� Security Features

- **Password Hashing**: Bcrypt with salt rounds for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured CORS for frontend origin
- **Input Validation**: Request data validation and sanitization
- **Error Handling**: Centralized error handling middleware
- **Rate Limiting**: (Recommended for production) Prevent API abuse

## ��� Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient MongoDB connection management
- **Caching**: (Recommended) Redis for frequently accessed data
- **Pagination**: Limit results for large datasets
- **Compression**: Response compression for faster data transfer

## ��� Testing

```bash
# Run tests (when test suite is added)
npm test

# Run tests with coverage
npm run test:coverage
```

## ��� API Documentation

Detailed API documentation with request/response examples will be available at:
- **Postman Collection**: [Coming Soon]
- **Swagger UI**: [Coming Soon]

## ��� Future Enhancements

- **Redis Caching**: Implement caching for improved performance
- **Email Service**: Send email notifications for ride updates
- **SMS Integration**: SMS alerts for important events
- **Advanced Analytics**: Machine learning for ride predictions
- **Payment Gateway**: Integrate multiple payment providers
- **Webhook Support**: Third-party integrations
- **GraphQL API**: Alternative to REST endpoints

## ��� Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ��� License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ��� Contact & Support

For questions, issues, or support:
- **Email**: support@ridex.com
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/ridex-backend/issues)
- **Documentation**: https://docs.ridex.com

---

<div align="center">
  <p>Built with ❤️ by the HexaDevs Team</p>
  <p>© 2024 RideX Backend. All rights reserved.</p>
</div>
