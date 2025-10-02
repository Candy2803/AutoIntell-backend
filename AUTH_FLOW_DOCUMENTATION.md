# Authentication Flow Documentation

## Overview

The AutoIntell backend uses a hybrid authentication system combining **Firebase Auth** for user management and **JSON Web Tokens (JWT)** for session handling. This provides robust security, scalability, and flexibility for both web and mobile clients.

## Architecture

### Technology Stack

- **Firebase Admin SDK** - User creation and management
- **Firestore** - User data storage
- **JSON Web Tokens (JWT)** - Session tokens
- **HTTP-Only Cookies** - Secure token storage
- **Express.js** - Web framework
- **TypeScript** - Type safety

### Authentication Types Supported

1. **JWT-based authentication** (Primary) - For API access
2. **Firebase Session Cookies** - For web browser sessions
3. **Mixed approach** - JWT tokens stored in HTTP-only cookies

## Auth Flow Details

### 1. User Registration (Sign Up)

**Endpoint:** `POST /api/auth/sign-up`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user" // optional, defaults to "user"
}
```

**Process Flow:**

1. **Input Validation** - Zod schema validates request data
   - Name: 1-255 characters, trimmed
   - Email: Valid email format, lowercase, trimmed
   - Password: 6-128 characters
   - Role: Enum ["user", "admin"], defaults to "user"

2. **Firebase User Creation**
   - Creates user in Firebase Auth with email/password
   - Sets displayName from the provided name

3. **Firestore Document Creation**
   - Stores user data in `users` collection
   - Document ID matches Firebase Auth UID
   - Includes: name, email, uid, createdAt timestamp

4. **JWT Token Generation**
   - Creates JWT with payload: { uid, email }
   - Token expires in 1 day (configurable)

5. **Cookie Setting**
   - Sets HTTP-only cookie named "token"
   - Secure flag enabled in production
   - SameSite: 'strict' for security

**Success Response (201):**

```json
{
  "message": "Account created successfully.",
  "user": {
    "id": "firebase-user-uid",
    "uid": "firebase-user-uid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

- `400` - Validation failed
- `409` - Email already exists
- `500` - Internal server error

### 2. User Authentication (Sign In)

**Endpoint:** `POST /api/auth/sign-in`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Process Flow:**

1. **Input Validation** - Email and password validation
2. **Firebase User Lookup** - Gets user by email from Firebase Auth
3. **Firestore Data Retrieval** - Fetches user profile from Firestore
4. **JWT Token Generation** - Creates new session token
5. **Cookie Setting** - Sets secure HTTP-only cookie

**Success Response (200):**

```json
{
  "message": "Authentication successful.",
  "user": {
    "id": "firebase-user-uid",
    "uid": "firebase-user-uid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

- `400` - Validation failed
- `401` - Invalid email or password
- `401` - User with this email does not exist
- `500` - Internal server error

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (JWT token in cookie or Authorization header)

**Process Flow:**

1. **Token Extraction** - From cookie or Authorization header
2. **JWT Verification** - Validates token signature and expiration
3. **User Data Return** - Returns decoded token payload

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "uid": "firebase-user-uid",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

- `401` - Authentication required
- `401` - Invalid or expired token

### 4. User Sign Out

**Endpoint:** `POST /api/auth/sign-out`

**Process Flow:**

1. **JWT Cookie Clearing** - Removes "token" cookie
2. **Firebase Session Clearing** - Removes "session" cookie if present
3. **Success Response** - Confirms logout

**Success Response (200):**

```json
{
  "message": "User signed out successfully"
}
```

## Security Features

### Token Security

- **JWT Secret** - Stored in environment variable `JWT_SECRET`
- **Token Expiration** - 1 day default (configurable)
- **HTTP-Only Cookies** - Prevents XSS attacks
- **Secure Flag** - HTTPS only in production
- **SameSite Policy** - Prevents CSRF attacks

### Firebase Integration

- **Admin SDK** - Server-side user management
- **Firestore Rules** - Database-level security
- **Email Verification** - Can be enabled
- **Custom Claims** - Role-based permissions

### Input Validation

- **Zod Schemas** - Runtime type checking
- **Sanitization** - Email lowercase, string trimming
- **Length Limits** - Prevent overflow attacks
- **Format Validation** - Email format, password complexity

## Middleware

### JWT Authentication Middleware

```typescript
// Usage: app.get('/protected', authenticateJWT, handler)
export const authenticateJWT = async (req, res, next) => {
  // Extracts JWT from cookie or Authorization header
  // Verifies token and adds user to req.user
  // Returns 401 if invalid/missing
};
```

### Firebase Session Middleware

```typescript
// Usage: app.get('/protected', authenticateFirebaseSession, handler)
export const authenticateFirebaseSession = async (req, res, next) => {
  // Verifies Firebase session cookie
  // Fetches user data from Firestore
  // Returns 401 if invalid/missing
};
```

### Optional Authentication

```typescript
// Usage: app.get('/public', optionalAuth, handler)
export const optionalAuth = async (req, res, next) => {
  // Attempts to authenticate but doesn't fail
  // Useful for endpoints that work for both auth/unauth users
};
```

## File Structure

```
src/
├── controllers/
│   └── auth.controller.ts     # Request handlers
├── services/
│   └── auth.service.ts        # Business logic
├── middleware/
│   └── auth.middleware.ts     # Authentication middleware
├── routes/
│   └── auth.routes.ts         # Route definitions
├── validations/
│   └── auth.validation.ts     # Input validation schemas
├── utils/
│   ├── jwt.ts                 # JWT utilities
│   ├── cookies.ts             # Cookie utilities
│   └── format.ts              # Error formatting
└── firebase/
    └── firebase-admin.ts      # Firebase initialization
```

## Environment Variables

Required environment variables:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key

# Server Configuration
NODE_ENV=development
PORT=3000
```

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Validation failed.",
  "details": "Email is required, Password must be at least 6 characters"
}
```

### Authentication Errors (401)

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Server Errors (500)

```json
{
  "error": "Internal server error"
}
```

## Testing the Auth Flow

### 1. Sign Up New User

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Sign In User

```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Route

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Sign Out User

```bash
curl -X POST http://localhost:3000/api/auth/sign-out
```

## Best Practices Implemented

1. **Separation of Concerns** - Controllers, services, middleware separated
2. **Type Safety** - Full TypeScript implementation
3. **Input Validation** - Zod schemas for runtime validation
4. **Error Handling** - Consistent error responses
5. **Security Headers** - Helmet middleware enabled
6. **Rate Limiting** - Can be added per endpoint
7. **Logging** - Winston logger integration
8. **Environment Configuration** - dotenv for configuration
9. **Cookie Security** - HTTP-only, secure, SameSite policies

## Database Schema

### Users Collection (Firestore)

```typescript
interface UserDocument {
  uid: string; // Firebase Auth UID
  name: string; // Display name
  email: string; // Email address
  createdAt: string; // ISO timestamp
  profileURL?: string; // Optional profile image
  resumeURL?: string; // Optional resume/CV
  role?: string; // User role (future feature)
}
```

## Future Enhancements

1. **Email Verification** - Firebase email verification flow
2. **Password Reset** - Firebase password reset integration
3. **OAuth Providers** - Google, GitHub, etc.
4. **Role-based Access Control** - Admin/user permissions
5. **Session Management** - Active session tracking
6. **Two-Factor Authentication** - SMS/TOTP support
7. **API Rate Limiting** - Per-user rate limiting
8. **Audit Logging** - Authentication event logging

## Troubleshooting

### Common Issues

1. **Module Import Errors**
   - Ensure TypeScript paths are configured correctly
   - Use `type` imports for type-only imports

2. **Firebase Connection Issues**
   - Verify environment variables are set
   - Check Firebase service account permissions

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in environment
   - Check token expiration settings

4. **Cookie Issues**
   - Verify cookie-parser middleware is enabled
   - Check secure/SameSite settings for your domain

### Debug Commands

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Test server startup
npm run dev

# Check environment variables
echo $JWT_SECRET

# Test database connection
# (Add a health check endpoint)
```

This authentication system provides a solid foundation for secure user management while maintaining flexibility for future enhancements.
