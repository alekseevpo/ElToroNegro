import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface NewsItem {
  id: number;
  date: string;
  title: string;
  category: string;
  content: string;
  features?: string[];
}

const news: NewsItem[] = [
  {
    id: 1,
    date: '2025-01-04',
    title: 'Новая система аутентификации: MetaMask, TON Wallet и Coinbase Wallet',
    category: 'Функции',
    content: 'Мы добавили поддержку множественных способов входа в систему. Теперь пользователи могут войти через MetaMask, TON Wallet, Coinbase Wallet, а также через Google OAuth и email/пароль.',
    features: [
      'Поддержка MetaMask',
      'Интеграция TON Wallet',
      'Поддержка Coinbase Wallet',
      'Регистрация через email/пароль',
      'Вход через Google OAuth'
    ]
  },
  {
    id: 2,
    date: '2025-01-04',
    title: 'Интеграция с Bybit для получения рыночных данных',
    category: 'Интеграции',
    content: 'Платформа теперь использует Bybit API для получения актуальных цен на токенизированные активы. Поддерживаются токенизированные акции (xStocks) и золото (XAUUSD) через секцию TradFi.',
    features: [
      'Реальные цены на токенизированные акции',
      'Цены на золото (XAU)',
      'Исторические данные для графиков',
      'Обновление цен в реальном времени'
    ]
  },
  {
    id: 3,
    date: '2025-01-04',
    title: 'Система профилей пользователей с объединением',
    category: 'Улучшения',
    content: 'Реализована умная система объединения профилей. Если пользователь входит разными способами (например, через Google и MetaMask), профили автоматически объединяются в один.',
    features: [
      'Автоматическое объединение профилей',
      'Поддержка множественных кошельков',
      'Единый профиль для всех способов входа'
    ]
  },
  {
    id: 4,
    date: '2025-01-04',
    title: 'Обновленный дизайн и оптимизация пространства',
    category: 'Дизайн',
    content: 'Улучшен дизайн платформы: уменьшены боковые отступы для более эффективного использования пространства, обновлен логотип с прозрачным фоном, улучшена навигация.',
    features: [
      'Оптимизация использования пространства',
      'Новый логотип с прозрачным фоном',
      'Улучшенная навигация',
      'Адаптивный дизайн'
    ]
  },
  {
    id: 5,
    date: '2025-01-04',
    title: 'Система heartbeat для отслеживания активности',
    category: 'Технические улучшения',
    content: 'Добавлена система heartbeat, которая отслеживает активность пользователей в реальном времени. Это позволяет показывать актуальное количество онлайн пользователей.',
    features: [
      'Отслеживание активности в реальном времени',
      'Счетчик онлайн пользователей',
      'Статистика активности за день'
    ]
  },
  {
    id: 6,
    date: '2025-01-04',
    title: 'Верификация email и восстановление аккаунта',
    category: 'Безопасность',
    content: 'Реализована система верификации email для пользователей, которые регистрируются через кошелек. Это позволяет восстановить доступ к аккаунту при необходимости.',
    features: [
      'Верификация email',
      'Восстановление аккаунта',
      'Безопасное хранение данных'
    ]
  }
];

export default function NewsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="relative py-20">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        <div className="relative max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-accent-yellow mb-6 tracking-tight">
              News
            </h1>
            <p className="text-xl md:text-2xl text-primary-gray-lighter max-w-3xl mx-auto leading-relaxed">
              Последние новости и обновления платформы El Toro Negro
            </p>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {news.map((item) => (
              <article
                key={item.id}
                className="bg-primary-gray border border-primary-gray-light rounded-xl p-6 md:p-8 hover:border-accent-yellow/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex items-center gap-3 mb-2 md:mb-0">
                    <span className="px-3 py-1 bg-accent-yellow/20 text-accent-yellow text-xs font-medium rounded-full">
                      {item.category}
                    </span>
                    <time className="text-primary-gray-lighter text-sm">
                      {new Date(item.date).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {item.title}
                </h2>
                
                <p className="text-primary-gray-lighter mb-6 leading-relaxed">
                  {item.content}
                </p>

                {item.features && item.features.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-primary-gray-light">
                    <h3 className="text-sm font-semibold text-accent-yellow mb-3 uppercase tracking-wide">
                      Новые функции:
                    </h3>
                    <ul className="space-y-2">
                      {item.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-primary-gray-lighter">
                          <svg
                            className="w-5 h-5 text-accent-yellow mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

