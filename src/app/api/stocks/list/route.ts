import { NextRequest, NextResponse } from 'next/server';
import { EastmoneyResponse, EastmoneyQuote, SectorType, MarketType } from '@/types/eastmoney';

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
      fields: 'f12,f13,f14,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f15,f16,f17,f18,f20,f21,f22,f23,f24,f25,f62,f63,f71,f72,f60,f61,f69,f70,f58,f59,f67,f68,f56,f57,f65,f66,f54,f55,f63,f64',
      _: Date.now().toString(),
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/',
      },
      next: { revalidate: 60 }, // 缓存60秒
    });

    if (!response.ok) {
      throw new Error('获取股票列表失败');
    }

    const result: EastmoneyResponse = await response.json();

    if (result.rc !== 0) {
      throw new Error(`API返回错误: ${result.rc}`);
    }

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
