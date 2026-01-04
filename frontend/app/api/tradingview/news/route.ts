/**
 * Server-side API route for fetching news from TradingView
 * Note: TradingView doesn't have a public news API, so we'll use alternative sources
 * that provide news related to TradingView symbols
 */

import { NextRequest, NextResponse } from 'next/server';

// Mapping symbols to search terms for news
const SYMBOL_NEWS_MAP: Record<string, string> = {
  'AAPL': 'Apple',
  'MSFT': 'Microsoft',
  'GOOGL': 'Google Alphabet',
  'XAU': 'Gold',
  'CL': 'Crude Oil',
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category') as 'stocks' | 'commodities' | 'crypto' | null;

  if (!symbol || !category) {
    return NextResponse.json(
      { error: 'Symbol and category parameters are required' },
      { status: 400 }
    );
  }

  const searchTerm = SYMBOL_NEWS_MAP[symbol.toUpperCase()] || symbol;

  try {
    // Use NewsAPI as primary source (requires API key)
    const newsApiKey = process.env.NEWS_API_KEY;
    
    if (newsApiKey) {
      try {
        const newsResponse = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerm)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${newsApiKey}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          
          if (newsData.articles && Array.isArray(newsData.articles)) {
            const formattedNews = newsData.articles.map((article: any) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              imageUrl: article.urlToImage,
              source: article.source?.name || 'Unknown',
              publishedAt: article.publishedAt,
            }));

            return NextResponse.json(
              formattedNews,
              {
                headers: {
                  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
              }
            );
          }
        }
      } catch (newsApiError) {
        console.warn('NewsAPI failed, using fallback:', newsApiError);
      }
    }

    // Fallback: Use Alpha Vantage News & Sentiment API (free tier available)
    // Or return mock news with TradingView-related content
    const fallbackNews = [
      {
        title: `${searchTerm} Market Analysis`,
        description: `Latest market analysis and insights for ${searchTerm}. Check TradingView charts for detailed technical analysis.`,
        url: `https://www.tradingview.com/symbols/${symbol}/`,
        imageUrl: null,
        source: 'TradingView',
        publishedAt: new Date().toISOString(),
      },
      {
        title: `${searchTerm} Price Update`,
        description: `Stay updated with ${searchTerm} price movements. Use TradingView for real-time charts and analysis.`,
        url: `https://www.tradingview.com/symbols/${symbol}/`,
        imageUrl: null,
        source: 'TradingView',
        publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
    ];

    return NextResponse.json(
      fallbackNews,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error(`Error fetching news for ${symbol}:`, error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch news',
        symbol: symbol.toUpperCase(),
      },
      { status: 500 }
    );
  }
}

