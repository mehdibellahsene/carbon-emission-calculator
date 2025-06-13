# 🌍 Carbon Emission Calculator

A modern web application for calculating and tracking carbon emissions across multiple categories including business travel, cloud computing, and freight transport. Built with Vue 3, TypeScript, and powered by the Climatiq API for accurate emission calculations.

## ✨ Features

### 📊 Emission Calculators
- **Business Travel**: Calculate CO2 emissions for air, car, and rail travel between cities
- **Intermodal Freight**: Track emissions for freight transport via airplane, ship, truck, and train
- **Cloud Computing**: Comprehensive cloud carbon footprint analysis
  - CPU usage emissions for AWS, Azure, and Google Cloud Platform
  - Memory consumption tracking
  - Storage emissions (SSD/HDD) across different cloud providers

### 🔐 User Management
- Google Authentication integration via Firebase
- User-specific data storage and history tracking
- Secure login/logout functionality

### 📈 Data Management & Analytics
- Personal carbon emission history and analytics
- Export/import data functionality (JSON format)
- Monthly and category-based emission tracking
- Real-time emission trend analysis
- Detailed emission breakdowns (CO2, CH4, N2O)

### 🎨 User Experience
- Modern, responsive design with animated transitions
- Interactive video backgrounds for different transport modes
- Toast notifications for user feedback
- Progressive form validation
- Real-time unit conversions

## 🛠️ Technology Stack

- **Frontend**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS with custom animations
- **State Management**: Pinia stores
- **Routing**: Vue Router 4
- **Authentication**: Firebase Auth with Google provider
- **API Integration**: Climatiq API for emission calculations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase project with Google Auth enabled
- Climatiq API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Carbon-Emission-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Climatiq API
   VITE_CLIMATIQ_API_KEY=your_climatiq_api_key
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

6. **Preview Production Build**
   ```bash
   npm run preview
   ```

## 📱 Application Structure

### Main Navigation
- **Business Travel** (`/`) - Calculate emissions for business trips
- **Intermodal Freight** (`/intermodal-freight`) - Freight transport emissions
- **Cloud CPU** (`/cloud-cpu`) - Cloud computing CPU emissions
- **Cloud Storage** (`/cloud-storage`) - Cloud storage emissions
- **Cloud Memory** (`/cloud-memory`) - Cloud memory usage emissions
- **Carbon History** (`/carbon-history`) - View and manage emission history
- **Login** (`/login`) - User authentication

### Key Components
- **FormInput**: Reusable input components with validation
- **TransportOption**: Selection interface for transport modes
- **ToastNotification**: User feedback system
- **UserProfile**: Authentication status and user management
- **PageNavigation**: Application navigation

## 🔌 API Integration

### Climatiq API Endpoints
- **Travel Emissions**: Distance-based travel calculations
- **Freight Emissions**: Intermodal freight transport
- **Cloud Computing**: CPU, memory, and storage emissions
- **Metadata**: Cloud provider regions and configurations

### Supported Cloud Providers
- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)

### Emission Factors
All calculations use scientifically-backed emission factors from the Climatiq database, providing:
- CO2 equivalent emissions
- Direct CO2 emissions
- Methane (CH4) and Nitrous Oxide (N2O) breakdowns
- LCA (Life Cycle Assessment) activities
- Source attribution and data quality flags

## 💾 Data Storage

### Local Storage
- User-specific emission records stored locally
- Automatic data persistence across sessions
- Support for data export/import

### Data Structure
```typescript
interface CarbonEmissionRecord {
  id: string;
  userId: string;
  timestamp: string;
  category: string;
  co2e: number;
  details: object;
  formData: object;
  source: string;
}
```

## 🔒 Security & Privacy

- Firebase Authentication ensures secure user management
- User data is isolated and stored locally
- API keys are environment-protected
- No sensitive data transmitted without encryption

## 🎯 Use Cases

### For Businesses
- Track corporate travel carbon footprint
- Monitor cloud infrastructure emissions
- Generate sustainability reports
- Set and track emission reduction goals

### For Individuals
- Personal carbon footprint tracking
- Travel impact awareness
- Cloud usage optimization
- Environmental impact monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Climatiq](https://www.climatiq.io/) for providing comprehensive emission factor APIs
- [Firebase](https://firebase.google.com/) for authentication services
- Vue.js and TypeScript communities for excellent tooling

---

**Made with 💚 for a sustainable future**
