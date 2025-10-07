# NTU Course Registration Service

A modern, responsive web application for course registration at National Taiwan University, built with React 19, TypeScript, and shadcn/ui components with Twitter Tweak UI design system.

![License](https://img.shields.io/badge/license-Educational-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.9-646CFF.svg)

## Features

### Four-Stage Registration Process

1. **Browse & Explore** - Discover courses with advanced filtering
2. **Planning Container** - Plan schedules with conflict detection
3. **Submit Record** - Review and submit registration
4. **Modification System** - Modify submitted registrations

## Getting Started

### Prerequisites

- **Node.js**: 18.0 or higher
- **Package Manager**: npm (included with Node.js) or yarn
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Installation

1. **Navigate to project directory**:

```bash
cd ./hw3
```

2. **Install dependencies**:

```bash
npm install
```

3. **Start the development server**:

```bash
npm run dev
```

4. **Open your browser** and navigate to `http://localhost:5173` (Vite default port)

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type checking
npx tsc --noEmit
```

## Project Structure

```
hw3/
├── src/
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── alert-dialog.tsx    # Confirmation dialogs
│   │   │   ├── button.tsx          # Enhanced button component
│   │   │   ├── card.tsx            # Card container
│   │   │   ├── dialog.tsx          # Modal dialogs
│   │   │   ├── input.tsx           # Form inputs
│   │   │   ├── select.tsx          # Dropdown selects
│   │   │   ├── tabs.tsx            # Tab navigation
│   │   │   ├── tooltip.tsx         # Tooltips
│   │   │   └── ...                 # Other UI components
│   │   ├── stages/                 # Main application stages
│   │   │   ├── BrowseStage.tsx     # Course browsing & filtering
│   │   │   ├── PlanningStage.tsx   # Schedule planning
│   │   │   ├── SubmittedStage.tsx  # Registration review
│   │   │   └── ModificationStage.tsx # Registration modification
│   │   ├── AppShell.tsx            # Main layout & navigation
│   │   └── WeeklySchedule.tsx      # Schedule visualization
│   ├── hooks/
│   │   ├── useAppState.ts          # Application state management
│   │   └── useCourseData.ts        # Course data with hot reload
│   ├── contexts/
│   │   └── AppContext.tsx          # Global state context
│   ├── data/
│   │   └── courseLoader.ts         # CSV parsing and utilities
│   ├── types/
│   │   └── course.ts               # TypeScript interfaces
│   ├── utils/
│   │   └── cn.ts                   # Class name utility
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles with Twitter Tweak UI
├── public/data/
│   └── hw3-ntucourse-data-1002.csv # Course data with hot reload
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── vite.config.ts                  # Vite build configuration
├── postcss.config.ts               # PostCSS configuration
└── README.md                       # This file
```

## Data Management

### Course Data Format

The application reads course data from `public/data/hw3-ntucourse-data-1002.csv`. The CSV contains the following key fields:

| Field                        | Description             | Example  |
| ---------------------------- | ----------------------- | -------- |
| `cou_cname`                | Course name (Chinese)   | 微積分   |
| `cou_ename`                | Course name (English)   | Calculus |
| `cou_code`                 | Course code             | MATH1001 |
| `credit`                   | Number of credits       | 3        |
| `tea_cname`                | Instructor name         | 張教授   |
| `st1-day1` to `st6-day6` | Time slots              | Mon 1,2  |
| `limit`                    | Course capacity         | 120      |
| `dpt_abbr`                 | Department abbreviation | MATH     |

### Hot Reload System

The application automatically detects changes to the CSV file and reloads the data without requiring a restart:

- **File Polling**: Checks for changes every 5 seconds
- **Timestamp Comparison**: Compares file modification times
- **State Updates**: Automatically updates application state
- **UI Refresh**: Components re-render with new data
- **Error Handling**: Graceful handling of file access errors

### Data Processing Pipeline

1. **CSV Parsing**: Papa Parse library for robust CSV processing
2. **Time Slot Conversion**: Converts time codes to structured data
3. **Type Safety**: TypeScript interfaces ensure data integrity
4. **Caching**: Efficient data storage and retrieval
5. **Filtering**: Real-time filtering with multiple criteria

## Usage Guide

### Stage 1: Browse & Explore

**Purpose**: Discover and evaluate courses without commitment pressure

#### Features:

- **Smart Search**: Find courses by name, code, or instructor
- **Advanced Filtering**: Filter by department, year, credits, time slots, and days
- **Dual Views**: Switch between grid cards and detailed list view
- **Time Reference**: Built-in time slot reference table
- **Easy Addition**: One-click "Add to Planning" with toast feedback
- **Responsive**: Optimized for desktop, tablet, and mobile

#### Filter Options:

- **Department**: Filter by course department
- **Year**: Filter by academic year
- **Credits**: Filter by credit hours (0-6)
- **Days**: Filter by class days (Mon-Sun)
- **Time Slots**: Filter by specific time periods
- **Search**: Text search across all course fields

### Stage 2: Planning Container

**Purpose**: Safe sandbox for experimenting with different schedule combinations

#### Features:

- **Multiple Plans**: Create and compare different scenarios (Plan A, B, C, etc.)
- **Easy Removal**: Hover to reveal delete buttons with confirmation
- **Statistics**: Live course count, credits, and conflict tracking
- **Auto-save**: Continuous state persistence

#### Planning Tools:

- **Create New Plan**: Add additional planning scenarios
- **Switch Plans**: Compare different course combinations
- **Conflict Resolution**: Visual indicators for time conflicts
- **Credit Tracking**: Real-time credit calculation

### Stage 3: Submit Registration

**Purpose**: Clear transition from exploration to commitment

#### Features:

- **Pre-submission Review**: Comprehensive course summary
- **Confirmation**: Two-step submission process
- **Success Feedback**: Confirmation number and celebration

#### Submission Process:

1. **Review Courses**: Check selected courses and total credits
2. **Conflict Check**: Ensure no time conflicts exist
3. **Confirm Submission**: Final confirmation with validation
4. **Success State**: Confirmation number and summary

### Stage 4: Modification System

**Purpose**: Allow changes to submitted registration with safeguards

#### Features:

- **Modification Mode**: Clear visual distinction from planning
- **Change Tracking**: Real-time change summary with visual indicators
- **Comparison View**: Side-by-side original vs modified schedules
- **Re-submission**: Complete modification with new confirmation
- **Reason Tracking**: Optional reason for modification

#### Modification Tools:

- **Add Courses**: Browse and add new courses
- **Remove Courses**: Delete courses with confirmation
- **Change Summary**: Visual indicators for added/removed courses
- **Final Review**: Before/after comparison before submission

## Customization & Development

### Adding New Components

The application uses shadcn/ui components. To add new components:

1. **Use the MCP server** to get component code:

```bash
# Get component source code
mcp_shadcn-ui_get_component <component-name>

# Get component demo
mcp_shadcn-ui_get_component_demo <component-name>
```

2. **Add to project structure**:

```bash
# Add component to UI library
cp component.tsx src/components/ui/

# Import in your components
import { Component } from '@/components/ui/component'
```

### Styling System

- **Global Styles**: `src/index.css` with Twitter Tweak UI design system
- **CSS Variables**: OKLCH color space for consistent visual perception
- **Tailwind Configuration**: `tailwind.config.ts` with custom design tokens
- **Component Styles**: Enhanced button feedback and animations
- **Responsive Design**: Mobile-first approach with breakpoint utilities
- **Dark Mode**: Built-in support with CSS variables

### State Management

The application uses React Context API with useReducer:

- **`AppContext`**: Global application state management
- **`useAppState`**: Hook for accessing application state
- **`useCourseData`**: Course data with hot reload functionality
- **State Actions**: Type-safe actions for state updates

### Component Architecture

```
App.tsx (Root)
├── AppProvider (Context)
├── AppShell (Layout)
├── Stage Components
│   ├── BrowseStage
│   ├── PlanningStage
│   ├── SubmittedStage
│   └── ModificationStage
└── UI Components (shadcn/ui)
```

### Performance Optimization

- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Efficient Rendering**: Optimized re-rendering with React hooks
- **Bundle Optimization**: Vite's built-in optimization

## Browser Support

| Browser | Version | Status             |
| ------- | ------- | ------------------ |
| Chrome  | 90+     | ✅ Fully Supported |
| Firefox | 88+     | ✅ Fully Supported |
| Safari  | 14+     | ✅ Fully Supported |
| Edge    | 90+     | ✅ Fully Supported |

## License

This project is for **educational purposes** as part of the National Taiwan University Web Programming course.

### Usage Rights

- ✅ **Educational Use**: Free for academic and learning purposes
- ✅ **Personal Projects**: Can be used as reference for personal projects
- ❌ **Commercial Use**: Not permitted for commercial applications
- ❌ **Redistribution**: Cannot be redistributed without permission

## Support & Troubleshooting

### Common Issues

1. **Port Already in Use**: Change port in `vite.config.ts`
2. **CSV File Not Loading**: Check file path and permissions
3. **Build Errors**: Run `npm run build` to check for TypeScript errors
4. **Hot Reload Not Working**: Restart development server

### Getting Help

- **Course Documentation**: Refer to course materials
- **GitHub Issues**: Create issue for bugs or feature requests
- **Course Instructor**: Contact for academic-related questions
- **Development Community**: Stack Overflow for technical questions

### Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests if applicable**
5. **Submit a pull request**

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Built with ❤️ for the NTU Web Programming Course**
