import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, FileText, BarChart3, Zap, Shield, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">HumanWriter AI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 md:py-32">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            <span>Advanced AI-Powered Text Humanization</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Transform AI Text into
            <span className="text-primary"> Authentic Writing</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            HumanWriter AI uses advanced natural language processing to make AI-generated content
            indistinguishable from human writing across all academic disciplines.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Writing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 mt-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">98%</div>
              <p className="text-sm text-muted-foreground">Humanization Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">15+</div>
              <p className="text-sm text-muted-foreground">Academic Disciplines</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">1M+</div>
              <p className="text-sm text-muted-foreground">Words Generated</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 md:py-32 bg-muted/50">
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Powerful Features
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Everything you need to create authentic, human-like academic writing
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Advanced AI Models</CardTitle>
              <CardDescription>
                Powered by state-of-the-art language models fine-tuned on academic writing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multi-Discipline Support</CardTitle>
              <CardDescription>
                Specialized models for biology, chemistry, physics, and 12+ other fields
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Detailed Metrics</CardTitle>
              <CardDescription>
                Track humanization score, burstiness, perplexity, and readability
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Fast Generation</CardTitle>
              <CardDescription>
                Generate thousands of words in seconds with our optimized pipeline
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is encrypted and never shared. Full GDPR compliance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Quality Assurance</CardTitle>
              <CardDescription>
                Built-in checks ensure grammatical accuracy and coherence
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-24 md:py-32">
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Transform your AI-generated text in three simple steps
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-4">
              1
            </div>
            <h3 className="text-xl font-bold mb-2">Input Your Text</h3>
            <p className="text-muted-foreground">
              Paste your AI-generated content or upload a document
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-4">
              2
            </div>
            <h3 className="text-xl font-bold mb-2">AI Processing</h3>
            <p className="text-muted-foreground">
              Our models analyze and humanize your text with discipline-specific patterns
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-4">
              3
            </div>
            <h3 className="text-xl font-bold mb-2">Get Results</h3>
            <p className="text-muted-foreground">
              Receive your humanized text with detailed quality metrics
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="container py-24 md:py-32 bg-muted/50">
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple Pricing
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Start free and scale as you grow
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for trying out</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>5,000 words/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Basic metrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>3 disciplines</span>
                </li>
              </ul>
              <Link href="/register" className="mt-6 block">
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <div className="inline-block px-3 py-1 text-xs bg-primary text-primary-foreground rounded-full mb-2">
                Most Popular
              </div>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For serious writers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>100,000 words/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Advanced metrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>All disciplines</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href="/register" className="mt-6 block">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For teams & organizations</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Custom</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Unlimited words</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Custom models</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Dedicated support</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container py-24 md:py-32">
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Trusted by Researchers
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="mb-4 italic">
                "HumanWriter AI has completely transformed my research workflow. The quality is outstanding."
              </p>
              <p className="font-semibold">Dr. Sarah Chen</p>
              <p className="text-sm text-muted-foreground">Biology Researcher</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="mb-4 italic">
                "The discipline-specific models are incredibly accurate. It understands technical terminology perfectly."
              </p>
              <p className="font-semibold">Prof. Michael Rodriguez</p>
              <p className="text-sm text-muted-foreground">Computer Science</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="mb-4 italic">
                "Saves me hours every week. The metrics help me understand and improve my writing quality."
              </p>
              <p className="font-semibold">Emma Thompson</p>
              <p className="text-sm text-muted-foreground">PhD Candidate</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 md:py-32 bg-muted/50">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Join thousands of researchers and writers using HumanWriter AI
          </p>
          <Link href="/register">
            <Button size="lg">
              Start Writing Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-primary" />
                <span className="font-bold">HumanWriter AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced AI-powered text humanization for academic writing
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="/docs">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/cookies">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} HumanWriter AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
