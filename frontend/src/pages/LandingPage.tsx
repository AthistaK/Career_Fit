import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  FileText,
  Target,
  Cpu,
  Sparkles,
  TrendingUp,
  MapPin,
  Layers,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { HeroScene3D } from '../components/3d/HeroScene3D';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0A19] text-[#F8FAFC] selection:bg-[#8B5CF6] selection:text-white overflow-x-hidden">
      {/* Top Navigation */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#100E21]/80 backdrop-blur-md border-b border-[#2A2548]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-[0_0_16px_rgba(139,92,246,0.5)] flex-shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-[#F8FAFC] tracking-tight">CareerFit</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-[#A5A1BA]">Know Your Fit • Build Your Career</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Student Career-Tech SaaS
            </Badge>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.15]">
              Know Your Fit.{' '}
              <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-accent-cyan bg-clip-text text-transparent">
                Build Your Career.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-[#A5A1BA] font-normal leading-relaxed">
              Analyze your resume, discover your skill gaps, match with real job descriptions, and find the roles that fit you.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 pt-2">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto">
                  Analyze My Resume
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Explore CareerFit
                </Button>
              </a>
            </div>

            {/* Micro Highlights */}
            <div className="pt-5 sm:pt-6 grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#2A2548] text-center sm:text-left">
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-[#F8FAFC]">100%</p>
                <p className="text-[10px] sm:text-xs font-semibold text-[#A5A1BA]">Explainable Scoring</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-[#F8FAFC]">1,200+</p>
                <p className="text-[10px] sm:text-xs font-semibold text-[#A5A1BA]">Skill Taxonomy</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-[#F8FAFC]">5-Stage</p>
                <p className="text-[10px] sm:text-xs font-semibold text-[#A5A1BA]">Career Roadmap</p>
              </div>
            </div>
          </div>

          {/* Right Hero 3D Element */}
          <div className="lg:col-span-6 w-full overflow-hidden">
            <HeroScene3D />
          </div>
        </div>
      </section>

      {/* 3-Step Visual Workflow */}
      <section id="how-it-works" className="py-12 sm:py-20 bg-[#100E21] border-y border-[#2A2548]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">Simple 3-Step Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">How CareerFit Guides Your Journey</h2>
            <p className="text-xs sm:text-sm text-[#A5A1BA]">From raw document to placement-ready career milestones in seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <Card hoverEffect className="p-6 sm:p-8 relative space-y-4 bg-[#19162C] border-[#2A2548]">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2A2548] block">01</span>
              <div className="p-3 bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 w-fit rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">Upload Your Resume</h3>
              <p className="text-xs text-[#A5A1BA] leading-relaxed">
                Drop your PDF or DOCX file. Our engine extracts skills, projects, and coursework with explainable factor scoring.
              </p>
            </Card>

            {/* Step 2 */}
            <Card hoverEffect className="p-6 sm:p-8 relative space-y-4 bg-[#19162C] border-[#2A2548]">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2A2548] block">02</span>
              <div className="p-3 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 w-fit rounded-2xl">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">Match With Target Jobs</h3>
              <p className="text-xs text-[#A5A1BA] leading-relaxed">
                Paste any job description. Instantly identify matched skills, partial competencies, and missing requirements.
              </p>
            </Card>

            {/* Step 3 */}
            <Card hoverEffect className="p-6 sm:p-8 relative space-y-4 bg-[#19162C] border-[#2A2548]">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2A2548] block">03</span>
              <div className="p-3 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 w-fit rounded-2xl">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">Build Your Career Path</h3>
              <p className="text-xs text-[#A5A1BA] leading-relaxed">
                Follow an interactive 5-milestone roadmap customized to your missing skills and bridge gaps for placement readiness.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
          <Badge variant="cyan">Engineered For Students</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">Everything You Need To Stand Out</h2>
          <p className="text-xs sm:text-sm text-[#A5A1BA]">More visuals, actionable insights, and transparent scoring.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-5 sm:p-6 space-y-3 bg-[#19162C] border-[#2A2548]">
            <div className="p-2.5 sm:p-3 bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 w-fit rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC]">Explainable Multi-Factor Scoring</h4>
            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              Transparent 5-component scoring: Skills (40%), Experience (20%), Projects (20%), Education (10%), and Formatting (10%).
            </p>
          </Card>

          <Card className="p-5 sm:p-6 space-y-3 bg-[#19162C] border-[#2A2548]">
            <div className="p-2.5 sm:p-3 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 w-fit rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC]">Instant Skill-Gap Detection</h4>
            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              Color-coded Matched (Green), Partial (Amber), and Missing (Red) skill breakdowns for any target job description.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 space-y-3 bg-[#19162C] border-[#2A2548]">
            <div className="p-2.5 sm:p-3 bg-purple-500/15 text-purple-300 border border-purple-500/30 w-fit rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC]">Resume Optimizer & Action Verbs</h4>
            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              Transform passive descriptions into high-impact action-oriented bullet points tailored to your target roles.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 space-y-3 bg-[#19162C] border-[#2A2548]">
            <div className="p-2.5 sm:p-3 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 w-fit rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC]">Longitudinal CareerFit Tracking</h4>
            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              Track how your CareerFit Score and Job Match ratings improve over time with score delta indicators and progression charts.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 space-y-3 bg-[#19162C] border-[#2A2548]">
            <div className="p-2.5 sm:p-3 bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 w-fit rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC]">Target Career Recommendations</h4>
            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              Discover which engineering roles fit your profile best, with real industry compensation ranges and growth demands.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 space-y-3 bg-[#19162C] border-[#2A2548]">
            <div className="p-2.5 sm:p-3 bg-[#211D38] text-[#F8FAFC] border border-[#2A2548] w-fit rounded-xl">
              <Layers className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC]">Selective 3D & Mobile First</h4>
            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              Interactive 3D visuals with graceful 2D fallbacks, optimized for low-resource laptops and mobile browsers.
            </p>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-[#19162C] via-[#211D38] to-[#100E21] border-y border-[#2A2548] text-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            Ready to Discover Your Career Fit?
          </h2>
          <p className="text-xs sm:text-base text-[#A5A1BA] max-w-xl mx-auto">
            Join students from engineering colleges analyzing their resumes and preparing for top tech placements.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button size="lg" variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 bg-[#100E21] border-t border-[#2A2548] text-center text-xs text-[#A5A1BA] px-4">
        <p>© 2026 CareerFit Platform • Designed for Student Career Growth.</p>
      </footer>
    </div>
  );
};
