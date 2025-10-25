# Web Programming Course Assignments

This repository contains all assignments for the Web Programming course, showcasing various web development technologies and techniques through practical projects.

## Course Overview

The Web Programming course covers modern web development technologies, including frontend frameworks, responsive design, user experience optimization, and interactive web applications. Each assignment focuses on different aspects of web development, building from basic HTML/CSS to complex React applications.

## Assignment Structure

### HW1 - Personal Portfolio Website
**Technology Stack**: HTML5, CSS3, TypeScript (Vanilla)

A responsive personal portfolio website featuring:
- Modern dark theme design with smooth animations
- Responsive layout supporting desktop, tablet, and mobile devices
- Interactive sections including academic background, skills, and projects
- Pure native web technologies without framework dependencies
- CSS Grid and Flexbox for advanced layout techniques

**Key Features**:
- Academic background and achievements
- Technical skills showcase with interactive icons
- Project portfolio with detailed descriptions
- Contact information and social media links
- Accessibility features and semantic HTML structure

### HW2 - Sliding Blocks Coverage Game
**Technology Stack**: React 18, TypeScript, CSS Modules

An interactive puzzle game where players control multiple blocks to cover all reachable grid cells:
- Synchronized block movement mechanics
- Progressive difficulty across 8 levels (3x3 to 6x6 grids)
- Star-based scoring system with optimal solution challenges
- Real-time audio feedback and visual effects
- Complete game state management with progress persistence

**Key Features**:
- Intuitive touch and keyboard controls
- Animated victory effects and particle systems
- Programmatic audio generation using Web Audio API
- Responsive UI with fantasy adventure theme
- Local storage for progress tracking and high scores

### HW3 - NTU Course Registration Service
**Technology Stack**: React 19, TypeScript, shadcn/ui, Tailwind CSS, Twitter Tweak UI Design System

A comprehensive course registration system featuring a four-stage workflow that simulates the real-world course selection process at National Taiwan University:

#### Core Features:
- **🔥 Hot Reload Data**: Automatically updates when CSV data changes (5-second polling)
- **⚡ Real-time Conflict Detection**: Instant schedule conflict checking with visual indicators
- **📋 Multiple Planning Scenarios**: Create and compare different schedules (Plan A, B, C, etc.)
- **🎨 Twitter Tweak UI Design**: Modern design system with OKLCH colors and smooth animations
- **🌐 Multilingual Support**: Chinese and English interface
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices

#### Four-Stage Registration Process:
1. **Browse & Explore**: Advanced course filtering with search, department, year, credits, and time slot filters
2. **Planning Container**: Interactive weekly calendar with real-time conflict detection and multiple plan scenarios
3. **Submit Registration**: Comprehensive review process with validation and confirmation
4. **Modification System**: Safe modification of submitted registrations with change tracking

#### Technical Highlights:
- **State Management**: React Context API with useReducer for predictable state updates
- **Data Processing**: Custom CSV parser with TypeScript interfaces and hot reload functionality
- **UI Components**: shadcn/ui v4 with Radix UI primitives and enhanced button feedback
- **Performance**: Code splitting, lazy loading, and efficient re-rendering with React hooks
- **Accessibility**: WCAG 2.1 AA compliance with semantic HTML and keyboard navigation

#### Design System:
- **Color Space**: OKLCH for consistent visual perception
- **Typography**: Open Sans font family with responsive scaling
- **Shadows**: Twitter-style shadow system with multiple levels
- **Border Radius**: 1.3rem base radius with responsive variants
- **Animations**: CSS transitions with enhanced button feedback and hover effects

### HW4 - Taiwan Rental Property Platform
**Technology Stack**: React 18, TypeScript, Node.js, Express.js, SQLite, Google Maps API

A comprehensive full-stack rental property platform featuring:

#### Core Features:
- **Interactive Map Integration**: Google Maps with geocoding, reverse geocoding, and place search
- **Property Management**: Complete CRUD operations for rental listings
- **Advanced Filtering**: Multi-criteria filtering by location, price, amenities, and property type
- **User Authentication**: JWT-based authentication with secure password hashing
- **Favorites System**: User favorites management with real-time updates
- **Rating System**: Comprehensive rating and review system with Chinese reviewer names
- **Real-time Search**: Location-based search with distance calculations

#### Technical Architecture:
- **Frontend**: React 18 with TypeScript, Vite build system, shadcn/ui components
- **Backend**: Node.js with Express.js, TypeScript, SQLite database
- **Maps Integration**: Google Maps JavaScript API and server-side geocoding services
- **Security**: JWT authentication, bcrypt password hashing, CORS protection
- **Data Management**: Automated data generation with 400+ realistic property listings

#### Key Features:
- **Nationwide Coverage**: Properties distributed across all of Taiwan
- **Multilingual Support**: Chinese interface with localized Google Maps responses
- **Responsive Design**: Mobile-first approach with modern UI components
- **Real-time Updates**: Immediate UI updates for favorites and ratings
- **Data Persistence**: SQLite database with comprehensive test data
- **Automated Setup**: One-click setup and start scripts for easy deployment

#### Development Tools:
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Component Library**: shadcn/ui with custom styling and animations
- **Database Management**: SQLite with automated data generation scripts
- **API Documentation**: Comprehensive RESTful API with curl examples

### HW5 - [Assignment Title]
*Assignment details will be added upon completion*

### HW6 - [Assignment Title]
*Assignment details will be added upon completion*

### HW7 - [Assignment Title]
*Assignment details will be added upon completion*

### Final Project - [Project Title]
*Final project details will be added upon completion*

## Technical Progression

The assignments are designed to progressively build web development skills:

1. **Foundation (HW1)**: Native web technologies, responsive design, and accessibility
2. **Framework Introduction (HW2)**: React ecosystem, TypeScript integration, and component architecture
3. **Advanced Concepts (HW3)**: 
   - **Complex State Management**: React Context API with useReducer
   - **Advanced UI Components**: shadcn/ui with custom design systems
   - **Data Processing**: CSV parsing, hot reload, and real-time updates
   - **Performance Optimization**: Code splitting, lazy loading, and efficient rendering
   - **Design Systems**: Twitter Tweak UI with OKLCH colors and modern styling
   - **Accessibility**: WCAG 2.1 AA compliance and keyboard navigation
   - **Multilingual Support**: Internationalization and responsive design
4. **Future Assignments (HW4-HW7)**: [To be updated as assignments are completed]
5. **Capstone Project (Final)**: [To be updated upon completion]

### Skill Development Timeline
- **HW1**: HTML5, CSS3, TypeScript fundamentals
- **HW2**: React basics, component architecture, game development
- **HW3**: Advanced React patterns, state management, design systems, data processing
- **HW4**: Full-stack development, Google Maps integration, authentication, database management, real-time features
- **HW5+**: [Advanced topics to be covered in future assignments]

## Development Environment

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Setup Instructions
Each assignment has its own setup instructions. Navigate to the specific assignment directory and follow the README.md file for detailed installation and running instructions.

### General Setup
```bash
# Clone the repository
git clone [repository-url]
cd wp1141

# Navigate to specific assignment
cd hw[number]

# Install dependencies (if applicable)
npm install

# Run the project (if applicable)
npm start
```

## Learning Outcomes

Through these assignments, students will gain proficiency in:

### Core Web Technologies
- **Frontend Development**: HTML5, CSS3, JavaScript/TypeScript
- **Modern Frameworks**: React ecosystem and component-based architecture
- **Responsive Design**: Mobile-first approach and cross-device compatibility
- **User Experience**: Interactive design and accessibility best practices

### Advanced Development Skills
- **State Management**: Complex application state with Context API and useReducer
- **Data Processing**: CSV parsing, real-time updates, and hot reload functionality
- **Design Systems**: Modern design tokens, OKLCH colors, and consistent styling
- **Performance Optimization**: Code splitting, lazy loading, and efficient rendering
- **Accessibility**: WCAG 2.1 AA compliance and inclusive design practices

### Development Tools & Practices
- **Build Systems**: Vite, webpack, and modern bundling tools
- **Package Management**: npm/yarn and dependency management
- **Version Control**: Git workflow and collaborative development
- **Code Quality**: TypeScript, ESLint, and testing frameworks
- **Deployment**: Production builds and deployment strategies

### Project Management
- **Component Architecture**: Reusable and maintainable component design
- **Documentation**: Comprehensive README files and code documentation
- **Testing**: Unit testing, integration testing, and test-driven development
- **Collaboration**: Team development and code review processes

## Project Standards

All assignments follow these development standards:

### Code Quality & Architecture
- **TypeScript**: Strict type checking for type safety and maintainability
- **Component Architecture**: Functional components with hooks and single responsibility
- **State Management**: Predictable state updates with Context API and useReducer
- **Error Handling**: Comprehensive error boundaries and graceful error recovery
- **Code Organization**: Modular structure with clear separation of concerns

### Design & User Experience
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Accessibility**: WCAG 2.1 AA compliance and semantic HTML structure
- **Design Systems**: Consistent styling with design tokens and component libraries
- **User Feedback**: Intuitive interactions with visual feedback and animations
- **Performance**: Optimized loading times and smooth user interactions

### Development Practices
- **Documentation**: Comprehensive README files and inline code comments
- **Version Control**: Proper Git workflow with meaningful commit messages
- **Testing**: Unit testing and integration testing for critical functionality
- **Code Review**: Peer review process for code quality assurance
- **Continuous Integration**: Automated testing and deployment pipelines

## Browser Compatibility

All projects are tested and compatible with:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |

### Device Support
- **Desktop**: Full feature support with optimal layout
- **Tablet**: Responsive layout with touch-friendly interactions
- **Mobile**: Optimized mobile experience with simplified navigation

## 📊 Assignment Progress

| Assignment | Status | Technologies | Key Features |
|------------|--------|--------------|--------------|
| HW1 | ✅ Complete | HTML5, CSS3, TypeScript | Portfolio website, responsive design |
| HW2 | ✅ Complete | React 18, TypeScript | Puzzle game, audio feedback, animations |
| HW3 | ✅ Complete | React 19, shadcn/ui, Tailwind | Course registration, hot reload, design system |
| HW4 | ✅ Complete | React 18, TypeScript, Node.js, Express.js, SQLite, Google Maps | Rental platform, map integration, authentication, favorites, ratings |
| HW5 | 📋 Planned | TBD | TBD |
| HW6 | 📋 Planned | TBD | TBD |
| HW7 | 📋 Planned | TBD | TBD |
| Final Project | 📋 Planned | TBD | TBD |

## 🎯 Key Achievements

### Technical Skills Developed
- **Frontend Development**: Modern React applications with TypeScript
- **State Management**: Complex application state with Context API
- **Design Systems**: Twitter Tweak UI with OKLCH colors and modern styling
- **Data Processing**: CSV parsing, hot reload, and real-time updates
- **Performance Optimization**: Code splitting, lazy loading, and efficient rendering
- **Accessibility**: WCAG 2.1 AA compliance and inclusive design

### Project Highlights
- **HW1**: Responsive portfolio with modern CSS techniques
- **HW2**: Interactive puzzle game with audio feedback and animations
- **HW3**: Comprehensive course registration system with advanced features
- **HW4**: Full-stack rental platform with Google Maps integration and real-time features

## 📄 License

This repository contains **educational projects** and is intended for learning purposes only.

### Usage Rights
- ✅ **Educational Use**: Free for academic and learning purposes
- ✅ **Personal Projects**: Can be used as reference for personal projects
- ❌ **Commercial Use**: Not permitted for commercial applications
- ❌ **Redistribution**: Cannot be redistributed without permission

## 🆘 Support & Contact

### Getting Help
- **Assignment Issues**: Refer to individual assignment README files
- **Technical Questions**: Check course documentation and resources
- **Course Questions**: Contact the course instructor
- **Development Help**: Stack Overflow and developer communities

### Contributing
We welcome contributions and feedback! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Submit a pull request**

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Built with ❤️ for the NTU Web Programming Course**

*This repository showcases progressive web development skills through practical, real-world projects.*