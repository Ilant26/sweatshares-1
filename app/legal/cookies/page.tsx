"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Cookie, Settings, Shield, BarChart3, Target, User, Clock, Monitor, Check } from "lucide-react";

export default function CookieSettings() {
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false
  });
  const [isClient, setIsClient] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedPreferences = localStorage.getItem('cookie-preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
      localStorage.setItem('cookie-consent', 'customized');
    }
    setIsSaved(true);
    // Reset the saved state after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  };

  const cookieTypes = [
    {
      key: 'essential',
      title: 'Essential Cookies',
      description: 'Required for basic site functionality. Cannot be disabled.',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      disabled: true
    },
    {
      key: 'analytics',
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      key: 'marketing',
      title: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements and track their performance.',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      key: 'personalization',
      title: 'Personalization Cookies',
      description: 'Remember your preferences and provide a customized experience.',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    }
  ];

  // Don't render until we're on the client side
  if (!isClient) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Cookie Settings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
          <Cookie className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Cookie Settings
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Manage your cookie preferences and control how we use cookies to improve your experience.
        </p>
      </div>

      <div className="grid gap-12">
        {/* Cookie Preferences */}
        <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            Cookie Preferences
          </h2>
          
          <div className="space-y-6">
            {cookieTypes.map((cookieType) => {
              const IconComponent = cookieType.icon;
              return (
                <div key={cookieType.key} className={`flex items-center justify-between p-4 rounded-lg border ${cookieType.bgColor} ${cookieType.borderColor}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${cookieType.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{cookieType.title}</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cookieType.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[cookieType.key as keyof typeof preferences]}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, [cookieType.key]: checked }))
                    }
                    disabled={cookieType.disabled}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-8">
            <Button 
              onClick={handleSave} 
              className={`px-8 ${isSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
              disabled={isSaved}
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Preferences Saved!
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </section>

        {/* About Cookies */}
        <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Cookie className="h-6 w-6 text-primary" />
            About Our Cookies
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Essential Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Analytics Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. All information these cookies collect is aggregated and therefore anonymous.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Marketing Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-600" />
                  Personalization Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cookie Duration */}
        <section className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            Cookie Duration
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Session Cookies</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These cookies are temporary and expire once you close your browser. They are used for basic functionality like maintaining your login session.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Persistent Cookies</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These cookies remain on your device until they expire or you delete them. They remember your preferences across sessions.
              </p>
            </div>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-8 border border-primary/20">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
            <Monitor className="h-6 w-6 text-primary" />
            Managing Cookies
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            In addition to the controls provided here, you can choose to enable or disable Cookies in your internet browser. Most internet browsers also enable you to choose whether you wish to disable all cookies or only third-party cookies.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Chrome</h4>
              <p className="text-gray-600 dark:text-gray-400">Settings → Privacy and security → Cookies</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Firefox</h4>
              <p className="text-gray-600 dark:text-gray-400">Options → Privacy & Security → Cookies</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Safari</h4>
              <p className="text-gray-600 dark:text-gray-400">Preferences → Privacy → Manage Website Data</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}