
import { parseISO, isAfter, isEqual } from 'date-fns';

export const calculateAllAccountBalances = (allData) => {
    const { bankAccounts = [], income = [], expenses = [], transfers = [] } = allData;

    if (!bankAccounts.length) return [];

    const balanceMap = new Map(bankAccounts.map(acc => [acc.id, {
        ...acc,
        balanceDate: parseISO(acc.balance_date),
        current_balance: acc.initial_balance || 0
    }]));

    const allTransactions = [
        ...(income || []).map(t => ({ ...t, type: 'income', date: parseISO(t.date) })),
        ...(expenses || []).map(t => ({ ...t, type: 'expense', date: parseISO(t.date) })),
        ...(transfers || []).map(t => ({ ...t, type: 'transfer', date: parseISO(t.date) }))
    ];

    allTransactions.sort((a, b) => a.date - b.date);

    for (const transaction of allTransactions) {
        if (transaction.type === 'income') {
            const account = balanceMap.get(transaction.account_id);
            if (account && (isAfter(transaction.date, account.balanceDate) || isEqual(transaction.date, account.balanceDate))) {
                account.current_balance += transaction.amount;
            }
        } else if (transaction.type === 'expense') {
            const account = balanceMap.get(transaction.account_id);
            if (account && (isAfter(transaction.date, account.balanceDate) || isEqual(transaction.date, account.balanceDate))) {
                account.current_balance -= transaction.amount;
            }
        } else if (transaction.type === 'transfer') {
            const fromAccount = balanceMap.get(transaction.from_id);
            const toAccount = balanceMap.get(transaction.to_id);

            if (fromAccount && (isAfter(transaction.date, fromAccount.balanceDate) || isEqual(transaction.date, fromAccount.balanceDate))) {
                fromAccount.current_balance -= transaction.from_amount;
            }
            if (toAccount && (isAfter(transaction.date, toAccount.balanceDate) || isEqual(transaction.date, toAccount.balanceDate))) {
                toAccount.current_balance += transaction.to_amount;
            }
        }
    }
    
    return Array.from(balanceMap.values()).map(({ balanceDate, ...rest }) => rest);
};
