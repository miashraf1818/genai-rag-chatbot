'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Zap, Shield, MessageSquare, FileText, BarChart3, ArrowRight, Github, Linkedin, Mail, Code2, Database, Server, Terminal, Moon, Sun } from 'lucide-react';
import { useTheme } from './providers';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background selection:bg-purple-500/30 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg md:text-xl font-bold text-foreground truncate max-w-[150px] md:max-w-none">Gen AI RAG Bot</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-6"
          >
            <Link
              href="#about"
              className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="#tech"
              className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Tech Stack
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-secondary text-primary border border-border hover:bg-secondary/80 transition-all duration-200 shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link
              href="/auth/login"
              className="hidden sm:block text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Try Now
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen AI Architecture</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight tracking-tight text-foreground">
              Gen AI RAG Bot
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Engineered for Performance
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              A sophisticated AI assistant capable of reasoning across complex documents.
              Designed and built by <span className="font-semibold text-foreground">Mohammed Ikram Ashrafi</span> using cutting-edge LLM technologies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center"
              >
                Launch Application
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="https://github.com/miashraf1818/-genai-rag-chatbot"
                target="_blank"
                className="px-8 py-4 text-lg font-semibold text-foreground bg-background border border-border rounded-full hover:bg-secondary transition-all duration-300 flex items-center"
              >
                <Github className="mr-2 w-5 h-5" />
                View Code
              </Link>
            </div>
          </motion.div>


        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built with Modern Technologies
            </h2>
            <p className="text-lg text-muted-foreground">
              Leveraging the latest in AI and full-stack development
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary transition-colors group"
              >
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <tech.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{tech.name}</h3>
                <p className="text-sm text-muted-foreground">{tech.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Developer Section */}
      <section id="about" className="py-24 px-6 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-foreground mb-6">
                About the Developer
              </h2>
              <h3 className="text-2xl font-semibold text-primary mb-6">
                Mohammed Ikram Ashrafi
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                I am a passionate Full Stack Developer and AI Engineer specializing in building scalable, intelligent applications.
                This project demonstrates my ability to integrate complex AI models with robust web architectures to solve real-world problems.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                My expertise spans across the entire stack, from crafting responsive frontends with React & Next.js to optimizing backend performance with Python & FastAPI, and deploying state-of-the-art LLM solutions.
              </p>

              <div className="flex flex-wrap gap-4">
                <a href="https://mohammed-ikram-ashrafi.vercel.app/" target="_blank" className="flex items-center px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Portfolio
                </a>
                <a href="https://www.linkedin.com/in/mohammed-ikram-ashrafi/" target="_blank" className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  <Linkedin className="w-5 h-5 mr-2" />
                  LinkedIn
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl transform rotate-3 opacity-20 blur-lg"></div>
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-xl">
                <h4 className="text-xl font-bold text-foreground mb-6">Core Competencies</h4>
                <div className="space-y-4">
                  {skills.map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-muted-foreground">{skill.name}</span>
                        <span className="text-primary">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                          style={{ width: `${skill.level}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center text-background font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-foreground">Gen AI RAG Bot</span>
          </div>

          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>© 2025 All rights reserved.</p>
            <p>Designed & Developed with ❤️ by Mohammed Ikram Ashrafi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const technologies = [
  { name: "Next.js 14", role: "Frontend Framework", icon: Code2 },
  { name: "FastAPI", role: "High-Performance Backend", icon: Server },
  { name: "Llama 3.3", role: "Large Language Model", icon: Sparkles },
  { name: "Pinecone", role: "Vector Database", icon: Database },
  { name: "Tailwind CSS", role: "Modern Styling", icon: Zap },
  { name: "LangChain", role: "LLM Orchestration", icon: Terminal },
  { name: "Framer Motion", role: "Advanced Animations", icon: Sparkles },
  { name: "OAuth 2.0", role: "Secure Authentication", icon: Shield },
];

const skills = [
  { name: "Full Stack Development", level: 95 },
  { name: "AI & Machine Learning", level: 90 },
  { name: "System Architecture", level: 85 },
  { name: "Cloud Infrastructure", level: 80 },
];
