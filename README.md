# SweatShares 🤝

**The Ultimate Platform for Entrepreneurs, Investors, and Experts**

SweatShares is a comprehensive networking and collaboration platform that connects founders, investors, and industry experts. Built with modern web technologies, it provides a seamless experience for discovering opportunities, managing projects, and building meaningful professional relationships.

## 🌟 Features

### 🔍 **Discovery & Networking**
- **Find Partners**: Advanced filtering system to discover profiles and opportunities
- **Smart Matching**: AI-powered recommendations based on skills, location, and interests
- **Real-time Messaging**: Secure communication system with file sharing and signature requests
- **Profile Management**: Comprehensive profiles with skills, experience, and portfolio showcase

### 💼 **Opportunity Management**
- **Create Opportunities**: Post funding requests, job openings, partnerships, and more
- **Dynamic Listings**: Smart categorization for founders, investors, and experts
- **Favorites System**: Save and organize interesting profiles and opportunities
- **Advanced Search**: Multi-criteria filtering with skills, location, industry, and more

### 💰 **Secure Transactions**
- **Escrow System**: Secure payment processing with Stripe Connect integration
- **Invoice Management**: Create standard and escrow-backed invoices
- **Payment Tracking**: Real-time status updates and notifications
- **Dispute Resolution**: Built-in system for handling payment disputes

### 📄 **Document & Signature Management**
- **Digital Vault**: Secure document storage and sharing
- **E-Signatures**: PDF signature requests and management
- **File Sharing**: Seamless document sharing in messages
- **Version Control**: Track document changes and updates

### 🔔 **Smart Notifications**
- **Real-time Alerts**: Instant notifications for messages, opportunities, and updates
- **Email Integration**: Automated email notifications for important events
- **Custom Alerts**: Set up personalized alerts for specific criteria
- **Deadline Tracking**: Automatic reminders for important dates

### 📱 **Modern UI/UX**
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Theme switching with system preference detection
- **Smooth Animations**: Framer Motion powered transitions and interactions
- **Accessibility**: WCAG compliant design with keyboard navigation support

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation and transitions
- **Lucide React** - Modern icon library
- **Radix UI** - Accessible component primitives

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security** - Fine-grained access control
- **Real-time Subscriptions** - Live data updates

### **Integrations**
- **Stripe Connect** - Payment processing and escrow
- **Email Services** - Automated notifications
- **File Storage** - Secure document management
- **PDF Processing** - Document handling and signatures

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MrSocialBoost/sweatshares.git
cd sweatshares
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email Configuration
EMAIL_FROM=your_email@domain.com
EMAIL_API_KEY=your_email_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Database Setup**
Run the Supabase migrations:
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

5. **Start the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
sweatshares/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main application pages
│   └── globals.css               # Global styles
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   ├── blocks/                   # Page sections
│   └── providers/                # Context providers
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions
├── supabase/                     # Database migrations
├── public/                       # Static assets
└── documentation/                # Project documentation
```

## 🔧 Key Components

### **Authentication System**
- Secure user registration and login
- Email verification and password reset
- Protected routes and middleware
- Session management with Supabase Auth

### **Real-time Features**
- Live messaging system
- Instant notifications
- Real-time status updates
- Collaborative features

### **Payment Processing**
- Stripe Connect integration
- Escrow payment system
- Invoice generation
- Automated payment tracking

### **File Management**
- Secure file uploads
- Document sharing
- PDF signature workflow
- Version control

## 🚀 Deployment

### **Vercel (Recommended)**
The easiest way to deploy SweatShares is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy with automatic CI/CD

### **Other Platforms**
SweatShares can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📖 Documentation

Detailed documentation is available in the `/documentation` folder:
- [Alert System](./documentation/alert-system.md)
- [Escrow & Payment System](./documentation/stripe-connect-escrow-system.md)
- [Signature System](./documentation/signature-system.md)
- [Support System](./documentation/support-system.md)
- [Security Guidelines](./documentation/security-issues.md)

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and code of conduct before submitting pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Adnan Benchaiba**
- GitHub: [@MrSocialBoost](https://github.com/MrSocialBoost)
- Email: [adnan.benchaiba@gmail.com](mailto:adnan.benchaiba@gmail.com)
- Agency: [Celco Agency](https://celco.agency)

## 🏢 About Celco Agency

[Celco Agency](https://celco.agency) specializes in building modern, scalable web applications and digital solutions. We help businesses transform their ideas into powerful digital products using cutting-edge technologies.

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
