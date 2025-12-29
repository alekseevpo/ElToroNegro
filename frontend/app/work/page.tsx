'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function WorkPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-primary-gray to-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,193,7,0.1),transparent_70%)]"></div>
          
          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="text-center mb-16"
            >
              <motion.h1
                className="text-5xl md:text-7xl font-bold text-white mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
              >
                Work with{' '}
                <span className="text-accent-yellow">El Toro Negro</span>
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl text-primary-gray-lighter max-w-3xl mx-auto"
                variants={itemVariants}
              >
                Help us become better. Find bugs, test features, and earn rewards.
              </motion.p>
            </motion.div>

            {/* Developer Challenge Banner */}
            <motion.div
              variants={itemVariants}
              className="mb-16"
            >
              <motion.div
                className="bg-gradient-to-r from-accent-yellow/20 via-accent-yellow/30 to-accent-yellow/20 rounded-2xl p-8 border-2 border-accent-yellow relative overflow-hidden"
                variants={pulseVariants}
                animate="animate"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,193,7,0.2),transparent_70%)]"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-[300px]">
                      <motion.div
                        className="inline-block px-4 py-2 bg-accent-yellow text-black text-sm font-bold rounded-full mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                      >
                        🏆 UPCOMING CHALLENGE
                      </motion.div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Developer Challenge
                      </h2>
                      <p className="text-lg text-primary-gray-lighter mb-4">
                        Showcase your skills and compete for the grand prize
                      </p>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <div className="text-3xl font-bold text-accent-yellow">$5,000</div>
                          <div className="text-sm text-primary-gray-lighter">Prize Pool</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">Coming Soon</div>
                          <div className="text-sm text-primary-gray-lighter">Stay tuned</div>
                        </div>
                      </div>
                    </div>
                    <motion.div
                      className="text-6xl md:text-8xl"
                      variants={floatVariants}
                      animate="animate"
                    >
                      💻
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Main Content */}
        <section className="relative py-16 bg-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-12"
            >
              {/* Bug Hunting Section */}
              <motion.div
                variants={itemVariants}
                className="bg-primary-gray rounded-2xl p-8 md:p-12 border border-primary-gray-light relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-yellow/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <motion.div
                    className="flex items-center gap-4 mb-6"
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-5xl">🐛</div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">Bug Hunting Program</h2>
                      <p className="text-primary-gray-lighter">Find bugs, get rewarded</p>
                    </div>
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <motion.div
                      className="bg-black/50 rounded-xl p-6 border border-primary-gray-light"
                      whileHover={{ scale: 1.02, borderColor: '#FFC107' }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-xl font-semibold text-white mb-3">How it works</h3>
                      <ul className="space-y-2 text-primary-gray-lighter">
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">•</span>
                          <span>Explore our platform and test all features</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">•</span>
                          <span>Report bugs through our submission system</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">•</span>
                          <span>Get verified and receive rewards</span>
                        </li>
                      </ul>
                    </motion.div>

                    <motion.div
                      className="bg-black/50 rounded-xl p-6 border border-primary-gray-light"
                      whileHover={{ scale: 1.02, borderColor: '#FFC107' }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-xl font-semibold text-white mb-3">Rewards</h3>
                      <ul className="space-y-2 text-primary-gray-lighter">
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">•</span>
                          <span>Cash rewards for critical bugs</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">•</span>
                          <span>Platform tokens ($TAI) for minor issues</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">•</span>
                          <span>Recognition on our leaderboard</span>
                        </li>
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Talent Search Section */}
              <motion.div
                variants={itemVariants}
                className="bg-primary-gray rounded-2xl p-8 md:p-12 border border-primary-gray-light relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-yellow/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <motion.div
                    className="flex items-center gap-4 mb-6"
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-5xl">🎯</div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">We're Hiring Talents</h2>
                      <p className="text-primary-gray-lighter">Join our team and help build the future</p>
                    </div>
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <motion.div
                      className="bg-gradient-to-br from-accent-yellow/10 to-transparent rounded-xl p-6 border border-accent-yellow/30"
                      whileHover={{ scale: 1.03, borderColor: '#FFC107' }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-4xl">🔍</div>
                        <h3 className="text-2xl font-bold text-white">QA Specialists</h3>
                      </div>
                      <p className="text-primary-gray-lighter mb-4">
                        We're looking for experienced QA professionals who can help us ensure the highest quality standards.
                      </p>
                      <ul className="space-y-2 text-sm text-primary-gray-lighter">
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">✓</span>
                          <span>Manual and automated testing experience</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">✓</span>
                          <span>Web3/blockchain testing knowledge</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">✓</span>
                          <span>Strong attention to detail</span>
                        </li>
                      </ul>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-accent-yellow/10 to-transparent rounded-xl p-6 border border-accent-yellow/30"
                      whileHover={{ scale: 1.03, borderColor: '#FFC107' }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-4xl">💬</div>
                        <h3 className="text-2xl font-bold text-white">Support Specialists</h3>
                      </div>
                      <p className="text-primary-gray-lighter mb-4">
                        Join our support team and help users navigate our platform with ease.
                      </p>
                      <ul className="space-y-2 text-sm text-primary-gray-lighter">
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">✓</span>
                          <span>Excellent communication skills</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">✓</span>
                          <span>Cryptocurrency/Web3 knowledge</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent-yellow mt-1">✓</span>
                          <span>Customer-first mindset</span>
                        </li>
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* How to Apply Section */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-primary-gray to-black rounded-2xl p-8 md:p-12 border border-primary-gray-light"
              >
                <h2 className="text-3xl font-bold text-white mb-6 text-center">How to Get Started</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { step: '01', title: 'Sign Up', desc: 'Create an account on our platform' },
                    { step: '02', title: 'Get Involved', desc: 'Start testing or apply for a position' },
                    { step: '03', title: 'Get Rewarded', desc: 'Earn rewards for your contributions' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <motion.div
                        className="w-16 h-16 bg-accent-yellow rounded-full flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4"
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        {item.step}
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-primary-gray-lighter">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                variants={itemVariants}
                className="text-center"
              >
                <motion.div
                  className="inline-block"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/dashboard"
                    className="inline-block bg-accent-yellow text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-accent-yellow-dark transition-colors"
                  >
                    Get Started Now
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

