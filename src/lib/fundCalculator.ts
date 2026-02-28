import { FundRecord, Transaction, FundDashboard } from '@/types/fund';

// 计算资金看板数据
export function calculateFundDashboard(
  fundRecords: FundRecord[],
  transactions: Transaction[]
): FundDashboard {
  // 计算总本金（存入总和）
  const totalCapital = fundRecords
    .filter(r => r.type === 'deposit')
    .reduce((sum, r) => sum + r.amount, 0);

  // 计算当前余额
  const currentBalance = fundRecords.length > 0
    ? fundRecords[fundRecords.length - 1].balance
    : 0;

  // 计算总盈利和总亏损（从交易记录中获取）
  const sellTransactions = transactions.filter(t => t.type === 'sell' && t.profitLoss !== undefined);
  
  const totalProfit = sellTransactions
    .filter(t => t.profitLoss! > 0)
    .reduce((sum, t) => sum + (t.profitLoss || 0), 0);

  const totalLoss = sellTransactions
    .filter(t => t.profitLoss! < 0)
    .reduce((sum, t) => sum + Math.abs(t.profitLoss || 0), 0);

  // 计算盈利率
  const profitRate = totalCapital > 0 ? ((currentBalance - totalCapital) / totalCapital) * 100 : 0;

  // 计算交易统计
  const winTransactions = sellTransactions.filter(t => t.profitLoss! > 0).length;
  const lossTransactions = sellTransactions.filter(t => t.profitLoss! < 0).length;
  const totalTransactions = winTransactions + lossTransactions;

  // 计算胜率
  const winRate = totalTransactions > 0 ? (winTransactions / totalTransactions) * 100 : 0;

  // 计算盈亏比
  const avgWin = winTransactions > 0 ? totalProfit / winTransactions : 0;
  const avgLoss = lossTransactions > 0 ? totalLoss / lossTransactions : 0;
  const profitLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  return {
    totalCapital,
    currentBalance,
    totalProfit,
    totalLoss,
    profitRate: parseFloat(profitRate.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(1)),
    totalTransactions,
    winTransactions,
    lossTransactions,
    profitLossRatio: parseFloat(profitLossRatio.toFixed(2))
  };
}

// 添加资金记录
export function addFundRecord(
  records: FundRecord[],
  record: Omit<FundRecord, 'id' | 'balance' | 'timestamp'>
): FundRecord[] {
  const lastBalance = records.length > 0 ? records[records.length - 1].balance : 0;
  const newRecord: FundRecord = {
    ...record,
    id: Date.now().toString(),
    balance: lastBalance + record.amount,
    timestamp: new Date().toISOString()
  };
  return [...records, newRecord];
}

// 添加交易记录
export function addTransaction(
  transactions: Transaction[],
  transaction: Omit<Transaction, 'id' | 'timestamp'>
): Transaction[] {
  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  };
  return [...transactions, newTransaction];
}
