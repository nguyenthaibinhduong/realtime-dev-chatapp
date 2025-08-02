# Detailed Back-end Documentation for a Developer Chat Application

---

## 1. Overview

The back-end for the chat application is built on **Node.js version 22** using the **NestJS** framework and **TypeScript** for robust, maintainable code. The system is designed with a microservices-inspired architecture, leveraging **Socket.IO** for real-time communication. The core databases are **MongoDB** (for flexible data like messages) and **PostgreSQL** (for structured data such as users and channels).

## 2. Modules and Detailed Functionality

### 2.1. Authentication Module

- **Registration:**
  - **Endpoint:** `POST /auth/register`
  - **Logic:** Receives `username`, `email`, and `password`. It checks for existing emails, then **hashes the password using bcrypt** before storing it in PostgreSQL. The system returns the details of the newly created user.
- **Login:**
  - **Endpoint:** `POST /auth/login`
  - **Logic:** Receives `email` and `password`. The system compares the provided password with the stored hash. If they match, a **JSON Web Token (JWT)** containing the `userId` and `role` is generated and returned to the client along with the user's information.
- **Two-Factor Authentication (2FA):**
  - **Endpoint:** `POST /auth/2fa/generate`
  - **Logic:** Generates a secret key for the user using the **Speakeasy** library and returns a QR code for the user to scan.
  - **Endpoint:** `POST /auth/2fa/verify`
  - **Logic:** Verifies the 2FA code provided by the user against their stored secret key. If it's valid, the user's `is2faEnabled` status is updated.

### 2.2. Users Module

- **User Profile:**
  - **Endpoint:** `GET /users/profile`
  - **Logic:** Returns the profile information of the authenticated user based on their JWT.
- **Update Profile:**
  - **Endpoint:** `PUT /users/profile`
  - **Logic:** Allows the authenticated user to update their name and profile picture.

### 2.3. Channels Module

- **Create Channel:**
  - **Endpoint:** `POST /channels`
  - **Logic:** Creates a new channel, which can be public or private. The user who creates the channel is automatically added as a member.
- **Join Channel:**
  - **Endpoint:** `POST /channels/:id/join`
  - **Logic:** Adds the authenticated user to the specified channel.
- **Get Channel List:**
  - **Endpoint:** `GET /channels`
  - **Logic:** Returns a list of all public channels and any private channels the authenticated user is a member of.

### 2.4. Messages Module

- **Send Message:**
  - **Socket.IO Event:** `sendMessage`
  - **Logic:** Receives `channelId` and `messageContent`. The message is saved to MongoDB, and a `newMessage` event is emitted to all clients subscribed to that channel.
- **Message History:**
  - **Endpoint:** `GET /channels/:id/messages`
  - **Logic:** Queries MongoDB for a channel's message history, supporting **pagination** for optimal performance.
- **Advanced Message Search:**
  - **Endpoint:** `GET /search`
  - **Logic:** Accepts query parameters like `keyword`, `fromUserId`, `channelId`, `dateFrom`, and `dateTo`. It uses **MongoDB's full-text search** capabilities to perform complex searches.

### 2.5. GitHub Integration Module

- **Webhook Configuration:**
  - **Endpoint:** `POST /integrations/github`
  - **Logic:** This is a public webhook endpoint that receives payloads from GitHub for events like `push`, `pull_request`, and `issue`. The NestJS back-end processes the payload and uses **Socket.IO** to send beautifully formatted notification messages to the corresponding chat channel.

## 3. Architecture and Technology Stack

- **Framework:** **NestJS** (latest stable version)
- **Language:** **TypeScript**
- **Runtime:** **Node.js 22**
- **Real-time Communication:** **Socket.IO**
- **Databases:**
  - **PostgreSQL:** Used for managing users, channels, and their relationships.
  - **MongoDB:** Used for storing messages and other flexible data.
- **Security:**
  - **bcrypt** for password hashing.
  - **JWT** for authentication.
  - **Speakeasy** for 2FA.
  - **HTTPS/TLS** for all connections.
- **File Storage:** Will be handled by a cloud storage service like **Amazon S3** or **Cloudinary**.
