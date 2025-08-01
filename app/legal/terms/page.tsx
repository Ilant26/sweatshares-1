"use client";

import { FileText, AlertTriangle, Shield, Users, Lock, Scale, Mail, CheckCircle, XCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Please read these terms carefully. By using our platform, you agree to be bound by these conditions.
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
              <FileText className="h-6 w-6 text-primary" />
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to SweatShares. By accessing or using our platform, you agree to be bound by these Terms of Service. These terms govern your use of our services and establish the legal framework for our relationship.
            </p>
          </section>

          {/* Platform Purpose */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              2. Platform Purpose
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              SweatShares is a platform that facilitates connections and collaboration between users. We provide tools and services for networking, document sharing, and project collaboration. However, we are solely a platform provider and not a party to any agreements between users.
            </p>
          </section>

          {/* Important Legal Disclaimers */}
          <section className="bg-red-50 dark:bg-red-900/20 rounded-lg p-8 border border-red-200 dark:border-red-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              3. Important Legal Disclaimers
            </h2>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-200 dark:border-red-700">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-800 dark:text-red-200">
                  <Scale className="h-5 w-5" />
                  Comprehensive Legal Framework and Platform Limitations
                </h3>
                
                <div className="space-y-4 text-red-700 dark:text-red-300 leading-relaxed">
                  <p>
                    <strong>Platform Nature and Service Scope:</strong> SweatShares operates as a technology platform providing digital tools and services for professional networking, collaboration, and business facilitation. Our services include but are not limited to user profile management, communication tools, document sharing capabilities, payment processing integration, and various collaborative features designed to enhance professional interactions and business operations.
                  </p>
                  
                  <p>
                    <strong>Service Availability and Technical Limitations:</strong> While we strive to maintain high service availability and performance standards, our platform may experience temporary interruptions, maintenance periods, or technical issues beyond our immediate control. Users acknowledge that service availability is subject to various factors including but not limited to internet connectivity, third-party service dependencies, hardware limitations, software updates, and external technical constraints that may affect platform functionality.
                  </p>
                  
                  <p>
                    <strong>Data Processing and Storage Considerations:</strong> All data processing, storage, and transmission activities conducted through our platform are subject to our technical infrastructure capabilities, security protocols, and operational procedures. Users should be aware that data handling practices may be influenced by various technical, legal, and operational factors that could impact data accessibility, retention periods, and processing methodologies.
                  </p>
                  
                  <p>
                    <strong>Third-Party Integration and Dependency Limitations:</strong> Our platform integrates with various third-party services, APIs, and external systems to provide comprehensive functionality. These integrations are subject to the terms, conditions, and operational parameters established by respective third-party providers, which may include but are not limited to payment processors, communication services, storage providers, and various technical infrastructure components.
                  </p>
                  
                  <p>
                    <strong>Legal Compliance and Regulatory Framework:</strong> Users are responsible for ensuring that their use of our platform complies with all applicable local, national, and international laws, regulations, and industry standards. This includes but is not limited to data protection regulations, financial transaction laws, intellectual property rights, employment regulations, and various other legal frameworks that may govern user activities and business operations.
                  </p>
                  
                  <p>
                    <strong>Digital Tools and Electronic Processes:</strong> Various digital tools and electronic processes available through our platform, including but not limited to digital signature functionality, document management systems, communication protocols, and automated processing features, are provided for convenience and operational efficiency. The legal validity, enforceability, and regulatory compliance of these tools may depend on various factors including local laws, context, and the nature of the agreement. Users are responsible for ensuring compliance with applicable laws and regulations regarding electronic processes in their jurisdiction. Additionally, users should be aware that the effectiveness and legal recognition of digital processes may vary significantly across different jurisdictions, regulatory environments, and industry contexts, requiring careful consideration of local legal frameworks and professional standards.
                  </p>
                  
                  <p>
                    <strong>Technology Infrastructure and System Architecture:</strong> Our platform operates on complex technological infrastructure involving multiple systems, databases, networks, and software components. Users should understand that the reliability, performance, and functionality of our services are dependent on various technical factors including but not limited to server capacity, network bandwidth, software compatibility, hardware limitations, and external service dependencies. We implement industry-standard practices for system maintenance, security, and performance optimization, but cannot guarantee uninterrupted service or optimal performance under all circumstances.
                  </p>
                  
                  <p>
                    <strong>Data Transmission and Communication Protocols:</strong> All data transmission, communication, and information exchange conducted through our platform utilize various protocols, encryption methods, and security measures designed to protect user information and ensure secure operations. However, users should be aware that data transmission involves inherent risks including but not limited to network vulnerabilities, interception possibilities, transmission delays, and various other technical factors that may impact data security and communication reliability.
                  </p>
                  
                  <p>
                    <strong>Software Updates and System Evolution:</strong> Our platform undergoes regular updates, modifications, and improvements to enhance functionality, security, and user experience. These updates may include but are not limited to feature additions, security enhancements, performance optimizations, and compatibility improvements. Users acknowledge that such updates may temporarily affect service availability, alter user interface elements, modify functionality, or require user adaptation to new features and operational procedures.
                  </p>
                  
                  <p>
                    <strong>Cross-Platform Compatibility and Integration:</strong> Our platform is designed to operate across various devices, operating systems, and web browsers, but compatibility and optimal performance may vary depending on user hardware, software configurations, and technical specifications. Users should ensure their systems meet minimum requirements and are updated to compatible versions to ensure optimal platform functionality and user experience.
                  </p>
                  
                  <p>
                    <strong>Professional Standards and Industry Requirements:</strong> Users operating in regulated industries or professional sectors may be subject to additional requirements, standards, and compliance obligations beyond those addressed in these terms. It is the user's responsibility to understand and adhere to all applicable professional standards, industry regulations, and sector-specific requirements that may impact their use of our platform.
                  </p>
                  
                  <p>
                    <strong>Risk Assessment and Mitigation:</strong> Users should conduct appropriate risk assessments and implement suitable mitigation strategies when utilizing our platform for business operations, financial transactions, or professional activities. This includes but is not limited to evaluating technical risks, legal compliance requirements, operational considerations, and various other factors that may impact the success and legality of user activities.
                  </p>
                  
                  <p>
                    <strong>Dispute Resolution and Legal Proceedings:</strong> In the event of disputes, legal proceedings, or regulatory investigations involving platform usage, users acknowledge that various legal, technical, and procedural factors may influence the resolution process. This includes but is not limited to jurisdictional considerations, evidence preservation requirements, technical documentation standards, and various other legal and procedural elements that may impact dispute resolution outcomes.
                  </p>
                  
                  <p>
                    <strong>Future Regulatory Changes and Compliance Evolution:</strong> The regulatory landscape governing digital platforms, electronic transactions, and online business operations continues to evolve. Users should be aware that future changes in laws, regulations, or industry standards may impact platform functionality, service availability, or compliance requirements. We reserve the right to modify our services, terms, or operational procedures in response to regulatory changes or compliance requirements.
                  </p>
                  
                  <p>
                    <strong>Comprehensive Liability Framework:</strong> This disclaimer section, along with all other terms and conditions outlined in this agreement, establishes a comprehensive framework for understanding the limitations, responsibilities, and legal considerations associated with platform usage. Users should carefully review and understand all terms, conditions, and disclaimers before engaging in any activities that may have legal, financial, or operational implications.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Limitations */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              4. Platform Limitations and User Responsibilities
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Content Responsibility
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  SweatShares is a platform that facilitates connections and provides collaboration tools. We explicitly disclaim responsibility for:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    User-generated content and its accuracy
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Harmful content (viruses, malware, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Inappropriate content (nudity, violence, hate speech, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Financial transactions between users
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Scams or fraudulent activities
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Financial Transactions
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  While we provide secure payment processing tools, we are not responsible for:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Disputes between users regarding payments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Financial losses due to fraudulent activities
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Quality of services or deliverables
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Contract breaches between users
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Conduct */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              5. User Conduct
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Users must:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Provide accurate information",
                "Respect intellectual property rights",
                "Not engage in fraudulent activities",
                "Not share harmful or inappropriate content",
                "Not manipulate platform features",
                "Maintain professional conduct"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Account Security */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              6. Account Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You are responsible for:
            </p>
            <div className="space-y-3">
              {[
                "Maintaining account security and password strength",
                "Keeping credentials confidential and not sharing access",
                "All activities occurring under your account",
                "Reporting suspicious activities immediately",
                "Logging out from shared devices"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Termination */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              7. Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to suspend or terminate accounts that violate these terms or engage in harmful activities. This includes but is not limited to fraudulent behavior, harassment, or violation of applicable laws.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              8. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms. We will notify users of significant changes through the platform or email.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-8 border border-primary/20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              9. Contact
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about these terms, please contact our legal team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Legal Team</h4>
                <p className="text-gray-600 dark:text-gray-400">legal@sweatshares.com</p>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response Time</h4>
                <p className="text-gray-600 dark:text-gray-400">Within 72 hours</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}