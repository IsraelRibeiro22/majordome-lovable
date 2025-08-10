import {
  parseISO,
  isWithinInterval,
  addDays,
  addWeeks,
  addMonths,
  format,
} from 'date-fns';

export const generateRecurringTransactions = (fixedItems, period, existingTransactions, type) => {
  const newTransactions = [];
  const { start: periodStart, end: periodEnd } = period;

  if (!fixedItems) return [];

  fixedItems.forEach(item => {
    let cursor = parseISO(item.start_date);
    const endDate = item.end_date ? parseISO(item.end_date) : null;

    while (cursor <= periodEnd && (!endDate || cursor <= endDate)) {
      if (isWithinInterval(cursor, { start: periodStart, end: periodEnd })) {
        const occurrenceDateStr = format(cursor, 'yyyy-MM-dd');
        const uniqueId = `${item.id}-${occurrenceDateStr}`;
        
        const alreadyExists = existingTransactions.some(
          t => t.fixed_item_id === item.id && t.date === occurrenceDateStr
        );

        if (!alreadyExists) {
          newTransactions.push({
            id: uniqueId,
            fixed_item_id: item.id,
            description: item.description,
            amount: item.amount,
            category: item.category,
            account_id: item.account_id,
            date: occurrenceDateStr,
            type,
            isRecurring: true,
          });
        }
      }

      if (cursor > periodEnd) break;

      const lastCursor = new Date(cursor.getTime());
      
      switch (item.recurrence) {
        case 'daily':
          cursor = addDays(cursor, 1);
          break;
        case 'weekly':
          cursor = addWeeks(cursor, 1);
          break;
        case 'biweekly':
          cursor = addWeeks(cursor, 2);
          break;
        case 'monthly':
          cursor = addMonths(cursor, 1);
          break;
        case 'bimonthly':
          cursor = addMonths(cursor, 2);
          break;
        case 'quarterly':
          cursor = addMonths(cursor, 3);
          break;
        case 'semiannually':
          cursor = addMonths(cursor, 6);
          break;
        case 'annually':
          cursor = addMonths(cursor, 12);
          break;
        default:
          cursor = addDays(cursor, 1_000_000);
          break;
      }
      if (cursor.getTime() === lastCursor.getTime()) {
        break;
      }
    }
  });

  return newTransactions;
};