# ImCode - AI-Powered Code Editor

![ImCode Logo](public/logo.svg)

ImCode is a cutting-edge, AI-powered code editor designed to streamline your development workflow. Built with modern web technologies, it combines the power of AI assistance with a sleek, user-friendly interface.

## 🚀 Features

- **AI Code Generation**: Generate code using natural language prompts
- **Smart Code Editor**: Syntax highlighting, auto-completion, and intelligent suggestions
- **Project Management**: Organize and manage multiple projects with ease
- **Real-time Collaboration**: Work together with team members in real-time
- **Version Control**: Built-in Git integration for seamless version control
- **Customizable Interface**: Tailor the editor to your preferences
- **Dark/Light Mode**: Choose your preferred theme
- **API Key Management**: Securely manage your API keys

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: React Context, React Query
- **Backend**: Supabase
- **AI Integration**: OpenAI API
- **Deployment**: Vercel/Netlify

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Teckdegen/imcode.git
   cd imcode
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_SUPABASE_URL | Your Supabase project URL | Yes |
| VITE_SUPABASE_ANON_KEY | Your Supabase anon/public key | Yes |
| VITE_OPENAI_API_KEY | Your OpenAI API key | No (Required for AI features) |

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/      # React context providers
├── hooks/         # Custom React hooks
├── pages/         # Application pages
├── providers/     # Service providers
├── styles/        # Global styles
└── utils/         # Utility functions
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) for the amazing build tool
- [React](https://reactjs.org/) for the UI library
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Supabase](https://supabase.com/) for backend services
- [OpenAI](https://openai.com/) for AI capabilities

---

Made with ❤️ by [Teckdegen](https://github.com/Teckdegen)

[![GitHub stars](https://img.shields.io/github/stars/Teckdegen/imcode?style=social)](https://github.com/Teckdegen/imcode/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Teckdegen/imcode)](https://github.com/Teckdegen/imcode/issues)
[![GitHub license](https://img.shields.io/github/license/Teckdegen/imcode)](https://github.com/Teckdegen/imcode/blob/main/LICENSE)
