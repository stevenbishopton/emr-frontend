# EMR Frontend - Hospital Management System

A comprehensive Electronic Medical Record (EMR) frontend application built with React, Vite, and TailwindCSS. This system manages patient records, appointments, prescriptions, billing, lab tests, radiography, and ward admissions for healthcare facilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Project Structure](#project-structure)
- [Role-Based Access](#role-based-access)
- [Key Features by Module](#key-features-by-module)
- [Real-Time Notifications](#real-time-notifications)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

This EMR frontend provides a complete web-based interface for hospital staff to manage all aspects of patient care. It integrates with a Spring Boot backend via REST APIs and WebSockets for real-time notifications.

**Live Demo:** [https://github.com/stevenbishopton/emr-frontend](https://github.com/stevenbishopton/emr-frontend)

---

## Features

### Core Modules
- **Patient Management** - Registration, search, and medical history tracking
- **Reception** - Patient check-in, queue management, and billing
- **Doctor Portal** - Diagnosis, prescriptions, and patient queues
- **Nursing Station** - Vital signs, admissions, and nurse requests
- **Laboratory** - Test ordering, sample processing, and results
- **Radiography** - X-ray/scan scheduling and reporting
- **Pharmacy (Px)** - Prescription dispensing and inventory
- **Ward Management** - Bed allocation and patient admissions
- **Admin Panel** - User management, departments, and reporting
- **Billing & Finance** - Invoice generation, payments, and receipts

### Technical Features
- JWT-based authentication with automatic token refresh
- Role-based route protection
- Real-time WebSocket notifications
- Responsive design for desktop and tablet use
- PDF generation for receipts and reports
- Interactive charts and analytics
- Persistent state management

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + Vite 7 |
| **Routing** | React Router DOM v6 |
| **Styling** | TailwindCSS 3.4 |
| **State Management** | Zustand (with persistence) |
| **HTTP Client** | Axios |
| **Real-Time** | STOMP over WebSocket (SockJS) |
| **Charts** | Recharts |
| **PDF Export** | jsPDF + jsPDF-Autotable |
| **Date Handling** | date-fns |
| **Icons** | Lucide React |
| **Notifications** | Sonner (toast notifications) |
| **Build Tool** | Vite |
| **Linting** | ESLint 9 |

---

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+ or **yarn** 1.22+
- Backend API running (Spring Boot EMR backend)
- Modern web browser (Chrome, Firefox, Edge, Safari)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/stevenbishopton/emr-frontend.git
cd emr-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment (Optional)

Create a `.env` file in the root directory if you need to customize the API base URL:

```env
VITE_API_BASE_URL=/emr
```

**Note:** The default base URL is `/emr` which works with the standard backend setup. The Vite dev server proxy handles API requests.

---

## Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

### Development Workflow

1. Ensure the backend API is running at `http://localhost:8080`
2. Run `npm run dev` to start the frontend
3. Open `http://localhost:5173` in your browser
4. Log in with valid credentials (see backend setup for seed users)
5. Navigate through different modules based on your role

---

## Project Structure

```
emr-frontend/
├── public/                  # Static assets
├── src/
│   ├── App.jsx             # Main app component with routes
│   ├── main.jsx            # Entry point
│   ├── index.css           # Global styles
│   ├── AuthProvider.jsx    # Authentication context
│   ├── apiClient.js        # Axios instance with interceptors
│   ├── usePatients.js      # Patient data hooks
│   ├── assets/             # Images and fonts
│   ├── components/         # Reusable UI components
│   │   ├── ProtectedRoute.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── ItemCatalog.jsx
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── NotificationContext.jsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useNotificationManager.js
│   │   └── ...
│   ├── modals/             # Modal components
│   ├── pages/              # Page components (routes)
│   │   ├── LoginPage.jsx
│   │   ├── ReceptionPage.jsx
│   │   ├── DoctorPage.jsx
│   │   ├── NursesPage.jsx
│   │   ├── LabHomePage.jsx
│   │   ├── AdminPage.jsx
│   │   └── ... (50+ pages)
│   ├── services/           # API service functions
│   │   ├── websocketService.js
│   │   └── notificationApi.js
│   ├── stores/             # Zustand state stores
│   │   ├── useAuthStore.js
│   │   ├── useNotificationStore.js
│   │   └── ...
│   └── utils/              # Utility functions
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # TailwindCSS configuration
├── eslint.config.js        # ESLint configuration
└── package.json            # Dependencies
```

---

## Role-Based Access

The system implements role-based access control (RBAC) with the following roles:

| Role | Access Level |
|------|--------------|
| **ROLE_ADMIN** | Full access to all modules, user management, departments |
| **ROLE_DOCTOR** | Patient queues, prescriptions, medical history, admissions |
| **ROLE_NURSE** | Vital signs, nursing station, nurse requests, reports |
| **ROLE_RECEPTIONIST** | Patient registration, billing, queues, admissions |
| **ROLE_LAB_TECHNICIAN** | Lab test processing, results entry, lab catalog |
| **ROLE_RADIOGRAPHER** | X-ray/scan processing, radiograph catalog |
| **ROLE_PHARMACIST** | Prescription dispensing (implied via Px pages) |

### Protected Routes

Routes are protected using the `ProtectedRoute` component which validates:
1. User is authenticated (valid JWT token)
2. User has the required role for the route

Example route configuration:
```jsx
<Route
  path="/doctor"
  element={
    <ProtectedRoute allowedRoles={["ROLE_DOCTOR", "ROLE_ADMIN"]}>
      <DoctorPage />
    </ProtectedRoute>
  }
/>
```

---

## Key Features by Module

### Patient Management
- Patient registration with demographic data
- Medical history tracking by visits
- Search and filter patients
- Insurance information management

### Reception
- Patient check-in and queue assignment
- Appointment scheduling
- Billing and payment processing
- Receipt generation (PDF)

### Doctor Portal
- Patient queue management
- Diagnosis and treatment notes
- Prescription writing
- Medical history review
- Patient admission/discharge

### Nursing Station
- Vital signs recording (BP, temperature, pulse, etc.)
- Nurse requests for doctors
- Ward and bed management
- Nursing reports

### Laboratory
- Test ordering from doctors
- Sample processing workflow
- Result entry and validation
- Lab test catalog management
- Historical results lookup

### Radiography
- X-ray and scan scheduling
- Image processing workflow
- Radiologist reports
- Patient imaging history

### Pharmacy (Px)
- Prescription dispensing
- Inventory management
- Drug catalog
- Sales history

### Billing & Finance
- Invoice generation
- Payment processing (cash, insurance)
- Receipt printing
- Financial reporting

---

## Real-Time Notifications

The system features a sophisticated real-time notification system using WebSockets (STOMP over SockJS).

### Features
- **Priority Levels**: URGENT, HIGH, MEDIUM, LOW
- **Notification Types**: New patient, urgent case, results ready, equipment ready
- **Sound Alerts**: Different sounds based on priority
- **Department Broadcasting**: Send notifications to entire departments
- **Persistent Storage**: Last 100 notifications stored locally

### WebSocket Configuration
- **Endpoint**: `ws://localhost:8080/emr/ws`
- **User Topic**: `/user/queue/notifications`
- **Department Topic**: `/topic/department/{departmentId}`

See `NOTIFICATION_SYSTEM_SETUP.md` for detailed setup instructions.

---

## API Integration

### Base Configuration
- **Base URL**: `/emr` (proxied by Vite dev server)
- **Timeout**: 10 seconds
- **Content-Type**: `application/json`

### Authentication
- JWT tokens stored in memory (Zustand)
- Automatic token refresh on 401 responses
- Logout on refresh token expiration

### Key API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Patients | `GET /patients`, `POST /patients`, `GET /patients/{id}` |
| Visits | `GET /visits`, `POST /visits`, `PUT /visits/{id}` |
| Bills | `GET /bills`, `POST /bills`, `PUT /bills/{id}/pay` |
| Lab | `GET /lab-tests`, `POST /lab-tests`, `PUT /lab-tests/{id}/results` |
| Prescriptions | `GET /prescriptions`, `POST /prescriptions` |
| Admissions | `GET /admissions`, `POST /admissions` |

See `src/apiClient.js` for the complete Axios configuration with interceptors.

---

## State Management

The application uses **Zustand** for state management with persistence for certain stores.

### Stores

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `useAuthStore` | Authentication state (token, user) | No |
| `useNotificationStore` | Notifications, unread count | Yes (localStorage) |
| `useQueueStore` | Queue management state | No |
| `usePatientStore` | Patient search and selection | No |

### Auth Store Features
- Token storage and validation
- Automatic expiration checking
- Token refresh handling
- Logout functionality

Example usage:
```javascript
import useAuthStore from "./stores/useAuthStore";

const MyComponent = () => {
  const { user, token, logout } = useAuthStore();
  // Use auth state...
};
```

---

## Building for Production

### Create Production Build

```bash
npm run build
```

This generates optimized static files in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

---

## Deployment

### Static Hosting (Recommended)

The built application is a static site that can be deployed to:
- **Netlify**
- **Vercel**
- **GitHub Pages**
- **AWS S3 + CloudFront**
- **Any static hosting**

### Deployment Steps

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder contents to your hosting provider

3. Configure environment variables if needed for API base URL

### Nginx Configuration (Example)

```nginx
server {
    listen 80;
    server_name emr.yourdomain.com;
    root /var/www/emr-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /emr {
        proxy_pass http://localhost:8080/emr;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Troubleshooting

### Common Issues

#### WebSocket Not Connecting
- Verify backend WebSocket endpoint is running
- Check CORS configuration on backend
- Ensure authentication token is valid

#### 401 Unauthorized Errors
- Check if token has expired
- Verify refresh token endpoint is working
- Clear browser storage and re-login

#### API Calls Failing
- Confirm backend is running at expected URL
- Check network tab for CORS errors
- Verify API base URL configuration

#### Build Failures
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

### Development Tips

- Use browser DevTools Network tab to inspect API calls
- Check React DevTools for component hierarchy
- Use Zustand DevTools extension for state inspection
- Enable Redux DevTools for Zustand stores

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is licensed under the terms in the [LICENSE](./LICENSE) file.

---

## Support

For issues and questions:
- Create an issue on [GitHub](https://github.com/stevenbishopton/emr-frontend/issues)
- Contact the development team

---

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)

