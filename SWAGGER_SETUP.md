# Swagger API Documentation Setup

## ✅ Swagger is Now Configured!

Swagger/OpenAPI documentation has been successfully set up for the LiveBid API.

## 📍 Access Swagger UI

Once the server is running, access Swagger documentation at:

```
http://localhost:3000/api/docs
```

## 🔧 What's Included

### 1. **Complete API Documentation**
- All endpoints documented with descriptions
- Request/response examples
- Error responses with examples
- Authentication requirements clearly marked

### 2. **Interactive API Testing**
- Test endpoints directly from Swagger UI
- Try out requests with sample data
- See responses in real-time
- JWT authentication support

### 3. **Organized by Tags**
- **Authentication** - Login and registration
- **Users** - Profile, statistics, win history
- **Auctions** - Auction management and bidding

## 🔐 Authentication in Swagger

1. Click the **"Authorize"** button (lock icon) at the top
2. Enter your JWT token: `Bearer <your_token>`
3. Click **"Authorize"**
4. Now you can test protected endpoints

## 📋 Endpoints Documented

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Users (Protected)
- `GET /users/me` - Get user profile
- `GET /users/statistics` - Get user statistics
- `GET /users/won-auctions` - Get won auctions
- `GET /users/win-history` - Get paginated win history

### Auctions
- `GET /auctions` - Get all auctions (with filters)
- `GET /auctions/dashboard` - Get dashboard auctions
- `GET /auctions/available` - Get auctions user can bid on (Protected)
- `GET /auctions/my-auctions` - Get user's created auctions (Protected)
- `GET /auctions/:id` - Get auction details
- `POST /auctions` - Create auction (Protected, multipart/form-data)
- `POST /auctions/:id/bid` - Place bid (Protected)

## 🎨 Features

### Request Examples
Each endpoint includes example request bodies with proper formatting.

### Response Examples
All endpoints show example responses for success and error cases.

### Error Documentation
Error responses are documented with:
- Status codes (400, 401, 403, 404)
- Error messages
- Example error payloads

### Query Parameters
All query parameters are documented with:
- Description
- Type
- Default values
- Examples

## 🚀 Usage

1. **Start the server:**
   ```bash
   npm run start:dev
   ```

2. **Open Swagger UI:**
   ```
   http://localhost:3000/api/docs
   ```

3. **Test endpoints:**
   - Expand any endpoint
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"
   - See the response

## 📝 Example: Testing Login

1. Go to `POST /auth/login`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
4. Click "Execute"
5. Copy the `access_token` from response
6. Click "Authorize" button
7. Paste: `Bearer <access_token>`
8. Now test protected endpoints!

## 🔄 Updating Documentation

Swagger automatically generates documentation from:
- Controller decorators (`@ApiTags`, `@ApiOperation`, etc.)
- DTO decorators (`@ApiProperty`)
- Response decorators (`@ApiResponse`)

To update documentation, modify the decorators in:
- `src/**/*.controller.ts`
- `src/**/*.dto.ts`

## 📦 Package Installed

- `@nestjs/swagger@^7.0.0` - Swagger integration for NestJS

## 🎯 Benefits

1. **Frontend Developers** can easily understand API structure
2. **Testing** endpoints without Postman/curl
3. **Documentation** is always up-to-date with code
4. **API Contracts** clearly defined
5. **Error Handling** examples for all scenarios

## 📚 Additional Resources

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`
- OpenAPI YAML: `http://localhost:3000/api/docs-yaml`

---

**Note:** Swagger UI is available at `/api/docs` endpoint. Make sure your server is running to access it!

