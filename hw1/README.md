# HW1 - Personal Portfolio Website

This is the first assignment for the Web Programming course, implementing a modern personal portfolio website.

## Project Overview

This project is a responsive personal portfolio website that showcases academic background, skills, work experience, projects, and extracurricular activities. The website features a modern design with smooth animations and excellent user experience.

## Technical Features

### 🎨 Design Features
- **Modern UI/UX**: Dark theme design with orange accent colors
- **Responsive Design**: Supports desktop, tablet, and mobile devices
- **Smooth Animations**: CSS animations and transitions for enhanced user experience
- **Accessibility**: Includes proper ARIA labels and semantic HTML

### 🛠 Technical Implementation
- **Pure Native Technology**: Uses HTML5, CSS3, and TypeScript with no framework dependencies
- **CSS Grid & Flexbox**: Modern layout techniques
- **CSS Variables**: Maintainable theme color system
- **Intersection Observer**: Implements navigation highlighting during scroll
- **CSS-only Carousel**: Pure CSS image carousel functionality

### 📱 Responsive Features
- Desktop: Sidebar + main content area dual-column layout
- Tablet: Adaptive grid layout
- Mobile: Single-column vertical layout optimized for touch

## File Structure

```
hw1/
├── index.html          # Main HTML file
├── main.ts            # TypeScript interaction logic
├── styles.css         # Additional CSS styles
├── Profile.jpg        # Personal avatar
├── bakground.jpg      # Background image
├── Resume.pdf         # Resume file
├── mail_icon.png      # Email icon
├── NTU_PIANO.JPG      # Piano club photo
├── NTU_PIANO_2.JPG    # Piano club photo 2
├── Japan.JPG          # Japan exchange photo
├── Travel_1.JPG       # Travel photo 1
├── Travel_2.jpeg      # Travel photo 2
└── README.md          # Project documentation
```

## Feature Highlights

### 🏠 Homepage Hero Section
- Full-screen background image
- Dynamic title glow effect
- Smooth scroll to content area

### 👤 Personal Information
- Personal avatar and basic information
- Social media links
- Resume download functionality

### 🎓 Education Background
- Timeline-style education experience display
- Includes bachelor's, master's, and high school education

### 💻 Skills Showcase
- Grid-layout skill icons
- Hover animation effects
- Uses CDN icon resources

### 💼 Work Experience
- Detailed work experience descriptions
- Includes internship and research experience
- Clickable company links

### 🚀 Project Portfolio
- Card-style project display
- Direct links to GitHub repositories
- Includes project descriptions and technical details

### 🎵 Extracurricular Activities
- Rich extracurricular activity showcase
- CSS-only image carousel functionality
- Includes piano club, international exchange, travel photography, etc.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

1. Open `index.html` file directly
2. Use local server (such as Live Server)
3. Deploy to GitHub Pages or other static website hosting services

## Development Guide

### Local Development
```bash
# Use Live Server or other local server
# Or open index.html directly
```

### Custom Theme
Modify CSS Variables to change website theme:
```css
:root {
    --bg: #0e0f12;           /* Background color */
    --panel: #1a1c22;        /* Panel color */
    --accent: #ff6a00;       /* Accent color */
    --text: #e9eef3;         /* Text color */
    --card: #22252d;         /* Card color */
    --link: #1ecbe1;         /* Link color */
}
```

## Author Information

**Yu-Chun Lin (Arthur Lin)**
- Bachelor of Science in Electrical Engineering, National Taiwan University
- Master of Graduate Institute of Communication Engineering, National Taiwan University
- Email: arthurlin0120@gmail.com
- GitHub: [pianoholic0120](https://github.com/pianoholic0120)

## License

This project is for educational purposes only. Please do not use for commercial purposes.
