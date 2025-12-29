import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
            <p className="text-primary-gray-lighter">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="bg-primary-gray rounded-xl p-8 border border-primary-gray-light space-y-8 text-primary-gray-lighter">
            <section>
              <p className="mb-4">
                This Cookie Policy describes how El Toro Negro ("we", "us", or "our") uses "cookies" and other similar technologies, in connection with our website and services.
              </p>
              <p className="mb-4">
                We use cookies to improve your experience and for marketing. Please review your cookie settings in order to manage your privacy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">What are cookies?</h2>
              <p className="mb-4">
                Cookies are small text files that are placed into your device when you visit a website, downloaded to your computer or mobile device when you visit a site and allow a site to recognize your device. Cookies store information about your visit, which may include content viewed, language preference, time and duration of each visit and advertisement accessed.
              </p>
              <p className="mb-4">
                Cookies managed by El Toro Negro only are called "first party cookies" whereas cookies from third parties are called "third party cookies".
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">Why do we use cookies and similar technologies?</h2>
              <p className="mb-4">
                Cookies are a useful mechanism that do a lot of different jobs, such as ensuring the website is secure and reliable, enhancing user experience and improving website and services.
              </p>
              <p className="mb-4">We use cookies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ensure that our website and services function properly,</li>
                <li>detect and prevent fraud,</li>
                <li>understand how visitors use and engage with our websites and services,</li>
                <li>analyze and improve our services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">Does El Toro Negro use cookies for marketing, analytics and personalisation?</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">Marketing</h3>
                <p className="mb-4">
                  We and our service providers will use cookies and similar technologies on our websites and services to direct advertisement more relevant to you. You can adapt your choices in the "Cookie Preference" section anytime if you prefer not to receive interest based ads. If you opt out of interest-based ads on this site, please be aware that you will still see the same number of ads as before, but they may not be as relevant to you.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">Analytics</h3>
                <p className="mb-4">
                  Analytics cookies help us understand how visitors interact with our services. We use these cookies in several ways, including:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>To remember your preferences for using El Toro Negro services and to prevent you from needing to reconfigure your settings each time you log in;</li>
                  <li>To understand how people reach the El Toro Negro site and to gain us insights into improvements we need to make to our website;</li>
                  <li>Pixel tags may be used in connection with certain services to track the actions of our email recipients and to track the success of El Toro Negro marketing campaigns;</li>
                </ol>
                <p className="mb-4 mt-4">
                  We use Google Analytics (a third party analytics) to collect and analyze information about the use of our website and services, and to report on activities and trends. This service may also collect information regarding the use of other sites, apps, and online resources.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">For Personalisation</h3>
                <p className="mb-4">
                  El Toro Negro uses preference cookies to remember your preferences and to recognize you when you return to use our services.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">What if I don't want cookies or similar tracking technologies?</h2>
              <p className="mb-4">
                You have the right to control and adjust your preferences about cookies through our "Cookie Preference Center" or your browser settings. If you want to remove existing cookies from your device, you can do this using your browser options. If you want to block future cookies being placed on your device, you can do so by modifying the settings at our cookie setting center. Nevertheless, please consider that deleting and blocking cookies may have an impact on your user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">What types of cookies does El Toro Negro use?</h2>
              <p className="mb-4">
                The cookies used on El Toro Negro sites have been categorized as per the table below. However, it is important to note that not all cookies may be used in all jurisdictions or websites.
              </p>
              
              <div className="overflow-x-auto mt-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary-gray-light">
                      <th className="text-left py-4 px-4 font-semibold text-white">Category</th>
                      <th className="text-left py-4 px-4 font-semibold text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-primary-gray-light">
                      <td className="py-4 px-4 font-medium text-accent-yellow">Strictly Necessary cookies</td>
                      <td className="py-4 px-4">
                        These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms. You can set your browser to block or alert you about these cookies, but some parts of the site will not work. These cookies do not store any personally identifiable information.
                      </td>
                    </tr>
                    <tr className="border-b border-primary-gray-light">
                      <td className="py-4 px-4 font-medium text-accent-yellow">Performance cookies</td>
                      <td className="py-4 px-4">
                        These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies we will not know when you have visited our site and will not be able to monitor its performance.
                      </td>
                    </tr>
                    <tr className="border-b border-primary-gray-light">
                      <td className="py-4 px-4 font-medium text-accent-yellow">Functionality cookies</td>
                      <td className="py-4 px-4">
                        These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by a third-party provider whose services we have added to our pages. If you don't allow these cookies some services may not function properly.
                      </td>
                    </tr>
                    <tr className="border-b border-primary-gray-light">
                      <td className="py-4 px-4 font-medium text-accent-yellow">Targeting cookies</td>
                      <td className="py-4 px-4">
                        Targeting cookies may be set through our site by our advertising partners. They can be used by these third parties to build a profile of your interests based on the browsing information they collect from you, which includes uniquely identifying your browser and terminal equipment. If you do not allow these cookies you will still see basic advertising on your browser that is generic and not based on your interests.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-medium text-accent-yellow">Social Media Cookies</td>
                      <td className="py-4 px-4">
                        These cookies are set by a range of social media services that we have added to the site to enable you to share our content with your friends and networks. They are capable of tracking your browser across other sites and building up a profile of your interests. This may impact the content and messages you see on other websites you visit. If you do not allow these cookies you may not be able to use or see these sharing tools.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">Changes to our Cookie Policy</h2>
              <p className="mb-4">
                We may change this Cookie Policy from time to time. Please take a look at the "Last updated" legend at the top of this page to see when this Cookie Policy was last revised.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">Contacts and comments</h2>
              <p className="mb-4">
                If you have any questions, please submit your request through our support channels or via the contact information provided on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-accent-yellow mb-4">Additional Resources</h2>
              <p className="mb-4">The following links explain how to access cookie settings in various browsers:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent-yellow hover:underline">
                    Cookie settings in Google Chrome
                  </a>
                </li>
                <li>
                  <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-accent-yellow hover:underline">
                    Cookie settings in Microsoft Edge
                  </a>
                </li>
                <li>
                  <a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-accent-yellow hover:underline">
                    Cookie settings in Firefox
                  </a>
                </li>
                <li>
                  <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent-yellow hover:underline">
                    Cookie settings in Safari (OS X)
                  </a>
                </li>
                <li>
                  <a href="https://support.apple.com/en-us/HT201265" target="_blank" rel="noopener noreferrer" className="text-accent-yellow hover:underline">
                    Cookie settings in Safari (iOS)
                  </a>
                </li>
                <li>
                  <a href="https://support.google.com/android/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent-yellow hover:underline">
                    Cookie settings in Android
                  </a>
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block bg-accent-yellow text-black px-6 py-3 rounded-lg font-semibold hover:bg-accent-yellow-dark transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

