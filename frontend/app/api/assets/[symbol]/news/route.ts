import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * API Route to fetch news for a specific asset
 * Uses NewsAPI (free tier: 100 requests/day)
 * Requires NEXT_PUBLIC_NEWS_API_KEY in environment variables
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const category = request.nextUrl.searchParams.get('category') || 'stocks';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;

    // Build query based on category
    let query = symbol;
    if (category === 'stocks') {
      query = `${symbol} stock`;
    } else if (category === 'commodities') {
      query = `${symbol} commodity`;
    } else if (category === 'crypto') {
      query = `${symbol} cryptocurrency bitcoin`;
    }

    // If API key is not configured, return mock news
    if (!apiKey) {
      logger.warn('NewsAPI key not configured, returning mock news', { symbol });
      const mockNews = [
        {
          title: `${symbol} Shows Strong Performance in Recent Trading`,
          description: `Market analysts are closely watching ${symbol} as it continues to show resilience in the current market conditions.`,
          url: '#',
          source: 'Market News',
          publishedAt: new Date().toISOString(),
        },
        {
          title: `Investors Eye ${symbol} for Long-term Growth Potential`,
          description: `Financial experts suggest that ${symbol} may offer attractive opportunities for investors looking for stable returns.`,
          url: '#',
          source: 'Financial Times',
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          title: `${symbol} Market Analysis: Current Trends and Future Outlook`,
          description: `A comprehensive analysis of ${symbol} market performance and expert predictions for the coming months.`,
          url: '#',
          source: 'Market Analysis',
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      return NextResponse.json(mockNews, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
      });
    }

    // Fetch from NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      logger.error('NewsAPI request failed', new Error(`Status: ${response.status}`), { symbol, status: response.status });
      // Return mock news on API failure
      const mockNews = [
        {
          title: `${symbol} Market Update`,
          description: `Latest updates and analysis for ${symbol}.`,
          url: '#',
          source: 'Market News',
          publishedAt: new Date().toISOString(),
        },
      ];
      return NextResponse.json(mockNews);
    }

    const data = await response.json();

    if (!data.articles || !Array.isArray(data.articles)) {
      return NextResponse.json([]);
    }

    const news = data.articles
      .filter((article: any) => article.title && article.url && !article.url.includes('removed'))
      .map((article: any) => ({
        title: article.title,
        description: article.description || '',
        url: article.url,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        imageUrl: article.urlToImage,
      }))
      .slice(0, 10);

    return NextResponse.json(news, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching asset news', error as Error, { symbol: params.symbol });
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

