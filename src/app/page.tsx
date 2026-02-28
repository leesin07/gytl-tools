'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stock, FilterConfig, DEFAULT_FILTER } from '@/types/stock';
import { FundRecord, Transaction, DEFAULT_FUND_RECORDS, DEFAULT_TRANSACTIONS } from '@/types/fund';
import { getMockStocks, selectStocks } from '@/lib/stockSelector';
import { calculateFundDashboard } from '@/lib/fundCalculator';
import { TrendingUp, Filter, RefreshCw, AlertCircle, CheckCircle, Save, ChevronDown, ChevronUp, DollarSign, List, Upload, Plus } from 'lucide-react';

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [allStocksWithTime, setAllStocksWithTime] = useState<Stock[]>([]);
  const [filter, setFilter] = useState<FilterConfig>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterConfig>(DEFAULT_FILTER);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  // 资金管理状态
  const [fundRecords, setFundRecords] = useState<FundRecord[]>(DEFAULT_FUND_RECORDS);
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [dashboardData, setDashboardData] = useState({
    totalCapital: 0,
    currentBalance: 0,
    totalProfit: 0,
    totalLoss: 0,
    profitRate: 0,
    winRate: 0,
    profitLossRatio: 0,
    totalTransactions: 0
  });

  // 交易录入表单状态
  const [transactionForm, setTransactionForm] = useState({
    type: 'buy' as 'buy' | 'sell',
    stockCode: '',
    stockName: '',
    quantity: '',
    price: '',
    buyPrice: '', // 买入价（用于卖出时计算盈亏）
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // 计算资金看板数据
  useEffect(() => {
    const data = calculateFundDashboard(fundRecords, transactions);
    setDashboardData(data);
  }, [fundRecords, transactions]);

  // 加载和筛选股票
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const allStocks = getMockStocks();
      setStocks(allStocks);
      const filtered = selectStocks(allStocks, filter);
      
      // 添加筛选时间
      const now = new Date();
      const timestamp = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const filteredWithTime = filtered.map(stock => ({
        ...stock,
        filterTimestamp: timestamp
      }));
      
      // 添加到列表最前面
      setAllStocksWithTime(prev => [...filteredWithTime, ...prev]);
      setIsRefreshing(false);
    }, 1000);
  };

  const updateTempFilter = (key: keyof FilterConfig, value: number) => {
    setTempFilter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfirm = () => {
    setFilter(tempFilter);
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setLastSavedTime(timeStr);
  };

  // 处理交易提交
  const handleTransactionSubmit = () => {
    const quantity = parseInt(transactionForm.quantity);
    const price = parseFloat(transactionForm.price);
    const buyPrice = parseFloat(transactionForm.buyPrice) || 0;

    if (!transactionForm.stockCode || !transactionForm.stockName || !quantity || !price) {
      alert('请填写完整的交易信息');
      return;
    }

    // 计算成交金额和手续费（手续费率 0.05%）
    const amount = quantity * price;
    const fee = amount * 0.0005;

    // 计算盈亏和收益率（仅卖出时计算）
    let profitLoss = 0;
    let profitRate = 0;

    if (transactionForm.type === 'sell' && buyPrice > 0) {
      const buyAmount = quantity * buyPrice;
      const buyFee = buyAmount * 0.0005;
      profitLoss = amount - fee - buyAmount - buyFee;
      profitRate = (profitLoss / (buyAmount + buyFee)) * 100;
    }

    // 计算交易后余额
    const lastBalance = fundRecords.length > 0 ? fundRecords[fundRecords.length - 1].balance : 0;
    const balanceAfter = transactionForm.type === 'buy' 
      ? lastBalance - amount - fee 
      : lastBalance + amount - fee;

    // 创建新交易记录
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      stockCode: transactionForm.stockCode,
      stockName: transactionForm.stockName,
      type: transactionForm.type,
      price,
      quantity,
      amount,
      fee,
      buyPrice: transactionForm.type === 'sell' ? buyPrice : undefined,
      sellPrice: transactionForm.type === 'sell' ? price : undefined,
      profitLoss: transactionForm.type === 'sell' ? profitLoss : undefined,
      profitRate: transactionForm.type === 'sell' ? profitRate : undefined,
      balanceAfter,
      date: transactionForm.date,
      timestamp: new Date().toISOString(),
      note: transactionForm.note || undefined
    };

    // 添加到交易列表
    setTransactions(prev => [...prev, newTransaction]);

    // 同时创建一条资金流水记录
    const fundAmount = transactionForm.type === 'buy' ? -(amount + fee) : (amount - fee);
    const newFundRecord: FundRecord = {
      id: Date.now().toString() + '_fund',
      date: transactionForm.date,
      type: transactionForm.type === 'buy' ? 'withdraw' : 'deposit',
      amount: fundAmount,
      balance: balanceAfter,
      description: `${transactionForm.type === 'buy' ? '买入' : '卖出'} ${transactionForm.stockCode} ${transactionForm.stockName} ${quantity}股`,
      timestamp: new Date().toISOString()
    };
    setFundRecords(prev => [...prev, newFundRecord]);

    // 重置表单
    setTransactionForm({
      type: 'buy',
      stockCode: '',
      stockName: '',
      quantity: '',
      price: '',
      buyPrice: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });

    alert('交易记录已添加');
  };

  const toggleStockExpand = (stockCode: string) => {
    setExpandedStock(expandedStock === stockCode ? null : stockCode);
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
          <p className="text-slate-600 dark:text-slate-400">
            基于涨幅、量比、换手率等指标筛选适合隔夜操作的优质标的
          </p>
        </div>

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="results">
              选股结果 ({allStocksWithTime.length})
            </TabsTrigger>
            <TabsTrigger value="funds">
              资金管理
            </TabsTrigger>
            <TabsTrigger value="settings">
              筛选条件
            </TabsTrigger>
          </TabsList>

          {/* 选股结果页面 */}
          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                  所有筛选结果
                </h2>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  共 <span className="font-bold text-blue-600">{allStocksWithTime.length}</span> 条筛选记录
                  <span className="ml-2 text-xs text-slate-500">
                    （按筛选时间倒序排列）
                  </span>
                </div>
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

            {allStocksWithTime.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="h-16 w-16 text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
                    暂无筛选结果
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm">
                    点击"刷新数据"按钮开始筛选
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="w-[150px]">筛选时间</TableHead>
                        <TableHead className="w-[120px]">股票代码</TableHead>
                        <TableHead className="w-[150px]">股票名称</TableHead>
                        <TableHead className="text-right">当前价格</TableHead>
                        <TableHead className="text-right">涨跌幅</TableHead>
                        <TableHead className="text-right">量比</TableHead>
                        <TableHead className="text-right">换手率</TableHead>
                        <TableHead className="text-right">流通市值</TableHead>
                        <TableHead className="text-right">评分</TableHead>
                        <TableHead className="w-[100px]">详情</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStocksWithTime.map((stock) => (
                        <React.Fragment key={`${stock.code}-${stock.filterTimestamp}`}>
                          <TableRow key={`${stock.code}-main`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                              {stock.filterTimestamp}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{stock.code}</TableCell>
                            <TableCell className="font-medium">{stock.name}</TableCell>
                            <TableCell className="text-right font-bold">¥{stock.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={stock.change > 0 ? 'default' : 'secondary'}
                                className={
                                  stock.change > 0
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                }
                              >
                                {stock.change > 0 ? '+' : ''}
                                {stock.change.toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{stock.volumeRatio.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{stock.turnoverRate.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{stock.marketCap}亿</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                {stock.score}分
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStockExpand(stock.code)}
                              >
                                {expandedStock === stock.code ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedStock === stock.code && (
                            <TableRow key={`${stock.code}-expanded`}>
                              <TableCell colSpan={9} className="p-4 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="space-y-4">
                                  {/* 技术指标 */}
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                      技术指标
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">MA5</div>
                                        <div className="font-semibold">¥{stock.ma5.toFixed(2)}</div>
                                      </div>
                                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">MA10</div>
                                        <div className="font-semibold">¥{stock.ma10.toFixed(2)}</div>
                                      </div>
                                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">MA20</div>
                                        <div className="font-semibold">¥{stock.ma20.toFixed(2)}</div>
                                      </div>
                                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">52周区间</div>
                                        <div className="font-semibold text-xs">
                                          ¥{stock.low52Week.toFixed(2)} - ¥{stock.high52Week.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 额外信息 */}
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                      其他信息
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-500">分时走势：</span>
                                        <Badge variant={stock.aboveAveragePrice ? "default" : "secondary"}>
                                          {stock.aboveAveragePrice ? '均价线上方' : '均价线下方'}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-500">20天涨停：</span>
                                        <Badge variant={stock.limitUpDays20 > 0 ? "default" : "secondary"}>
                                          {stock.limitUpDays20} 天
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 符合条件的原因 */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        符合条件
                                      </h4>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                                      <ul className="space-y-1 text-sm text-green-900 dark:text-green-100">
                                        {stock.reasons.map((reason, index) => (
                                          <li key={index} className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                            {reason}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 资金管理页面 */}
          <TabsContent value="funds" className="space-y-6">
            <div className="space-y-6">
              {/* 资金数据看板 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    资金及交易数据看板
                  </CardTitle>
                  <CardDescription>查看资金流转和交易统计信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">总本金</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        ¥{dashboardData.totalCapital.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-sm text-green-600 dark:text-green-400 mb-1">当前余额</div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        ¥{dashboardData.currentBalance.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">总盈利</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        ¥{dashboardData.totalProfit.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <div className="text-sm text-red-600 dark:text-red-400 mb-1">总亏损</div>
                      <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                        ¥{dashboardData.totalLoss.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">盈利率</div>
                      <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {dashboardData.profitRate.toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                      <div className="text-sm text-cyan-600 dark:text-cyan-400 mb-1">胜率</div>
                      <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                        {dashboardData.winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
                      <div className="text-sm text-pink-600 dark:text-pink-400 mb-1">盈亏比</div>
                      <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                        {dashboardData.profitLossRatio.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">交易次数</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {dashboardData.totalTransactions} 笔
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 操作列表 */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5" />
                        操作列表
                      </CardTitle>
                      <CardDescription>
                        资金流水和交易记录
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      导入数据
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="funds" className="w-full">
                    <TabsList>
                      <TabsTrigger value="funds">资金流水</TabsTrigger>
                      <TabsTrigger value="transactions">交易记录</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="funds" className="mt-4">
                      {fundRecords.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          暂无资金流水记录
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>类型</TableHead>
                                <TableHead>日期</TableHead>
                                <TableHead>描述</TableHead>
                                <TableHead className="text-right">金额</TableHead>
                                <TableHead className="text-right">余额</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fundRecords.map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell className="font-medium">
                                    {record.type === 'deposit' ? '入金' : 
                                     record.type === 'withdraw' ? '出金' : 
                                     record.type === 'profit' ? '盈利' : '亏损'}
                                  </TableCell>
                                  <TableCell>{record.date}</TableCell>
                                  <TableCell className="text-slate-600 dark:text-slate-400">{record.description}</TableCell>
                                  <TableCell className={`text-right font-bold ${record.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {record.amount > 0 ? '+' : ''}¥{record.amount.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    ¥{record.balance.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="transactions" className="mt-4">
                      {transactions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          暂无交易记录
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>股票代码</TableHead>
                                <TableHead>股票名称</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>日期</TableHead>
                                <TableHead className="text-right">数量</TableHead>
                                <TableHead className="text-right">价格</TableHead>
                                <TableHead className="text-right">成交额</TableHead>
                                <TableHead className="text-right">盈亏</TableHead>
                                <TableHead className="text-right">收益率</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                  <TableCell className="font-medium">{tx.stockCode}</TableCell>
                                  <TableCell>{tx.stockName}</TableCell>
                                  <TableCell>
                                    <Badge variant={tx.type === 'buy' ? 'default' : 'secondary'}>
                                      {tx.type === 'buy' ? '买入' : '卖出'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{tx.date}</TableCell>
                                  <TableCell className="text-right">{tx.quantity}</TableCell>
                                  <TableCell className="text-right">¥{tx.price.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">¥{tx.amount.toFixed(2)}</TableCell>
                                  <TableCell className={`text-right font-bold ${(tx.profitLoss ?? 0) > 0 ? 'text-green-600 dark:text-green-400' : (tx.profitLoss ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                    {tx.profitLoss !== undefined && tx.profitLoss !== 0 ? 
                                      (tx.profitLoss > 0 ? '+' : '') + '¥' + tx.profitLoss.toFixed(2) : 
                                      tx.type === 'buy' ? '-' : '¥0.00'}
                                  </TableCell>
                                  <TableCell className={`text-right font-semibold ${(tx.profitRate ?? 0) > 0 ? 'text-green-600 dark:text-green-400' : (tx.profitRate ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                    {tx.profitRate !== undefined && tx.profitRate !== 0 ? 
                                      (tx.profitRate > 0 ? '+' : '') + tx.profitRate.toFixed(2) + '%' : 
                                      tx.type === 'buy' ? '-' : '0.00%'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* 录入表单 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    录入资金和交易
                  </CardTitle>
                  <CardDescription>添加新的资金操作或交易记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="fund" className="w-full">
                    <TabsList>
                      <TabsTrigger value="fund">资金录入</TabsTrigger>
                      <TabsTrigger value="transaction">交易录入</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="fund" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>操作类型</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deposit">入金</SelectItem>
                              <SelectItem value="withdraw">出金</SelectItem>
                              <SelectItem value="transfer">转账</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>金额</Label>
                          <Input type="number" placeholder="0.00" />
                        </div>
                        <div>
                          <Label>日期</Label>
                          <Input type="date" />
                        </div>
                        <div>
                          <Label>备注</Label>
                          <Input placeholder="可选备注" />
                        </div>
                      </div>
                      <Button className="w-full">添加资金记录</Button>
                    </TabsContent>
                    
                    <TabsContent value="transaction" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>交易类型</Label>
                          <Select 
                            value={transactionForm.type} 
                            onValueChange={(value: 'buy' | 'sell') => 
                              setTransactionForm(prev => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy">买入</SelectItem>
                              <SelectItem value="sell">卖出</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>股票代码</Label>
                          <Input 
                            placeholder="如：000001" 
                            value={transactionForm.stockCode}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, stockCode: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>股票名称</Label>
                          <Input 
                            placeholder="如：平安银行" 
                            value={transactionForm.stockName}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, stockName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>数量（股）</Label>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            value={transactionForm.quantity}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>{transactionForm.type === 'buy' ? '买入价格' : '卖出价格'}</Label>
                          <Input 
                            type="number" 
                            placeholder="10.00" 
                            value={transactionForm.price}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, price: e.target.value }))}
                          />
                        </div>
                        {transactionForm.type === 'sell' && (
                          <div>
                            <Label>买入价格（用于计算盈亏）</Label>
                            <Input 
                              type="number" 
                              placeholder="10.00" 
                              value={transactionForm.buyPrice}
                              onChange={(e) => setTransactionForm(prev => ({ ...prev, buyPrice: e.target.value }))}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              输入当初的买入价以自动计算盈亏
                            </p>
                          </div>
                        )}
                        <div>
                          <Label>日期</Label>
                          <Input 
                            type="date" 
                            value={transactionForm.date}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>备注</Label>
                          <Input 
                            placeholder="可选备注" 
                            value={transactionForm.note}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, note: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      {/* 实时预览盈亏 */}
                      {transactionForm.type === 'sell' && transactionForm.price && transactionForm.buyPrice && transactionForm.quantity && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            盈亏预览
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-600 dark:text-slate-400">预计盈亏：</span>
                              <span className={`font-bold ml-2 ${
                                ((parseFloat(transactionForm.price) - parseFloat(transactionForm.buyPrice)) * parseInt(transactionForm.quantity)) > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                              }`}>
                                ¥{((parseFloat(transactionForm.price) - parseFloat(transactionForm.buyPrice)) * parseInt(transactionForm.quantity)).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-600 dark:text-slate-400">预计收益率：</span>
                              <span className={`font-bold ml-2 ${
                                ((parseFloat(transactionForm.price) - parseFloat(transactionForm.buyPrice)) / parseFloat(transactionForm.buyPrice) * 100) > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                              }`}>
                                {((parseFloat(transactionForm.price) - parseFloat(transactionForm.buyPrice)) / parseFloat(transactionForm.buyPrice) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <Button className="w-full" onClick={handleTransactionSubmit}>添加交易记录</Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
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
