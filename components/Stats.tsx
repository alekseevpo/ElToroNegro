export default function Stats() {
  const stats = [
    { label: 'Total Assets', value: '€50M+', description: 'Under management' },
    { label: 'Active Investors', value: '10K+', description: 'Growing community' },
    { label: 'Average Return', value: '12.5%', description: 'Per week' },
    { label: 'Minimum Invest', value: '€10', description: 'Start small' },
  ];

  return (
    <section className="relative py-16">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent-yellow mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-primary-gray-lighter">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

