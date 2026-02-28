import { Stock, FilterConfig, DEFAULT_FILTER } from '@/types/stock';

// 模拟股票数据（实际应用中应从数据源获取）
const mockStocks: Stock[] = [
  {
    code: '600000',
    name: '浦发银行',
    price: 12.56,
    change: 4.5,
    volume: 125000,
    turnoverRate: 8.5,
    volumeRatio: 2.1,
    marketCap: 85,
    high52Week: 15.20,
    low52Week: 8.50,
    ma5: 12.10,
    ma10: 11.80,
    ma20: 11.50,
    aboveAveragePrice: true,
    limitUpDays20: 2,
    score: 85,
    reasons: [],
  },
  {
    code: '000001',
    name: '平安银行',
    price: 11.23,
    change: 3.2,
    volume: 98000,
    turnoverRate: 6.8,
    volumeRatio: 1.8,
    marketCap: 120,
    high52Week: 14.50,
    low52Week: 9.20,
    ma5: 10.95,
    ma10: 10.70,
    ma20: 10.40,
    aboveAveragePrice: false,
    limitUpDays20: 1,
    score: 82,
    reasons: [],
  },
  {
    code: '000002',
    name: '万科A',
    price: 15.67,
    change: 5.8,
    volume: 156000,
    turnoverRate: 9.2,
    volumeRatio: 2.5,
    marketCap: 95,
    high52Week: 18.90,
    low52Week: 12.30,
    ma5: 15.10,
    ma10: 14.80,
    ma20: 14.20,
    aboveAveragePrice: true,
    limitUpDays20: 3,
    score: 88,
    reasons: [],
  },
  {
    code: '000858',
    name: '五粮液',
    price: 145.50,
    change: 6.2,
    volume: 45000,
    turnoverRate: 3.5,
    volumeRatio: 1.6,
    marketCap: 850,
    high52Week: 180.00,
    low52Week: 125.00,
    ma5: 140.20,
    ma10: 138.50,
    ma20: 135.00,
    aboveAveragePrice: false,
    limitUpDays20: 0,
    score: 75,
    reasons: [],
  },
  {
    code: '600519',
    name: '贵州茅台',
    price: 1680.00,
    change: 2.8,
    volume: 8000,
    turnoverRate: 1.2,
    volumeRatio: 1.1,
    marketCap: 2500,
    high52Week: 1850.00,
    low52Week: 1500.00,
    ma5: 1660.00,
    ma10: 1650.00,
    ma20: 1630.00,
    aboveAveragePrice: false,
    limitUpDays20: 0,
    score: 70,
    reasons: [],
  },
  {
    code: '002594',
    name: '比亚迪',
    price: 256.30,
    change: 7.5,
    volume: 89000,
    turnoverRate: 4.8,
    volumeRatio: 2.8,
    marketCap: 750,
    high52Week: 320.00,
    low52Week: 200.00,
    ma5: 248.50,
    ma10: 240.00,
    ma20: 235.00,
    aboveAveragePrice: true,
    limitUpDays20: 2,
    score: 80,
    reasons: [],
  },
  {
    code: '600036',
    name: '招商银行',
    price: 32.45,
    change: 4.2,
    volume: 112000,
    turnoverRate: 7.6,
    volumeRatio: 2.2,
    marketCap: 180,
    high52Week: 42.00,
    low52Week: 28.50,
    ma5: 31.80,
    ma10: 31.20,
    ma20: 30.50,
    aboveAveragePrice: true,
    limitUpDays20: 2,
    score: 84,
    reasons: [],
  },
  {
    code: '300750',
    name: '宁德时代',
    price: 185.60,
    change: 5.5,
    volume: 67000,
    turnoverRate: 5.2,
    volumeRatio: 2.0,
    marketCap: 810,
    high52Week: 260.00,
    low52Week: 155.00,
    ma5: 180.50,
    ma10: 175.00,
    ma20: 170.00,
    aboveAveragePrice: false,
    limitUpDays20: 1,
    score: 82,
    reasons: [],
  },
];

// 杨永兴隔夜套利法选股算法
export function selectStocks(
  stocks: Stock[],
  filter: FilterConfig = DEFAULT_FILTER
): Stock[] {
  const selectedStocks: Stock[] = [];

  for (const stock of stocks) {
    const reasons: string[] = [];
    let score = 0;

    // 条件1: 涨幅在范围内
    if (stock.change >= filter.minChange && stock.change <= filter.maxChange) {
      reasons.push(`涨幅 ${stock.change.toFixed(2)}% 符合要求`);
      score += 15;
    }

    // 条件2: 量比达标
    if (stock.volumeRatio >= filter.minVolumeRatio) {
      reasons.push(`量比 ${stock.volumeRatio.toFixed(2)} 大于 ${filter.minVolumeRatio}`);
      score += 10;
    }

    // 条件3: 换手率在范围内
    if (
      stock.turnoverRate >= filter.minTurnoverRate &&
      stock.turnoverRate <= filter.maxTurnoverRate
    ) {
      reasons.push(`换手率 ${stock.turnoverRate.toFixed(2)}% 在合理范围`);
      score += 10;
    }

    // 条件4: 流通市值在范围内
    if (stock.marketCap >= filter.minMarketCap && stock.marketCap <= filter.maxMarketCap) {
      reasons.push(`流通市值 ${stock.marketCap}亿在${filter.minMarketCap}-${filter.maxMarketCap}亿范围`);
      score += 10;
    }

    // 条件5: 股价在合理区间
    if (stock.price >= filter.minPrice && stock.price <= filter.maxPrice) {
      reasons.push(`股价 ${stock.price.toFixed(2)}元在合理区间`);
      score += 10;
    }

    // 条件6: 分时走势全天在均价线上方（可选条件）
    if (filter.requireAboveAveragePrice) {
      if (stock.aboveAveragePrice) {
        reasons.push('分时走势全天在均价线上方，走势强势');
        score += 15;
      }
    } else {
      // 如果不是强制条件，满足则加分
      if (stock.aboveAveragePrice) {
        reasons.push('分时走势全天在均价线上方');
        score += 8;
      }
    }

    // 条件7: 20天内涨停天数（可选条件）
    if (filter.minLimitUpDays20 > 0) {
      if (stock.limitUpDays20 >= filter.minLimitUpDays20) {
        reasons.push(`20天内涨停${stock.limitUpDays20}天，市场关注度高`);
        score += 15;
      }
    } else {
      // 如果不是强制条件，有涨停则加分
      if (stock.limitUpDays20 > 0) {
        reasons.push(`20天内涨停${stock.limitUpDays20}天`);
        score += 5;
      }
    }

    // 条件8: 技术形态 - 价格在均线上方
    const isAboveMA = stock.price > stock.ma5 && stock.ma5 > stock.ma10 && stock.ma10 > stock.ma20;
    if (isAboveMA) {
      reasons.push('处于上升趋势，均线多头排列');
      score += 10;
    }

    // 条件9: 距离52周高点的安全距离
    const distanceFromHigh = ((stock.high52Week - stock.price) / stock.high52Week) * 100;
    if (distanceFromHigh > 10 && distanceFromHigh < 30) {
      reasons.push(`距离52周高点 ${distanceFromHigh.toFixed(2)}%，有上升空间`);
      score += 7;
    }

    // 综合评分筛选（分数 >= 70 才入选）
    if (score >= 70) {
      selectedStocks.push({
        ...stock,
        score,
        reasons,
      });
    }
  }

  // 按评分降序排序
  return selectedStocks.sort((a, b) => b.score - a.score);
}

// 获取模拟数据
export function getMockStocks(): Stock[] {
  return mockStocks;
}
