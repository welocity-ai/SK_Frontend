import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Linkedin, Github, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group inline-flex">
              <Image src="/sklogo.png" alt="SkillKendra Logo" width={48} height={48} className="h-12 w-auto" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                SKILL<span className="text-orange-600">KENDRA</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Advanced AI-powered certificate authentication. Verify academic and professional credentials with complete confidence.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-orange-500 transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-orange-500 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-orange-500 transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links: Product */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-slate-900 mb-4 tracking-wide text-sm uppercase">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#verify" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Links: Company */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-slate-900 mb-4 tracking-wide text-sm uppercase">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Links: Contact & Legal */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-slate-900 mb-4 tracking-wide text-sm uppercase">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@skillkendra.com" className="text-slate-500 hover:text-orange-600 text-sm transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-orange-600 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {currentYear} SkillKendra. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
