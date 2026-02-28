'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stock, FilterConfig, DEFAULT_FILTER } from '@/types/stock';
import { getMockStocks, selectStocks } from '@/lib/stockSelector';
import { TrendingUp, TrendingDown, Filter, RefreshCw, AlertCircle, CheckCircle, Save } from 'lucide-react';

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [filter, setFilter] = useState<FilterConfig>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterConfig>(DEFAULT_FILTER);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // 加载和筛选股票
  useEffect(() => {
    loadStocks();
  }, [filter]);

  const loadStocks = () => {
    const allStocks = getMockStocks();
    setStocks(allStocks);
    const filtered = selectStocks(allStocks, filter);
    setSelectedStocks(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadStocks();
      setIsRefreshing(false);
    }, 1000);
  };

  const updateTempFilter = (key: keyof FilterConfig, value: number) => {
    setTempFilter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfirm = () => {
    setFilter(tempFilter);
    const now = new Date();
    setLastSavedTime(now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页头 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            GYTL-Tools
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
            杨永兴隔夜套利法选股工具
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            基于涨幅、量比、换手率等指标筛选适合隔夜操作的优质标的
          </p>
        </div>

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="results">
              选股结果 ({selectedStocks.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              筛选条件
            </TabsTrigger>
          </TabsList>

          {/* 选股结果页面 */}
          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                共筛选出 <span className="font-bold text-blue-600">{selectedStocks.length}</span> 只股票
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>
            </div>

            {selectedStocks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="h-16 w-16 text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
                    没有符合条件的股票
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm">
                    请调整筛选条件后重新筛选
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {selectedStocks.map((stock) => (
                  <Card key={stock.code} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-600">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{stock.name}</CardTitle>
                          <CardDescription className="text-base font-mono">
                            {stock.code}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={stock.change > 0 ? 'default' : 'secondary'}
                          className={`text-base px-3 py-1 ${
                            stock.change > 0
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}
                        >
                          {stock.change > 0 ? '+' : ''}
                          {stock.change.toFixed(2)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* 价格信息 */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">当前价格</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          ¥{stock.price.toFixed(2)}
                        </span>
                      </div>

                      {/* 关键指标 */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                          <div className="text-slate-500 dark:text-slate-400 text-xs">量比</div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {stock.volumeRatio.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                          <div className="text-slate-500 dark:text-slate-400 text-xs">换手率</div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {stock.turnoverRate.toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                          <div className="text-slate-500 dark:text-slate-400 text-xs">流通市值</div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {stock.marketCap}亿
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                          <div className="text-slate-500 dark:text-slate-400 text-xs">综合评分</div>
                          <div className="font-semibold text-blue-600">
                            {stock.score}分
                          </div>
                        </div>
                      </div>

                      {/* 符合条件的原因 */}
                      <Separator />
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            符合条件
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {stock.reasons.slice(0, 3).map((reason, index) => (
                            <li
                              key={index}
                              className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1"
                            >
                              <span className="text-green-500">•</span>
                              {reason}
                            </li>
                          ))}
                          {stock.reasons.length > 3 && (
                            <li className="text-xs text-slate-500 dark:text-slate-500">
                              +{stock.reasons.length - 3} 条更多...
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 筛选条件页面 */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  选股条件配置
                </CardTitle>
                <CardDescription>
                  根据杨永兴隔夜套利法调整筛选参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 保存控制区域 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>调整参数后请点击确认按钮生效</span>
                    </div>
                    {lastSavedTime && (
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        上次保存时间：{lastSavedTime}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSaveConfirm}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    保存并应用筛选条件
                  </Button>
                </div>

                <Separator />
                {/* 涨幅范围 */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>涨幅范围</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tempFilter.minChange}% - {tempFilter.maxChange}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最小涨幅</Label>
                        <Slider
                          value={[tempFilter.minChange]}
                          onValueChange={([value]) => updateTempFilter('minChange', value)}
                          max={10}
                          min={0}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最大涨幅</Label>
                        <Slider
                          value={[tempFilter.maxChange]}
                          onValueChange={([value]) => updateTempFilter('maxChange', value)}
                          max={15}
                          min={3}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 量比 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>最小量比</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tempFilter.minVolumeRatio}
                      </span>
                    </div>
                    <Slider
                      value={[tempFilter.minVolumeRatio]}
                      onValueChange={([value]) => updateTempFilter('minVolumeRatio', value)}
                      max={5}
                      min={1}
                      step={0.1}
                    />
                  </div>

                  <Separator />

                  {/* 换手率范围 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>换手率范围</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tempFilter.minTurnoverRate}% - {tempFilter.maxTurnoverRate}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最小换手率</Label>
                        <Slider
                          value={[tempFilter.minTurnoverRate]}
                          onValueChange={([value]) => updateTempFilter('minTurnoverRate', value)}
                          max={20}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最大换手率</Label>
                        <Slider
                          value={[tempFilter.maxTurnoverRate]}
                          onValueChange={([value]) => updateTempFilter('maxTurnoverRate', value)}
                          max={30}
                          min={5}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 流通市值范围 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>流通市值范围（亿）</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tempFilter.minMarketCap}亿 - {tempFilter.maxMarketCap}亿
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最小流通市值</Label>
                        <Slider
                          value={[tempFilter.minMarketCap]}
                          onValueChange={([value]) => updateTempFilter('minMarketCap', value)}
                          max={200}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最大流通市值</Label>
                        <Slider
                          value={[tempFilter.maxMarketCap]}
                          onValueChange={([value]) => updateTempFilter('maxMarketCap', value)}
                          max={1000}
                          min={10}
                          step={10}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 分时走势在均价线上方 */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>分时走势全天在均价线上方</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        开启后仅筛选全天在均价线上方的股票
                      </p>
                    </div>
                    <Switch
                      checked={tempFilter.requireAboveAveragePrice}
                      onCheckedChange={(checked) => updateTempFilter('requireAboveAveragePrice', checked ? 1 : 0)}
                    />
                  </div>

                  <Separator />

                  {/* 20天内涨停天数 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>20天内最少涨停天数</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tempFilter.minLimitUpDays20} 天
                      </span>
                    </div>
                    <Slider
                      value={[tempFilter.minLimitUpDays20]}
                      onValueChange={([value]) => updateTempFilter('minLimitUpDays20', value)}
                      max={10}
                      min={0}
                      step={1}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      设置为 0 表示不限制涨停天数
                    </p>
                  </div>

                  <Separator />

                  {/* 股价范围 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>股价范围</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        ¥{tempFilter.minPrice} - ¥{tempFilter.maxPrice}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最低价格</Label>
                        <Slider
                          value={[tempFilter.minPrice]}
                          onValueChange={([value]) => updateTempFilter('minPrice', value)}
                          max={50}
                          min={1}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">最高价格</Label>
                        <Slider
                          value={[tempFilter.maxPrice]}
                          onValueChange={([value]) => updateTempFilter('maxPrice', value)}
                          max={3000}
                          min={10}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 操作说明 */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      操作建议
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• 买入时机：尾盘 14:30-15:00 分批买入</li>
                      <li>• 卖出时机：次日早盘 9:30-10:00 冲高卖出</li>
                      <li>• 止损：次日跌破买入价5%立即止损</li>
                      <li>• 止盈：次日涨幅达到5%-8%考虑减仓</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 免责声明 */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>免责声明：</strong>本工具仅供学习和研究参考，不构成任何投资建议。股票投资有风险，入市需谨慎。请根据自身风险承受能力理性投资。
          </p>
        </div>
      </div>
    </div>
  );
}
