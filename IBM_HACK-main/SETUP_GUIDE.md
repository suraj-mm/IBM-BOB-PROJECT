# 🚀 AI Dev Assistant - Setup Guide

Complete guide to set up and run the AI-Powered Developer Assistant Platform.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Verify Installation

```bash
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

## 🛠️ Installation Steps

### 1. Clone or Navigate to Project Directory

```bash
cd "c:/Users/Akshay S/OneDrive/Desktop/ibm bobbb"
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- Next.js 14.2.3
- React 18.3.1
- Tailwind CSS 3.4.3
- Framer Motion 11.2.10
- React Flow 11.11.3
- Zustand 4.5.2
- Socket.io Client 4.7.5
- React Draggable 4.4.6
- Lucide React 0.379.0
- And more...

### 3. Verify Installation

Check that `node_modules` folder was created and `package-lock.json` exists.

## 🎨 Project Structure Overview

```
ai-dev-assistant/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Main application page
│   └── globals.css              # Global styles + glassmorphism
├── components/
│   ├── overlay/
│   │   └── FloatingContainer.tsx    # Draggable overlay wrapper
│   ├── widgets/
│   │   ├── AIAssistant.tsx          # AI chat interface
│   │   ├── ActivityFeed.tsx         # Real-time activity stream
│   │   ├── AlertPanel.tsx           # Smart alerts
│   │   ├── DependencyGraph.tsx      # Dependency visualization
│   │   ├── PRTimeline.tsx           # PR lifecycle view
│   │   ├── ImpactAnalysis.tsx       # Code impact analysis
│   │   └── TeamDashboard.tsx        # Team collaboration
│   └── ui/
│       ├── Card.tsx                 # Glassmorphic card component
│       ├── Button.tsx               # Animated button
│       ├── Badge.tsx                # Status badges
│       └── Toast.tsx                # Notification toasts
├── lib/
│   └── utils.ts                     # Utility functions
├── types/
│   └── index.ts                     # TypeScript type definitions
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── tailwind.config.ts               # Tailwind configuration
├── next.config.mjs                  # Next.js configuration
└── postcss.config.mjs               # PostCSS configuration
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

You should see:
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 🎯 First Run Experience

When you first open the application:

1. **Floating Overlay**: You'll see a draggable glassmorphic overlay
2. **AI Assistant**: Interactive chat interface on the left
3. **Activity Feed**: Real-time activity stream in the middle
4. **Alert Panel**: Smart alerts and warnings
5. **Additional Widgets**: Dependency graphs, PR timelines, etc.

### Key Features to Try

1. **Drag the Overlay**: Click and drag the header to reposition
2. **Resize**: Use the bottom-right corner to resize
3. **Minimize/Maximize**: Use the window controls in the header
4. **AI Chat**: Type questions in the AI Assistant
5. **Filter Activities**: Use the filter buttons in Activity Feed
6. **Dismiss Alerts**: Click the X on any alert to dismiss

## ⚙️ Configuration

### Environment Variables (Optional)

Create a `.env.local` file in the root directory:

```env
# WebSocket Server (for real-time features)
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# GitHub Integration (Optional)
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=true
NEXT_PUBLIC_ENABLE_VOICE_COMMANDS=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Customizing the Theme

Edit `app/globals.css` to customize colors:

```css
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --accent-blue: #58a6ff;
  --accent-purple: #bc8cff;
  /* Add your custom colors */
}
```

### Tailwind Configuration

Edit `tailwind.config.ts` to add custom utilities or extend the theme.

## 🐛 Troubleshooting

### Issue: Dependencies Not Installing

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port 3000 Already in Use

**Solution:**
```bash
# Run on a different port
PORT=3001 npm run dev
```

Or kill the process using port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: TypeScript Errors

**Solution:**
```bash
# Regenerate TypeScript types
npm run type-check

# If errors persist, restart VS Code
```

### Issue: Styles Not Loading

**Solution:**
```bash
# Rebuild Tailwind CSS
npm run dev

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Module Not Found Errors

**Solution:**
```bash
# Ensure all dependencies are installed
npm install

# Check tsconfig.json paths are correct
# Restart the dev server
```

## 📦 Building for Production

### 1. Create Production Build

```bash
npm run build
```

This will:
- Compile TypeScript
- Optimize React components
- Generate static pages
- Minify CSS and JavaScript
- Create optimized bundles

### 2. Test Production Build Locally

```bash
npm start
```

### 3. Deploy

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Docker

```bash
# Build Docker image
docker build -t ai-dev-assistant .

# Run container
docker run -p 3000:3000 ai-dev-assistant
```

#### Manual Deployment

1. Build the application: `npm run build`
2. Copy `.next`, `public`, `package.json`, and `package-lock.json` to server
3. Install production dependencies: `npm ci --production`
4. Start: `npm start`

## 🔧 Development Tips

### Hot Reload

The dev server supports hot module replacement. Changes to files will automatically reload the browser.

### Component Development

1. Create new components in `components/` directory
2. Import and use in `app/page.tsx`
3. Follow the existing component patterns

### Adding New Widgets

1. Create widget in `components/widgets/`
2. Import in `app/page.tsx`
3. Add to the grid layout
4. Update widget state management if needed

### Debugging

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Use React DevTools browser extension
# Use Next.js built-in error overlay
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Flow Documentation](https://reactflow.dev)

## 🤝 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review the [README.md](README.md)
3. Check the [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
4. Open an issue on GitHub

## ✅ Verification Checklist

After setup, verify:

- [ ] Dependencies installed successfully
- [ ] Dev server starts without errors
- [ ] Application loads at http://localhost:3000
- [ ] Floating overlay is visible and draggable
- [ ] AI Assistant widget is functional
- [ ] Activity Feed displays mock data
- [ ] Alert Panel shows alerts
- [ ] No console errors in browser
- [ ] TypeScript compilation succeeds
- [ ] Tailwind styles are applied

## 🎉 Next Steps

Once setup is complete:

1. Explore the UI and interact with widgets
2. Review the codebase structure
3. Read the architecture documentation
4. Start customizing for your needs
5. Integrate with your development tools

---

**Setup Complete!** 🚀 You're ready to use the AI Dev Assistant Platform.