'use client';

export default function MissionSection() {
  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-primary-gray text-primary-gray-lighter text-sm font-medium rounded-full">
              Our Philosophy
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-accent-yellow mb-6 tracking-tight">
            Our Mission
          </h1>
          <p className="text-xl md:text-2xl text-primary-gray-lighter max-w-3xl mx-auto leading-relaxed">
            Building an investment platform based on principles of freedom, independence, and mutual trust.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-24">
          {/* Why we limit investments - Enhanced */}
          <div className="relative">
            <div className="bg-primary-gray rounded-3xl shadow-sm border border-primary-gray-light p-8 md:p-12 lg:p-16 overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-black to-transparent rounded-full blur-3xl opacity-50 -z-0"></div>
              
              <div className="relative z-10">
                <div className="flex items-start space-x-6 mb-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-black border-2 border-primary-gray-light rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl md:text-4xl font-bold text-accent-yellow mb-6 leading-tight">
                      Intentionally Limiting Large Investments
                    </h2>
                    <div className="space-y-4 text-lg text-primary-gray-lighter leading-relaxed">
                      <p>
                        We intentionally do not accept large investments. This is our conscious choice, based on a deep understanding of how large capital can influence the independence and freedom of decision-making.
                      </p>
                      <p>
                        When a large investor injects significant capital into a company's assets, they naturally gain the right to dictate their terms. This inevitably leads to a loss of autonomy, a shift in priorities, and a departure from the platform's original values.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Independence - Redesigned */}
          <div className="relative">
            <div className="bg-gradient-to-br from-black to-primary-dark rounded-3xl p-8 md:p-12 lg:p-16 text-white overflow-hidden border border-primary-gray-light">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent-yellow opacity-5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-yellow opacity-5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                    Freedom and Independence
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                    Our Core Values
                  </p>
                  <div className="space-y-6 text-lg md:text-xl text-gray-200 leading-relaxed">
                    <p>
                      We plan to remain free and independent. Our company does not depend on external capital or influential investors who might impose their conditions.
                    </p>
                    <p className="text-2xl md:text-3xl font-semibold text-white mt-8">
                      The only thing our company depends on is <span className="text-gray-300">people</span>.
                    </p>
                    <p className="text-lg md:text-xl text-gray-300">
                      It is people who shape our ecosystem and determine our future.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Pillars - Enhanced */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-accent-yellow mb-4">
                Our Foundation
              </h2>
              <p className="text-xl text-primary-gray-lighter max-w-2xl mx-auto">
                Three pillars that support our platform and mission
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Traders */}
              <div className="group bg-primary-gray rounded-2xl border-2 border-primary-gray-light p-8 hover:border-accent-yellow hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-black border-2 border-primary-gray-light rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:border-accent-yellow transition-colors">
                  <svg className="w-10 h-10 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Traders</h3>
                <p className="text-primary-gray-lighter text-center leading-relaxed">
                  Professional traders within our team are the heart of our trading strategy. Their experience, knowledge, and decisions directly influence the platform's results.
                </p>
              </div>

              {/* Developers */}
              <div className="group bg-primary-gray rounded-2xl border-2 border-primary-gray-light p-8 hover:border-accent-yellow hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-black border-2 border-primary-gray-light rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:border-accent-yellow transition-colors">
                  <svg className="w-10 h-10 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Developers</h3>
                <p className="text-primary-gray-lighter text-center leading-relaxed">
                  Product developers create the technologies that make our platform convenient, secure, and innovative. Their contribution determines the quality of our service.
                </p>
              </div>

              {/* Investors */}
              <div className="group bg-primary-gray rounded-2xl border-2 border-primary-gray-light p-8 hover:border-accent-yellow hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-black border-2 border-primary-gray-light rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:border-accent-yellow transition-colors">
                  <svg className="w-10 h-10 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Investors</h3>
                <p className="text-primary-gray-lighter text-center leading-relaxed">
                  Our investors are a community of people who trust us and share our values. Every investor matters, regardless of investment size.
                </p>
              </div>
            </div>
          </div>

          {/* Philosophy - Redesigned */}
          <div className="bg-primary-gray rounded-3xl border border-primary-gray-light p-8 md:p-12 lg:p-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-accent-yellow mb-8">
                Our Philosophy
              </h2>
              <div className="space-y-6 text-lg md:text-xl text-primary-gray-lighter leading-relaxed">
                <p>
                  We believe that a company's true strength lies not in the size of its capital, but in the quality of its team and the trust of its community.
                </p>
                <p>
                  By limiting large investments, we preserve our independence, remain true to our principles, and can make decisions that truly benefit all participants in our ecosystem.
                </p>
                <div className="pt-8 border-t border-primary-gray-light mt-12">
                  <p className="text-2xl md:text-3xl font-bold text-accent-yellow leading-relaxed">
                    We depend only on people.
                  </p>
                  <p className="text-xl md:text-2xl text-primary-gray-lighter mt-4">
                    And that is our greatest strength.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits - Enhanced */}
          <div className="bg-gradient-to-br from-primary-gray to-black rounded-3xl border border-primary-gray-light p-8 md:p-12 lg:p-16">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-accent-yellow mb-4">
                  What This Means for You
                </h2>
                <p className="text-xl text-primary-gray-lighter">
                  As an investor on our platform
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start space-x-5 bg-primary-gray rounded-xl p-6 border border-primary-gray-light hover:border-accent-yellow hover:shadow-lg transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 bg-black border-2 border-primary-gray-light rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Transparent Decision-Making</h3>
                    <p className="text-primary-gray-lighter leading-relaxed">
                      All decisions are made with the community's interests in mind, not individual large investors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-5 bg-primary-gray rounded-xl p-6 border border-primary-gray-light hover:border-accent-yellow hover:shadow-lg transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 bg-black border-2 border-primary-gray-light rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Long-Term Stability</h3>
                    <p className="text-primary-gray-lighter leading-relaxed">
                      Focus on sustainable growth, not quick profits for large capital.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-5 bg-primary-gray rounded-xl p-6 border border-primary-gray-light hover:border-accent-yellow hover:shadow-lg transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 bg-black border-2 border-primary-gray-light rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Equal Opportunities</h3>
                    <p className="text-primary-gray-lighter leading-relaxed">
                      Every investor matters and has an equal voice, regardless of investment amount.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-5 bg-primary-gray rounded-xl p-6 border border-primary-gray-light hover:border-accent-yellow hover:shadow-lg transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 bg-black border-2 border-primary-gray-light rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Protection of Your Interests</h3>
                    <p className="text-primary-gray-lighter leading-relaxed">
                      No one can impose conditions that contradict our community's interests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
