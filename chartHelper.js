
import { parseISO, getYear, isWithinInterval, startOfYear, endOfYear, addDays, addWeeks, addMonths, format, subDays, startOfMonth, endOfMonth, isBefore } from 'date-fns';

const generateRecurrentTransactions = (fixedItems, accountsInCurrency, year, today) => {
    const transactions = [];
    const accountIdsInCurrency = accountsInCurrency.map(a => a.id);
    const yearEnd = endOfYear(new Date(year, 0, 1));

    (fixedItems || []).forEach(item => {
        if (!accountIdsInCurrency.includes(item.account_id)) return;

        let currentDate = parseISO(item.start_date);
        const itemEndDate = item.end_date ? parseISO(item.end_date) : null;

        while (currentDate <= yearEnd && (!itemEndDate || currentDate <= itemEndDate)) {
            if (getYear(currentDate) === year && currentDate > today) {
                transactions.push({
                    ...item,
                    id: `${item.id}-${format(currentDate, 'yyyy-MM-dd')}`,
                    date: format(currentDate, 'yyyy-MM-dd'),
                    currency: accountsInCurrency.find(a => a.id === item.account_id)?.currency,
                    isProjected: true,
                    fixed_item_id: item.id,
                });
            }
            
            if (currentDate > yearEnd) break;

            switch (item.recurrence) {
                case 'daily': currentDate = addDays(currentDate, 1); break;
                case 'weekly': currentDate = addWeeks(currentDate, 1); break;
                case 'biweekly': currentDate = addWeeks(currentDate, 2); break;
                case 'monthly': currentDate = addMonths(currentDate, 1); break;
                case 'bimonthly': currentDate = addMonths(currentDate, 2); break;
                case 'quarterly': currentDate = addMonths(currentDate, 3); break;
                case 'semiannually': currentDate = addMonths(currentDate, 6); break;
                case 'annually': currentDate = addMonths(currentDate, 12); break;
                default: currentDate = addMonths(currentDate, 12 * 10); break;
            }
        }
    });
    return transactions;
};

export const getChartData = ({ allData, selectedCurrency, selectedYear, getPeriodsForYear, formatPeriod, getPeriodLabel, settings, locale }) => {
    if (!allData || !allData.bankAccounts || !selectedCurrency) {
        return [];
    }

    const accountsInCurrency = allData.bankAccounts.filter(acc => acc.currency === selectedCurrency);
    if (accountsInCurrency.length === 0) return [];
    
    const accountIdsInCurrency = new Set(accountsInCurrency.map(a => a.id));

    const today = new Date();
    const yearStartDate = startOfYear(new Date(selectedYear, 0, 1));
    const previousDay = subDays(yearStartDate, 1);

    const balanceAtStartOfYear = accountsInCurrency.reduce((sum, acc) => {
        const balanceDate = parseISO(acc.balance_date);
        let accountStartBalance = acc.initial_balance || 0;

        if (isBefore(previousDay, balanceDate)) {
            return sum + accountStartBalance;
        }

        const transactionsBeforeYear = [
            ...(allData.income || []).filter(tx => tx.account_id === acc.id).map(tx => ({ ...tx, amount: tx.amount, date: parseISO(tx.date) })),
            ...(allData.expenses || []).filter(tx => tx.account_id === acc.id).map(tx => ({ ...tx, amount: -tx.amount, date: parseISO(tx.date) })),
            ...(allData.transfers || []).filter(tx => tx.to_account_id === acc.id).map(tx => ({ ...tx, amount: tx.to_amount, date: parseISO(tx.date) })),
            ...(allData.transfers || []).filter(tx => tx.from_account_id === acc.id).map(tx => ({ ...tx, amount: -tx.from_amount, date: parseISO(tx.date) })),
        ].filter(tx => isWithinInterval(tx.date, { start: balanceDate, end: previousDay }));

        accountStartBalance += transactionsBeforeYear.reduce((s, tx) => s + tx.amount, 0);

        return sum + accountStartBalance;
    }, 0);


    const projectedExpenses = generateRecurrentTransactions(allData.fixedExpenses, accountsInCurrency, selectedYear, today);

    const combinedIncomes = [...(allData.income || [])];
    const combinedExpenses = [...(allData.expenses || []), ...projectedExpenses];

    const periods = getPeriodsForYear(selectedYear);
    let runningBalance = balanceAtStartOfYear;

    return periods.map(period => {
        const { start, end } = period;

        const incomeTransactions = combinedIncomes.filter(tx => accountIdsInCurrency.has(tx.account_id) && isWithinInterval(parseISO(tx.date), { start, end })).map(tx => ({ ...tx, type: 'income' }));
        const expenseTransactions = combinedExpenses.filter(tx => accountIdsInCurrency.has(tx.account_id) && isWithinInterval(parseISO(tx.date), { start, end })).map(tx => ({ ...tx, type: 'expense' }));
        
        const transfersIn = (allData.transfers || []).filter(tx => accountIdsInCurrency.has(tx.to_account_id) && isWithinInterval(parseISO(tx.date), { start, end }));
        const transfersOut = (allData.transfers || []).filter(tx => accountIdsInCurrency.has(tx.from_account_id) && isWithinInterval(parseISO(tx.date), { start, end }));

        const periodIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        
        const periodFixedExpenses = expenseTransactions.filter(tx => tx.fixed_item_id != null);
        const periodCommonExpenses = expenseTransactions.filter(tx => tx.fixed_item_id == null);

        const fixedExpensesAmount = periodFixedExpenses.reduce((sum, tx) => sum + tx.amount, 0);
        const commonExpensesAmount = periodCommonExpenses.reduce((sum, tx) => sum + tx.amount, 0);
        
        const periodTransfersIn = transfersIn.reduce((sum, tx) => sum + tx.to_amount, 0);
        const periodTransfersOut = transfersOut.reduce((sum, tx) => sum + tx.from_amount, 0);

        runningBalance += periodIncome + periodTransfersIn - fixedExpensesAmount - commonExpensesAmount - periodTransfersOut;

        return {
            month: getPeriodLabel(settings.periodView, start, end, locale),
            fullPeriod: formatPeriod(period),
            income: periodIncome,
            expenses: fixedExpensesAmount + commonExpensesAmount,
            fixedExpenses: fixedExpensesAmount,
            commonExpenses: commonExpensesAmount,
            balance: Number(runningBalance),
            incomeTransactions,
            expenseTransactions,
            isProjected: start > today,
        };
    });
};
