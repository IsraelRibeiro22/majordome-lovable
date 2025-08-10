
import React, { useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import SavingsGoals from '@/components/SavingsGoals';
import BiblicalWisdom from '@/components/BiblicalWisdom';
import QuickActions from '@/components/QuickActions';
import BankAccounts from '@/components/BankAccounts';
import SavingsEvolutionChart from '@/components/SavingsEvolutionChart';
import { useTranslation } from 'react-i18next';
import { useDate } from '@/contexts/DateContext';
import DateNavigator from '@/components/DateNavigator';
import FinancialOverview from '@/components/FinancialOverview';
import TransactionsHub from '@/components/TransactionsHub';
import FixedExpensesManager from '@/components/FixedExpensesManager';
import { parseISO, isWithinInterval } from 'date-fns';
import { generateRecurringTransactions } from '@/lib/transactionGenerator';
import DateRangePicker from '@/components/DateRangePicker';

const Dashboard = ({ settings, setSettings, allData, updateAllData }) => {
  const { t } = useTranslation('common');
  const { setDateRange, currentPeriod, formatPeriod } = useDate();
  const { accountMap } = allData;

  const handleRecurringTransactions = useCallback(() => {
    const { start, end } = currentPeriod || {};
    if (!start || !end) return;

    const generatedExpenses = generateRecurringTransactions(
      allData.fixedExpenses || [],
      currentPeriod,
      allData.expenses || [],
      'expense'
    );

    if (generatedExpenses.length > 0) {
      updateAllData({
        expenses: [...(allData.expenses || []), ...generatedExpenses],
      }, { operation: 'recalculate_balances' });
    }
  }, [allData.fixedExpenses, allData.expenses, currentPeriod, updateAllData]);

  useEffect(() => {
    handleRecurringTransactions();
  }, [currentPeriod, handleRecurringTransactions]);
  
  const processedData = useMemo(() => {
    const { start, end } = currentPeriod || {};
    if (!start || !end || !accountMap) {
        return {
            ...allData,
            incomeInPeriod: [],
            expensesInPeriod: [],
            incomeByCurrency: {},
            expensesByCurrency: {},
        };
    }
    
    const filterByDate = (item) => isWithinInterval(parseISO(item.date), { start, end });
    
    const enrichWithAccountInfo = (transaction) => {
      const account = accountMap.get(transaction.account_id);
      return {
        ...transaction,
        accountName: account?.name || t('unknownAccount'),
        currency: account?.currency || 'BRL'
      }
    };

    const incomeWithAccountNames = (allData.income || []).map(enrichWithAccountInfo);
    const expensesWithAccountNames = (allData.expenses || []).map(enrichWithAccountInfo);

    const incomeInPeriod = incomeWithAccountNames.filter(filterByDate);
    const expensesInPeriod = expensesWithAccountNames.filter(filterByDate);

    const reduceByCurrency = (acc, item) => {
        if (!acc[item.currency]) acc[item.currency] = 0;
        acc[item.currency] += item.amount;
        return acc;
    };
    
    const incomeByCurrency = incomeInPeriod.reduce(reduceByCurrency, {});
    const expensesByCurrency = expensesInPeriod.reduce(reduceByCurrency, {});

    const totalIncomeByCurrency = incomeWithAccountNames.reduce(reduceByCurrency, {});

    return {
        ...allData,
        income: incomeWithAccountNames,
        expenses: expensesWithAccountNames,
        incomeInPeriod,
        expensesInPeriod,
        incomeByCurrency,
        expensesByCurrency,
        incomeByCurrencyAllTime: totalIncomeByCurrency,
    };
  }, [allData, currentPeriod, t, accountMap]);
  
  return (
    <div className="min-h-screen text-foreground">
      <Header userData={processedData} settings={settings} setSettings={setSettings} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('financialDashboard')}</h1>
            <div className="w-full sm:w-auto sm:max-w-lg flex items-center gap-2">
                {settings.periodView === 'custom_range' ? (
                     <DateRangePicker date={{ from: currentPeriod.start, to: currentPeriod.end }} onDateChange={setDateRange} />
                ) : (
                    <>
                        <DateNavigator />
                        <div className="text-center sm:text-right font-semibold text-lg text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-gray-100 dark:bg-slate-800 flex-grow">
                            {formatPeriod(currentPeriod)}
                        </div>
                    </>
                )}
            </div>
        </div>

        <FinancialOverview userData={processedData} settings={settings} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <SavingsEvolutionChart allData={processedData} settings={settings} updateAllData={updateAllData} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            className="lg:col-span-2 space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <BankAccounts allData={allData} updateAllData={updateAllData} settings={settings} />
            <TransactionsHub allData={allData} updateAllData={updateAllData} />
            <FixedExpensesManager allData={allData} updateAllData={updateAllData} />
          </motion.div>

          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {settings.visibleComponents?.savingsGoals && <SavingsGoals allData={allData} updateAllData={updateAllData} />}
            {settings.visibleComponents?.biblicalWisdom && <BiblicalWisdom />}
            <QuickActions allData={allData} settings={settings} updateAllData={updateAllData} />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
