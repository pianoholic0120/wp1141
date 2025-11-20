# Opentix Concert Ticket Booking Assistant

A production-ready LINE chatbot system built with Next.js 14, TypeScript, and MongoDB. This intelligent customer service bot assists users in searching for concerts, querying ticket prices, and answering booking-related questions.

## Deployment Links

### LINE Bot

- **Production URL**: [https://wp1141-openlinebot.vercel.app](https://wp1141-openlinebot.vercel.app)
- **QR Code**: ![LINE Bot QR Code](./LINE_QR_CODE.png)

Users can scan the QR code above or search for the official LINE account to start using the bot.

### Admin Dashboard

- **Production URL**: [https://wp1141-openlinebot.vercel.app/admin](https://wp1141-openlinebot.vercel.app/admin)

The admin dashboard provides comprehensive management features including:

- Real-time conversation monitoring
- Message history and search
- Analytics and statistics
- System configuration and status

## Source Code

The complete source code is available on GitHub:

**Repository**: Please update with your actual GitHub repository URL

All sensitive information has been excluded from the repository:

- Environment variables (`.env.local`, `.env`)
- API keys and secrets
- Log files
- Build artifacts (`.next/`, `node_modules/`)
- Personal configuration files

Refer to `.gitignore` for the complete list of excluded files and directories.

## Prerequisites

Before setting up the project, ensure you have the following:

- **Node.js** 18.x or later
- **npm**, **yarn**, or **pnpm** package manager
- **MongoDB Atlas** account (free tier available)
- **LINE Developers** account with a Messaging API channel
- **LLM Provider** account (OpenAI or Google Gemini API key)

## Environment Configuration

### Local Development Setup

1. **Clone the repository**:

   ```bash
   git clone <your-repository-url>
   cd hw6
   ```
2. **Install dependencies**:

   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```
3. **Create environment file**:
   Create a `.env.local` file in the project root with the following variables:

   ```bash
   # LINE Messaging API Configuration
   LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
   LINE_CHANNEL_SECRET=your_channel_secret

   # LLM Provider Configuration (at least one required)
   # Option 1: OpenAI (recommended, default)
   OPENAI_API_KEY=your_openai_api_key
   LLM_PROVIDER=openai
   OPENAI_MODEL=gpt-4o-mini

   # Option 2: Google Gemini (alternative)
   GOOGLE_API_KEY=your_google_gemini_api_key
   LLM_PROVIDER=gemini
   GOOGLE_MODEL=gemini-1.5-flash

   # Database Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```
4. **Import event data** (optional but recommended):

   ```bash
   npm run import-events
   ```

   This command imports event data from `output_site/pages/` into MongoDB.
5. **Start the development server**:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.
6. **Configure LINE Webhook for local development**:

   - Install and start [ngrok](https://ngrok.com/): `ngrok http 3000`
   - Copy the ngrok HTTPS URL (e.g., `https://xxxx.ngrok.io`)
   - In LINE Developers Console, set the Webhook URL to: `https://xxxx.ngrok.io/api/webhook`
   - Click "Verify" to confirm the webhook is working
7. **Verify the setup**:

   - Health check: `http://localhost:3000/api/health` should return `{ "ok": true }`
   - Database status: `http://localhost:3000/api/admin/db` should show connection status
   - Admin dashboard: `http://localhost:3000/admin`

### Production Deployment (Vercel)

1. **Prepare your repository**:

   - Ensure all code is committed and pushed to GitHub/GitLab/Bitbucket
   - Verify `.gitignore` excludes sensitive files (`.env.local`, `.env`, etc.)
2. **Deploy to Vercel**:

   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js configuration
3. **Configure environment variables in Vercel**:
   In Project Settings → Environment Variables, add the following:

   **Required Variables**:

   ```bash
   LINE_CHANNEL_ACCESS_TOKEN=your_production_channel_access_token
   LINE_CHANNEL_SECRET=your_production_channel_secret
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
   OPENAI_API_KEY=your_openai_api_key
   LLM_PROVIDER=openai
   OPENAI_MODEL=gpt-4o-mini
   # or (alternative)
   GOOGLE_API_KEY=your_google_gemini_api_key
   LLM_PROVIDER=gemini
   GOOGLE_MODEL=gemini-1.5-flash
   ```

   **Optional Variables**:

   ```bash
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   NODE_ENV=production
   ```

   Important: Select "Production" environment for all variables. Do not use development/test channel tokens in production.
4. **Configure MongoDB Atlas Network Access**:

   - Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Navigate to Network Access
   - Add IP address: `0.0.0.0/0` (Allow Access from Anywhere)
   - This is required because Vercel Functions use dynamic IP addresses
5. **Update LINE Webhook URL**:

   - Deploy the project and note your Vercel URL (e.g., `https://your-project.vercel.app`)
   - In LINE Developers Console → Messaging API tab
   - Set Webhook URL to: `https://your-project.vercel.app/api/webhook`
   - Click "Verify" to confirm
   - Enable "Use webhook" toggle
   - Disable "Auto-reply messages" (optional, as we handle replies programmatically)
6. **Verify deployment**:

   - Health check: `https://your-project.vercel.app/api/health`
   - Database status: `https://your-project.vercel.app/api/admin/db`
   - Admin dashboard: `https://your-project.vercel.app/admin`
   - Test LINE bot by sending a message

### Environment Variables Reference

#### LINE Messaging API

- `LINE_CHANNEL_ACCESS_TOKEN`: Channel access token from LINE Developers Console
- `LINE_CHANNEL_SECRET`: Channel secret for webhook signature validation

#### LLM Providers

- `OPENAI_API_KEY`: OpenAI API key (required if using OpenAI, recommended as default)
- `OPENAI_MODEL`: OpenAI model to use (default: `gpt-4o-mini`)
- `GOOGLE_API_KEY`: Google Gemini API key (optional, if using Gemini)
- `GOOGLE_MODEL`: Gemini model to use (default: `gemini-1.5-flash`)
- `LLM_PROVIDER`: Default LLM provider (`openai` or `gemini`). Defaults to `openai` if `LLM_PROVIDER` is not set

#### Database

- `MONGODB_URI`: MongoDB Atlas connection string in the format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

#### Application

- `NEXT_PUBLIC_APP_URL`: Public URL of the application (automatically set by Vercel in production)
- `NODE_ENV`: Environment mode (`development` or `production`)

## Project Structure

```
hw6/
├── app/
│   ├── api/
│   │   ├── webhook/          # LINE webhook endpoint
│   │   ├── admin/            # Admin API endpoints
│   │   └── health/           # Health check endpoint
│   ├── admin/                # Admin dashboard UI
│   │   ├── conversations/    # Conversation management
│   │   ├── analytics/        # Analytics dashboard
│   │   └── settings/         # System settings
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db/                   # MongoDB connection utilities
│   ├── i18n/                 # Internationalization
│   ├── line/                 # LINE API helpers
│   ├── llm/                  # LLM provider implementations
│   ├── utils/                # Utility functions
│   └── validators/           # Zod validation schemas
├── models/                   # Mongoose models
├── services/                 # Business logic services
├── scripts/                  # Utility scripts
├── types/                    # TypeScript type definitions
├── output_site/              # Scraped event data
├── .env.local                # Local environment variables (not in repo)
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Run ESLint and auto-fix issues
- `npm run format`: Format code with Prettier
- `npm run format:check`: Check code formatting
- `npm run import-events`: Import event data from `output_site/pages/` to MongoDB

## Features

### LINE Bot Features

- **Welcome Message**: Automatic welcome message with Quick Reply buttons when users add the bot
- **Multi-language Support**: Traditional Chinese and English with language switching
- **Intelligent Event Search**: Search concerts by artist name or keywords
- **Popular Events Carousel**: Interactive Flex Message carousel for popular concerts
- **Purchase Guide & Refund Policy**: Structured responses for common questions
- **Context-aware Conversations**: Maintains conversation context using the last 10 messages
- **Quick Reply Buttons**: 80% of interactions can be completed via buttons
- **Graceful Fallback**: Provides friendly responses when LLM services fail

### Admin Dashboard Features

- **Real-time Conversation Monitoring**: Auto-refreshing conversation list (every 5 seconds)
- **Advanced Search & Filter**: Search by user ID, message content, and filter by status
- **Analytics Dashboard**: Comprehensive statistics including total conversations, messages, active users, and error rates
- **Database Health Check**: Monitor MongoDB connection status
- **System Configuration**: View and manage system settings and environment status

### Technical Features

- **MongoDB Atlas Integration**: Persistent storage using Mongoose ODM
- **Multi-LLM Support**: Supports OpenAI GPT and Google Gemini with automatic fallback
- **Full-text Event Search**: Efficient event search with filtering of discontinued events
- **Webhook Signature Validation**: Secure LINE webhook request validation
- **Error Handling & Logging**: Comprehensive error handling and logging system
- **Markdown Cleanup**: Automatic removal of Markdown formatting from LLM responses
- **Code Quality Tools**: ESLint and Prettier for consistent code style

## Security Considerations

### Environment Variables

- Never commit `.env.local` or `.env` files to version control
- Use different API keys for development and production environments
- Regularly rotate API keys and tokens

### LINE Channel Configuration

- Use separate channels for development and production
- Keep channel secrets secure and never expose them publicly
- Regularly review webhook logs for suspicious activity

### Database Security

- Use strong passwords for MongoDB Atlas accounts
- Restrict database user permissions to minimum required
- Enable MongoDB Atlas automatic backups
- Monitor database access logs

### API Security

- All LINE webhook requests are validated using signature verification
- API endpoints use appropriate HTTP methods and status codes
- Sensitive operations require proper authentication (future enhancement)

## Troubleshooting

### Webhook Verification Fails

- Ensure webhook URL uses HTTPS (required by LINE)
- Verify `LINE_CHANNEL_SECRET` matches your channel configuration
- Check deployment status in Vercel dashboard
- Review Vercel function logs for errors

### MongoDB Connection Issues

- Verify `MONGODB_URI` is correct and properly formatted
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0` (for Vercel)
- Ensure database user has appropriate permissions
- Review MongoDB Atlas connection logs

### LLM API Failures

- Verify API keys are correct and have sufficient quota
- Check `LLM_PROVIDER` setting matches available API keys
- Review function logs for detailed error messages
- Ensure API provider service is operational

### Build Failures

- Review build logs in Vercel dashboard
- Ensure all required environment variables are set
- Check for TypeScript compilation errors
- Verify Node.js version compatibility

## Code Quality

The project uses ESLint and Prettier for code quality and consistency:

```bash
# Check code quality
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Testing

### Health Check Endpoints

- Health: `GET /api/health` - Returns application health status
- Database: `GET /api/admin/db` - Returns database connection status

## License

This project is private and proprietary. All rights reserved.

## Support

For issues or questions:

1. Review the troubleshooting section above
2. Check Vercel deployment logs
3. Review LINE Developers Console webhook logs
4. Check MongoDB Atlas connection logs

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Deployed on [Vercel](https://vercel.com/)
- Database hosted on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- LLM powered by [OpenAI](https://openai.com/) and [Google Gemini](https://deepmind.google/technologies/gemini/)
- Messaging platform: [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)
