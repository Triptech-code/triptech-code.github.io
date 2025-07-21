# Employee Break Management System

A comprehensive employee break management system built with Next.js, React, and TypeScript. This application helps organizations manage employee break schedules, track break compliance, and maintain workforce productivity.

## 🚀 Features

### Core Functionality
- **Break Scheduling**: Schedule and manage employee breaks
- **Time Tracking**: Track break durations and compliance
- **Employee Management**: Add, edit, and manage employee information
- **Dashboard Analytics**: View break statistics and trends
- **Data Export**: Export break data for reporting
- **Email Sharing**: Share break schedules via email

### Advanced Features
- **Management Access**: Secure access controls for managers
- **Data Backup/Restore**: Backup and restore system data
- **Privacy Controls**: GDPR-compliant privacy settings
- **Google Analytics**: Track application usage
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Icons**: Lucide React
- **Date Handling**: date-fns, react-day-picker
- **Build Tool**: Next.js with static export
- **Deployment**: GitHub Pages

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- npm 8 or higher

### Local Development

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/Triptech-code/fantastic-breaks-.git
   cd fantastic-breaks-
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

\`\`\`bash
# Build the application
npm run build

# Start production server (optional)
npm start
\`\`\`

## 🌐 Deployment

This application is configured for GitHub Pages deployment:

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Set Source to "GitHub Actions"

2. **Deploy**
   - Push to main branch triggers automatic deployment
   - Site will be available at: `https://Triptech-code.github.io/fantastic-breaks-/`

## 📁 Project Structure

\`\`\`
fantastic-breaks-/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── shared/            # Shared pages
├── components/            # React components
│   ├── ui/               # UI components (Radix UI)
│   ├── employee-break-dashboard.tsx
│   ├── employee-management.tsx
│   └── ...
├── lib/                  # Utility functions
│   ├── data.ts          # Data management
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
├── public/              # Static assets
└── styles/              # Global styles
\`\`\`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

\`\`\`env
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_APP_NAME=Employee Break Protocol
\`\`\`

### Next.js Configuration

The application is configured for static export with GitHub Pages support:

- `basePath`: `/fantastic-breaks-`
- `assetPrefix`: `/fantastic-breaks-/`
- `output`: `export`

## 🧪 Testing

\`\`\`bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
\`\`\`

## 📊 Features Overview

### Employee Dashboard
- View current break status
- Schedule upcoming breaks
- Track break history
- Export personal break data

### Management Interface
- Oversee all employee breaks
- Generate compliance reports
- Manage employee information
- Configure break policies

### Data Management
- Backup system data
- Restore from backups
- Export data in various formats
- Privacy-compliant data handling

## 🔒 Privacy & Security

- GDPR-compliant data handling
- Secure data storage in browser localStorage
- Privacy banner for user consent
- Data export and deletion capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Triptech-code**
- Website: [https://triptech.art](https://triptech.art)
- Email: contact@triptech.art
- GitHub: [@Triptech-code](https://github.com/Triptech-code)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

For support or questions, please open an issue on GitHub or contact the development team.
