# Secure Incident Reporting System (SIRS)

A highly secure and scalable cybersecurity Incident Reporting System built with the MERN stack (MongoDB, Express, React, Node.js), TypeScript, Prisma ORM, and Socket.io.

## 🚀 Key Features

### 🔹 Advanced Dashboard (Role-Based)
- **Users**: Submit incidents and track their own reports in a clean layout.
- **Admins**: Analytics dashboard with pie/bar charts, incident filtering, and status management.
- **Super Admin**: Full user management (Roles, Blocking, Deleting) and Audit Trail.

### 🔹 Security & Scalability
- **RBAC**: Strict Role-Based Access Control on both Frontend and Backend.
- **Audit Logging**: Comprehensive tracking of all sensitive actions (Timestamp & IP).
- **JWT & Refresh Tokens**: Secure authentication with HttpOnly cookies.
- **Real-time Notifications**: Instant updates via Socket.io when incidents are reported or updated.

### 🔹 Modern Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, TanStack Query, Recharts, Framer Motion.
- **Backend**: Node.js, Express, TypeScript, Prisma (ORM), MongoDB.
- **Infrastructure**: Docker & Docker Compose for easy deployment.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Docker)
- Docker (Optional, for containerized run)

### Local Development

1. **Clone the repository**
2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Configure .env (DATABASE_URL, JWT_SECRET)
   npx prisma generate
   npm run dev
   ```
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📋 Role Matrix

| Permissions | User | Admin | Super Admin |
|-------------|:----:|:-----:|:-----------:|
| Submit Incidents | ✅ | ✅ | ✅ |
| View Own Incidents | ✅ | ✅ | ✅ |
| Update Status/Priority | ❌ | ✅ | ✅ |
| View All Incidents | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Delete Incidents | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ✅ |
