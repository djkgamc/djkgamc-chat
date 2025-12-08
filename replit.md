# OpenAI Responses Starter App

## Overview
This is a Next.js application that demonstrates the OpenAI Responses API. It provides a conversational AI interface with support for various tools including web search, file search, code interpreter, custom functions, and Google integrations.

**Current State:** Fully configured and running in Replit environment on port 5000.

## Recent Changes (December 7, 2025)
- Configured for Replit environment
- Updated Next.js dev server to run on 0.0.0.0:5000
- Added `allowedDevOrigins` configuration to support Replit's proxy/iframe setup
- Configured deployment settings for production
- All dependencies installed and working
- **UI Overhaul:** Removed sidebar, added inline web search toggle next to message input
- **Dynamic Streaming:** Added real-time status indicators showing thinking, searching, generating phases
- **Animated Tool Calls:** Enhanced tool call UI with animated status states
- **Model Strategy:** First response uses gpt-5-pro-2025-10-06, then switches to chatgpt-5.1 with medium reasoning for follow-up turns (store: false)
- **Browser Notifications:** Automatically requests notification permission on page load and alerts when responses complete (ideal for Chat Pro's longer response times)
- **Deep Research Feature:** Added deep research toggle (flask icon, purple when active) that:
  - Calls OpenAI's o4-mini-deep-research model for comprehensive research
  - Pipes the research report to GPT-5 Pro for intelligent synthesis
  - Shows "Deep researching" and "Synthesizing insights" streaming phases
  - Only triggers on fresh user messages (not tool-call follow-ups)
- **Clarifying Questions:** Before running deep research, the app analyzes the query to see if clarifying questions would improve results
  - If needed, shows an amber-themed UI with clickable options
  - Automatically skips clarification for well-defined queries
  - Users can skip manually or add custom details
- **Mutually Exclusive Toggles:** Web search and deep research are now mutually exclusive - enabling one disables the other
- **Enhanced Markdown Rendering:** Custom Markdown component with:
  - Proper typography (bold, italics, headers with correct weights)
  - Ample paragraph spacing for readability
  - Blue underlined links that all open in new windows (target="_blank")
  - Styled code blocks, blockquotes, tables, and lists
  - Uses remark-gfm for GitHub-flavored markdown support
- **Mobile Responsive:** Chat layout adapts to mobile screens with:
  - Flexible height instead of fixed viewport
  - Responsive padding for narrow screens
  - Sticky message input at the bottom
  - Gradient fade effect above input area

## Project Architecture

### Tech Stack
- **Framework:** Next.js 15.2.3 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, custom components
- **API:** OpenAI Responses API
- **State Management:** Zustand

### Key Features
1. **Multi-turn Conversation Handling** - Maintains chat history and context
2. **Streaming Responses** - Real-time streaming of AI responses
3. **Built-in Tools:**
   - Web Search - Search the internet for information
   - File Search - Search uploaded documents in vector stores
   - Code Interpreter - Execute Python code
4. **Custom Functions** - Example functions (get_weather, get_joke)
5. **Google Integration** - Calendar and Gmail access via OAuth
6. **MCP Server Support** - Model Context Protocol server configuration

### Directory Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── container_files/  # File handling
│   │   ├── functions/     # Custom functions (weather, jokes)
│   │   ├── google/        # Google OAuth integration
│   │   ├── turn_response/ # Main chat response endpoint
│   │   └── vector_stores/ # Vector store management
│   ├── fonts/             # Font files
│   └── page.tsx           # Main chat interface
├── components/            # React components
│   ├── ui/               # Reusable UI components (buttons, inputs, etc.)
│   ├── assistant.tsx     # Main assistant component
│   ├── chat.tsx          # Chat interface
│   ├── message.tsx       # Message rendering
│   └── tools-panel.tsx   # Tool configuration panel
├── config/               # Configuration files
│   ├── constants.ts      # App constants
│   ├── functions.ts      # Custom function definitions
│   └── tools-list.ts     # Tool configurations
├── lib/                  # Utility libraries
│   ├── tools/           # Tool handling logic
│   ├── assistant.ts     # Assistant utilities
│   ├── connectors-auth.ts # OAuth handling
│   └── session.ts       # Session management
├── stores/              # Zustand state stores
│   ├── useConversationStore.ts
│   └── useToolsStore.ts
└── public/              # Static assets
```

## Environment Variables

### Required
- `OPENAI_API_KEY` - Your OpenAI API key (required for the app to function)

### Optional (for Google Integration)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `OAUTH_REDIRECT_URI` - OAuth callback URL (default: http://localhost:3000/api/google/callback)

**Note:** For Replit deployment, update the `OAUTH_REDIRECT_URI` to use your Replit domain.

## Running the Application

### Development
The app runs automatically via the configured workflow on port 5000.
- Access via the Replit webview

### Local Development (outside Replit)
```bash
npm install
npm run dev
```
The app will be available at http://localhost:3000

## Deployment
Configured for Replit Autoscale deployment:
- **Build command:** `npm run build`
- **Run command:** `npm start`
- **Port:** 5000

## Adding Custom Functions
To add your own custom functions:

1. Define the function in `config/functions.ts`
2. Implement the API route in `app/api/functions/[function_name]/route.ts`
3. The function will automatically appear in the Functions panel

## Google Integration Setup
To enable Google Calendar and Gmail integration:

1. Create OAuth 2.0 credentials in Google Cloud Console
2. Enable Google Calendar API and Gmail API
3. Set required environment variables
4. Update redirect URI to match your deployment URL
5. Configure data access scopes in Google Auth Platform

## Usage Examples

### Try Web Search + Code Interpreter
"Can you fetch the temperatures in SF for August and then generate a chart plotting them?"

### Try File Search
1. Upload PDF files via the File Search panel
2. Create a vector store
3. Ask: "What's new with the Responses API?"

### Try Google Integration
1. Click "Connect Google Integration"
2. Complete OAuth flow
3. Ask: "Show my next five calendar events"

## Technical Notes

### Replit-Specific Configuration
- Server binds to `0.0.0.0:5000` instead of default `localhost:3000`
- `allowedDevOrigins` configured to accept Replit's proxy domain
- Production deployment uses Next.js optimized build

### Security
- API keys stored as environment variables
- Google OAuth tokens stored per session
- Session-based authentication for connector access

## License
MIT License - See LICENSE file for details
