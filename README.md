# Noctrail-Interactive (BriefAI)

An AI-powered CEO Morning Briefing Platform designed for Indian business executives and entrepreneurs. Get daily actionable intelligence from real-time market data, news, and investment insights—all synthesized by AI to help you make informed decisions without hours of research.

## 🚀 How It Works

Noctrail-Interactive aggregates data from multiple sources and uses advanced AI models to generate personalized daily briefings:

1. **Data Collection**: Fetches real-time market indices (NIFTY, SENSEX), commodities (Gold, Crude Oil), currency rates (USD/INR), and curated news from business, global markets, and VC funding sources.

2. **AI Synthesis**: Leverages Google's Gemini AI to analyze all data and generate structured JSON briefings containing market pulse, sector analysis, business opportunities, risk alerts, and executive summaries.

3. **Interactive Chat**: Powered by Groq's Llama model for real-time Q&A about market conditions, briefings, and business intelligence.

4. **Personalization**: Users can customize dashboards, manage portfolios, set preferences, and receive push notifications for critical updates.

The platform uses Firebase for authentication and data storage, ensuring secure and scalable operations.

## ✨ Key Features

- **Dashboard**: Central hub with executive summary, market pulse, portfolio snapshot, and commodities tracker
- **Morning Briefing**: AI-generated daily intelligence with market trends, top sectors, opportunities, and risk alerts
- **AI Chat Assistant**: Interactive Q&A with market context and briefing data
- **Markets**: Historical charts for NIFTY/SENSEX, spot prices, and technical analysis
- **News Hub**: Curated business opportunities, global events, and VC funding highlights
- **Portfolio Tracker**: Manage holdings, track P&L, and add/remove stocks with real-time updates
- **Alerts**: Email and push notifications for market events and risk alerts
- **Settings**: Theme toggles, font selection, drag-and-drop widget management, and notification preferences

## 🎯 Benefits

- **India-Centric Focus**: Tailored for Indian markets with NIFTY 50, SENSEX, INR, and local sector analysis
- **AI-Driven Insights**: Automated synthesis of market data, news, and VC funding into actionable intelligence
- **Real-Time Updates**: Live market prices, news feeds, and chat interactions
- **Personalization**: Customizable dashboards and preferences to match your workflow
- **Time-Saving**: Get CEO-level market analysis in minutes, not hours
- **Comprehensive Coverage**: Multi-source intelligence from trusted APIs and AI models
- **Mobile-Responsive**: Works seamlessly on desktop and mobile devices

## 👨‍💻 Developer

**Sayan** - Full-stack developer specializing in AI-powered web applications.

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Next.js API Routes, Firebase (Auth & Firestore)
- **AI**: Google Gemini API, Groq API (Llama models)
- **Data Sources**: Yahoo Finance 2, GNews API
- **UI Components**: Lucide React, Recharts, dnd-kit
- **Deployment**: Vercel

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Noctrail-Interactive

Install dependencies:

npm install

Set up environment variables:
Create a .env.local file with your API keys:

FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
GNEWS_API_KEY=your_gnews_key

Configure Firebase:

Set up a Firebase project
Enable Authentication and Firestore
Update firebase.json and firestore.rules as needed

Run the development server:
npm run dev

Open http://localhost:3000 to view the application.

🚀 Usage
Sign Up/Login: Create an account or sign in with Google OAuth
Generate Briefing: Click "Generate Your First Briefing" on the dashboard
Explore Features: Navigate through Dashboard, Briefing, Chat, Markets, News, and Portfolio
Customize: Adjust settings, reorder widgets, and manage notifications
Stay Updated: Enable push notifications for real-time alerts

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📄 License
This project is private and proprietary.


This README provides a comprehensive overview of the project, including how it works, key features, benefits, and developer information as requested. It replaces the generic Next.js template with professional documentation tailored to Noctrail-Interactive.