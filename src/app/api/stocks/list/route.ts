import { NextRequest, NextResponse } from 'next/server';
import { EastmoneyResponse, EastmoneyQuote, SectorType, MarketType } from '@/types/eastmoney';
import { getMockStocks } from '@/lib/stockSelector';

/**
 * 获取A股所有股票列表
 * GET /api/stocks/list?sector=main
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sector = searchParams.get('sector') || ''; // 默认全部市场
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '5000'); // 默认5000条

    // 东方财富获取股票列表的API
    const url = 'http://82.push2.eastmoney.com/api/qt/clist/get';
    
    const params = new URLSearchParams({
      pn: page.toString(),
      pz: pageSize.toString(),
      po: '1', // 排序方式：1=升序
      np: '1',
      fltt: '2',
      invt: '2',
      wbp2u: '|0|0|0|web',
      fid: 'f3', // 按涨跌幅排序
      fs: sector || 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23', // 默认全A股
      fields: 'f12,f13,f14,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f15,f16,f17,f18,f20,f21,f22,f23,f24,f25,f102,f103,f104,f105,f106,f107,f108,f109,f110,f111,f112,f113,f114,f115,f116,f117,f118,f119,f120,f121',
      _: Date.now().toString(),
    });

    let response: Response;
    let useMockData = false;
    
    try {
      response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/',
        },
        next: { revalidate: 60 }, // 缓存60秒
      });
    } catch (networkError) {
      console.warn('网络请求失败，使用模拟数据:', networkError);
      useMockData = true;
    }

    if (!useMockData && response.ok) {
      const result: EastmoneyResponse = await response.json();

      if (result.rc !== 0) {
        console.warn('API返回错误，使用模拟数据:', result.rc);
        useMockData = true;
      } else {
        return NextResponse.json({
          success: true,
          data: {
            stocks: result.data.diff.map(item => transformStockQuote(item)),
            total: result.data.total,
            page,
            pageSize,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      useMockData = true;
    }

    // 使用模拟数据
    if (useMockData) {
      console.log('使用模拟股票数据');
      const mockStocks = getMockStocks();
      
      // 转换为API返回格式
      const transformedStocks = mockStocks.map(stock => ({
        code: stock.code,
        name: stock.name,
        market: stock.code.startsWith('6') ? 'SH' : 'SZ',
        price: stock.price,
        change: stock.change,
        priceChange: stock.priceChange,
        openPrice: stock.openPrice,
        closePrice: stock.closePrice,
        highPrice: stock.highPrice,
        lowPrice: stock.lowPrice,
        volume: stock.volume,
        turnover: stock.turnover,
        turnoverRate: stock.turnoverRate,
        volumeRatio: stock.volumeRatio,
        marketCap: stock.marketCap,
        pe: 20 + Math.random() * 30,
        pb: 1 + Math.random() * 5,
        buy1: stock.buy1,
        sell1: stock.sell1,
        updateTime: stock.updateTime,
      }));

      return NextResponse.json({
        success: true,
        data: {
          stocks: transformedStocks,
          total: transformedStocks.length,
          page,
          pageSize,
        },
        timestamp: new Date().toISOString(),
        mock: true, // 标记为模拟数据
      });
    }

  } catch (error) {
    console.error('获取股票列表失败:', error);
    return NextResponse.json(
      {
        error: '获取股票列表失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 转换东方财富API数据为标准格式
 */
function transformStockQuote(quote: EastmoneyQuote): any {
  return {
    code: quote.f12,
    name: quote.f14,
    market: quote.f13 === 1 ? 'SH' : 'SZ',
    price: quote.f2 || 0,
    change: quote.f3 || 0,
    priceChange: quote.f4 || 0,
    openPrice: quote.f10 || 0,
    closePrice: quote.f11 || 0,
    highPrice: quote.f8 || 0,
    lowPrice: quote.f9 || 0,
    volume: quote.f5 || 0,
    turnover: quote.f6 || 0,
    turnoverRate: quote.f22 || 0,
    volumeRatio: quote.f25 || 0,
    marketCap: (quote.f21 || 0) / 100000000, // 转换为亿
    pe: quote.f23 || 0,
    pb: quote.f24 || 0,
    buy1: quote.f103 || 0,
    buy2: quote.f105 || 0,
    buy3: quote.f107 || 0,
    buy4: quote.f109 || 0,
    buy5: quote.f111 || 0,
    sell1: quote.f113 || 0,
    sell2: quote.f115 || 0,
    sell3: quote.f117 || 0,
    sell4: quote.f119 || 0,
    sell5: quote.f121 || 0,
    updateTime: new Date().toLocaleString('zh-CN'),
  };
}
