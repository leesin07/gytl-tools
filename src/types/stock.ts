// 股票数据类型定义
export interface Stock {
  code: string; // 股票代码
  name: string; // 股票名称
  price: number; // 当前价格
  change: number; // 涨跌幅（百分比）
  volume: number; // 成交量（手）
  turnoverRate: number; // 换手率（百分比）
  volumeRatio: number; // 量比
  marketCap: number; // 流通市值（亿）
  high52Week: number; // 52周最高
  low52Week: number; // 52周最低
  ma5: number; // 5日均线
  ma10: number; // 10日均线
  ma20: number; // 20日均线
  aboveAveragePrice: boolean; // 分时走势全天在均价线上方
  limitUpDays20: number; // 20天内涨停天数
  score: number; // 综合评分
  reasons: string[]; // 符合条件的原因
}

// 选股条件配置
export interface FilterConfig {
  minChange: number; // 最小涨幅
  maxChange: number; // 最大涨幅
  minVolumeRatio: number; // 最小量比
  minTurnoverRate: number; // 最小换手率
  maxTurnoverRate: number; // 最大换手率
  minMarketCap: number; // 最小流通市值（亿）
  maxMarketCap: number; // 最大流通市值（亿）
  minPrice: number; // 最低价格
  maxPrice: number; // 最高价格
  requireAboveAveragePrice: boolean; // 要求分时走势全天在均价线上方
  minLimitUpDays20: number; // 最少20天内涨停天数
}

// 默认选股条件（基于杨永兴隔夜套利法）
export const DEFAULT_FILTER: FilterConfig = {
  minChange: 3, // 最小涨幅 3%
  maxChange: 8, // 最大涨幅 8%
  minVolumeRatio: 1.5, // 量比 > 1.5
  minTurnoverRate: 5, // 换手率 > 5%
  maxTurnoverRate: 15, // 换手率 < 15%
  minMarketCap: 0, // 最小流通市值 0亿（不限）
  maxMarketCap: 100, // 最大流通市值 100亿
  minPrice: 10, // 价格 > 10元
  maxPrice: 50, // 价格 < 50元
  requireAboveAveragePrice: false, // 不强制要求分时走势全天在均价线上方
  minLimitUpDays20: 0, // 最少20天内涨停天数（不限）
};
