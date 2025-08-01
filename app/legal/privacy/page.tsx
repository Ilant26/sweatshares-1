"use client";

import { Shield, Eye, Lock, Users, Database, Bell, FileText, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your privacy is our priority. This policy explains how we collect, use, and protect your information.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <div className="grid gap-12">
          {/* Introduction */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary" />
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              SweatShares ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. We believe in transparency and want you to understand how your data is handled.
            </p>
          </section>

          {/* Information Collection */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              2. Information We Collect
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Information You Provide
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Account information (email, password)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Profile information (professional role, skills, location)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Content you create (listings, messages, documents)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Payment information (processed securely through Stripe)
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-500" />
                  Automatically Collected
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    Device information and browser data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    Usage patterns and analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    Cookies and similar technologies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    IP address and location data
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              3. How We Use Your Information
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Provide and improve our services",
                "Process transactions securely",
                "Match users with relevant opportunities",
                "Send notifications and updates",
                "Prevent fraud and abuse",
                "Comply with legal obligations"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Information Sharing */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              4. Information Sharing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We are committed to protecting your privacy and only share your information in specific circumstances:
            </p>
            <div className="space-y-3">
              {[
                "Other users (as per your profile settings and privacy controls)",
                "Service providers (payment processing, hosting, analytics)",
                "Legal authorities (when required by law or to protect rights)",
                "Business partners (with your explicit consent)"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              5. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Technical Measures</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• End-to-end encryption for sensitive data</li>
                  <li>• Secure HTTPS connections</li>
                  <li>• Regular security audits</li>
                  <li>• Multi-factor authentication</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Organizational Measures</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Limited access to personal data</li>
                  <li>• Employee security training</li>
                  <li>• Incident response procedures</li>
                  <li>• Regular policy reviews</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              6. Your Rights
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              You have comprehensive rights regarding your personal data:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Access", desc: "Request a copy of your personal data" },
                { title: "Correction", desc: "Update inaccurate information" },
                { title: "Deletion", desc: "Request removal of your data" },
                { title: "Portability", desc: "Export your data in standard format" },
                { title: "Objection", desc: "Object to certain processing activities" },
                { title: "Restriction", desc: "Limit how we process your data" }
              ].map((right, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{right.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{right.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-8 border border-primary/20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              7. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We're here to help with any privacy-related questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Privacy Team</h4>
                <p className="text-gray-600 dark:text-gray-400">privacy@sweatshares.com</p>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response Time</h4>
                <p className="text-gray-600 dark:text-gray-400">Within 48 hours</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}