import { parseISO, addDays, format, isBefore, isEqual, compareAsc, addMonths } from 'date-fns';

const getRecurrenceFunction = (recurrence) => {
    switch (recurrence) {
        case 'daily': return (date) => addDays(date, 1);
        case 'weekly': return (date) => addDays(date, 7);
        case 'biweekly': return (date) => addDays(date, 14);
        case 'monthly':
            return (date) => {
                const newDate = addMonths(date, 1);
                // Handle end of month by getting the last day of the new month
                const lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                if (date.getDate() > lastDayOfMonth) {
                    return new Date(newDate.getFullYear(), newDate.getMonth(), lastDayOfMonth);
                }
                return new Date(newDate.getFullYear(), newDate.getMonth(), date.getDate());
            };
        case 'bimonthly': return (date) => addMonths(date, 2);
        case 'quarterly': return (date) => addMonths(date, 3);
        case 'semiannually': return (date) => addMonths(date, 6);
        case 'annually': return (date) => addMonths(date, 12);
        default: return (date) => date;
    }
}

export const getForecast = (allData, accountId, days) => {
    const account = allData.bankAccounts.find(acc => acc.id === accountId);
    if (!account) return { dailySummary: [], transactions: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const forecastEndDate = addDays(today, days - 1);

    const fixedExpenses = (allData.fixedExpenses || [])
        .filter(e => e.account_id === accountId);

    // In the future, fixedIncomes can be added here
    const fixedIncomes = []; 

    let allProjectedTransactions = [];

    const processFixedItems = (items, type) => {
        items.forEach(item => {
            let cursor = parseISO(item.start_date);
            cursor.setHours(0, 0, 0, 0);
            const endDate = item.end_date ? parseISO(item.end_date) : null;
            if (endDate) endDate.setHours(0, 0, 0, 0);
            
            const addTime = getRecurrenceFunction(item.recurrence);

            // Fast-forward cursor to today or later if it starts in the past
            if (isBefore(cursor, today)) {
                 while(isBefore(cursor, today) && (!endDate || isBefore(cursor, endDate) || isEqual(cursor, endDate))) {
                    const nextCursor = addTime(cursor);
                    // Break if recurrence function is not advancing
                    if(isEqual(nextCursor, cursor)) break;
                    cursor = nextCursor;
                }
            }
            
            while ((isBefore(cursor, forecastEndDate) || isEqual(cursor, forecastEndDate)) && (!endDate || isBefore(cursor, endDate) || isEqual(cursor, endDate))) {
                allProjectedTransactions.push({
                    ...item,
                    type,
                    date: format(cursor, 'yyyy-MM-dd'),
                    id: `${item.id}-${format(cursor, 'yyyyMMdd')}` // Unique ID for projected instance
                });

                const nextCursor = addTime(cursor);
                if(isEqual(nextCursor, cursor)) break;
                cursor = nextCursor;
            }
        });
    };

    processFixedItems(fixedExpenses, 'expense');
    processFixedItems(fixedIncomes, 'income');
    
    allProjectedTransactions.sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

    let currentBalance = account.current_balance;
    const transactionsWithBalance = allProjectedTransactions.map(tx => {
        if (tx.type === 'income') {
            currentBalance += tx.amount;
        } else {
            currentBalance -= tx.amount;
        }
        return { ...tx, balance: currentBalance };
    });

    // --- For Chart ---
    const dailySummaryMap = new Map();
    for (let i = 0; i < days; i++) {
        const currentDate = addDays(today, i);
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        dailySummaryMap.set(dateKey, {
            date: dateKey,
            balance: 0, // Placeholder
            transactions: [],
            currency: account.currency
        });
    }

    let runningBalanceForChart = account.current_balance;
    const chartTransactions = [...transactionsWithBalance];

    for (const [dateKey, dayData] of dailySummaryMap.entries()) {
        const transactionsForDay = chartTransactions.filter(tx => tx.date === dateKey);
        dayData.transactions = transactionsForDay;
        
        const endOfDayBalance = transactionsForDay.length > 0 
            ? transactionsForDay[transactionsForDay.length - 1].balance
            : runningBalanceForChart;

        dayData.balance = endOfDayBalance;
        runningBalanceForChart = endOfDayBalance;
    }
    
    return {
        dailySummary: Array.from(dailySummaryMap.values()),
        transactions: transactionsWithBalance
    };
};