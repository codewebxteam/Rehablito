# Rehablito Backend API - Authentication & Roles Module

## Overview
This repository contains the foundational backend architecture for the **Rehablito** web application. As per the initial project requirements, this module was developed to focus strictly on a robust, lightweight, and scalable **Authentication and Role-Based Access Control (RBAC)** ecosystem.

The codebase is built entirely using the MERN stack (Node.js, Express, and MongoDB) and is designed to securely manage access across multiple center branches.

---

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (using Mongoose ODM)
- **Security:** JSON Web Tokens (JWT) & Bcrypt.js (Password Hashing)
- **Development Tooling:** Nodemon (Hot-reloading configured via `npm run dev`)

---

## Architectural Implementation

### 1. Role-Based Access System
The system identifies and restricts behavior based on four distinct internal and external roles:
- **`super_admin`**: Global business owner with absolute oversight over all data.
- **`branch_manager`**: Operational head restricted to a tightly bound `branchId`.
- **`staff`**: Frontline service providers (Therapists) utilizing geofenced location checks and dynamic duty logging.
- **`public_user`**: Standard patient or potential client access.

### 2. Core Security (Middlewares)
- **`auth.middleware.js`**: Rejects any incoming HTTP request lacking a valid `Bearer` JWT token. It unpacks the user token to securely attach the user's role and database ID to the Express request instance.
- **`role.middleware.js`**: Provides dynamic route guarding. For example, explicitly defining `authorize('super_admin')` on an endpoint guarantees that a `staff` or `public_user` token will reliably receive a strict `403 Forbidden` response.

### 3. Authentication Flows
A flexible architecture was built to handle standard logins as well as custom PRD requirements:
- **Standard Authentication**: Validates encrypted `email` and `password` entries from Admins, Managers, and general users to issue JWTs.
- **Staff Mobile OTP Authentication**: Staff members onboard by declaring a unique `staffId` and `mobileNumber`. They securely request an OTP (`/api/auth/request-otp`), and upon submitting this 6-digit timestamped string (`/api/auth/verify-otp`), they receive an authenticated Staff JWT token.

---

## Getting Started

### Prerequisites
- Node.js installed (v18+ recommended)
- A running instance of MongoDB (Local port 27017 or remote Atlas connection string).

### Installation & Execution
1. Open a terminal and navigate to the `backend` directory.
2. Install the necessary project dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables inside a `.env` file at the root:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/rehablito
   JWT_SECRET=your_super_secret_key
   ```
4. Run the server using our hot-reloading development script:
   ```bash
   npm run dev
   ```

---

## Available API Endpoints

### Authentication Routes (`/api/auth`)
- **`POST /register`**: Registers a new user. Handles schema validation and conflict resolution.
- **`POST /login`**: Login via standard email and password.
- **`POST /request-otp`**: Generate and dispatch a 10-minute 6-digit OTP to a Staff member's mobile device simulating an SMS provider.
- **`POST /verify-otp`**: Complete the Staff OTP login procedure and issue a JWT.

### Role Guard Demonstrations (`/api/...`)
*(Note: These routes require a standard Bearer `Authorization: Bearer <token>` Header)*
- **`GET /admin/dashboard`**: Protected (Super Admin access solely).
- **`GET /manager/dashboard`**: Protected (Super Admin, Branch Manager).
- **`GET /staff/dashboard`**: Protected (Super Admin, Branch Manager, Staff).
- **`GET /profile`**: Protected (Requires any valid authentication token).

---
*Codebase intentionally structured for clean readability, rapid future scalability, and zero-trust internal data exposure.*
