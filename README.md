# Course Builder - Modular Course Design & Management Platform

A highly flexible, customizable online course construction tool that empowers educators, trainers, and content creators to efficiently design, combine, manage, and share structured, modular educational content.

## 🚀 Features

- **Course Management**: Create and manage courses by combining books, schedules, objectives, and methods
- **Book Library**: Centralized library of reusable educational materials
- **Vocabulary System**: Organize vocabulary with CEFR levels and part of speech categorization
- **Schedule Design**: Flexible teaching schedules with calendar views and lesson planning
- **Learning Objectives**: Reusable teaching objectives for consistency across courses
- **Teaching Methods**: Manage various teaching strategies (PBL, flipped classroom, etc.)
- **Bulk Operations**: Import/export functionality for efficient content management
- **Public Sharing**: Generate shareable links for stakeholders
- **Analytics Dashboard**: Comprehensive reporting and analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Storage)
- **UI Components**: Custom components with Headless UI
- **Styling**: Tailwind CSS with custom design system
- **Development**: ESLint, Prettier, TypeScript

## 📋 Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager
- Git

## 🏗️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd course-builder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration values.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:5001](http://localhost:5001) in your browser.

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   └── ui/             # Base UI components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
├── hooks/              # Custom React hooks
└── stores/             # State management
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎯 Development Phases

### Phase 1: Foundation (Current)
- ✅ Project Setup and Architecture
- 🔄 Supabase Integration and Authentication
- ⏳ Database Schema Design
- ⏳ UI Component Library

### Phase 2: Core Modules
- Course Management Module
- Book Library Management
- Vocabulary Management System
- Schedule Design System

### Phase 3: Advanced Features
- Entity Relationships & Associations
- Bulk Import/Export Functionality
- Advanced Search & Filtering
- Public Sharing Links

### Phase 4: Polish & Deploy
- UI/UX Polish & Responsive Design
- Performance Optimization
- Security & Data Validation
- Testing Suite Implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@coursebuilder.com or join our community discussions.

---

Built with ❤️ for educators and content creators.
