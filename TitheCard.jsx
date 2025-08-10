import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

const TitheCard = ({ allData, updateUserData, selectedDate: propSelectedDate }) => {
  const { t, i18n } = useTranslation(['tithe', 'common', 'toast']);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState({
    month: propSelectedDate.month,
    year: propSelectedDate.year,
  });

  const monthYearKey = `${deliveryDate.month}-${deliveryDate.year}`;
  const displayMonthYearKey = `${propSelectedDate.month}-${propSelectedDate.year}`;

  const { incomeByCurrency, tithePaidByCurrency } = useMemo(() => {
    const incomeInMonth = allData.income.filter(i => {
        const date = new Date(i.date);
        return date.getMonth() === deliveryDate.month && date.getFullYear() === deliveryDate.year;
    });

    const incomeByCurrency = incomeInMonth.reduce((acc, i) => {
        const account = allData.bankAccounts.find(acc => acc.id === i.accountId);
        if (account) {
            acc[account.currency] = (acc[account.currency] || 0) + i.amount;
        }
        return acc;
    }, {});

    const tithePaidInMonth = allData.expenses.filter(e => {
        const date = new Date(e.date);
        return e.category === 'dizimo' && date.getMonth() === deliveryDate.month && date.getFullYear() === deliveryDate.year;
    });

    const tithePaidByCurrency = tithePaidInMonth.reduce((acc, e) => {
        const account = allData.bankAccounts.find(acc => acc.id === e.accountId);
        if (account) {
            acc[account.currency] = (acc[account.currency] || 0) + e.amount;
        }
        return acc;
    }, {});

    return { incomeByCurrency, tithePaidByCurrency };
  }, [allData, deliveryDate]);

  const formatCurrency = (value, currency) => {
    if (!currency) return 'N/A';
    try {
        return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'pt-BR', {
        style: 'currency',
        currency: currency,
        }).format(value);
    } catch (e) {
        return 'Error';
    }
  };

  const allCurrencies = new Set([
      ...Object.keys(incomeByCurrency || {}),
      ...Object.keys(tithePaidByCurrency || {})
  ]);

  const titheEntries = Array.from(allCurrencies).map(currency => {
      const totalIncome = incomeByCurrency?.[currency] || 0;
      const titheDue = totalIncome * 0.10;
      const tithePaid = tithePaidByCurrency?.[currency] || 0;
      return { currency, totalIncome, titheDue, tithePaid };
  }).filter(entry => entry.currency !== 'undefined' && entry.totalIncome > 0);

  const handleDeliverTithe = () => {
    if (!selectedAccount) {
        toast({ title: t('toast:requiredFields'), description: t('selectAccountError'), variant: 'destructive' });
        return;
    }

    const account = allData.bankAccounts.find(acc => acc.id === parseInt(selectedAccount));
    const currency = account.currency;
    const entry = titheEntries.find(e => e.currency === currency);
    
    if (!entry) {
        toast({ title: t('noTitheRegistered'), variant: 'destructive' });
        return;
    }

    const amountToPay = entry.titheDue - entry.tithePaid;

    if (amountToPay <= 0) {
        toast({ title: t('alreadyPaidTitle'), description: t('alreadyPaidDescription'), variant: 'default' });
        return;
    }
    
    if (account.balance < amountToPay) {
        toast({ title: t('toast:insufficientBalance'), description: t('toast:insufficientBalanceError'), variant: 'destructive' });
        return;
    }

    const newExpense = {
        id: Date.now(),
        description: `${t('titheFor')} ${t(`common:months.${deliveryDate.month}`)}/${deliveryDate.year}`,
        amount: amountToPay,
        category: 'dizimo',
        date: new Date(deliveryDate.year, deliveryDate.month, new Date().getDate()).toISOString().split('T')[0],
        accountId: account.id,
        isFixed: false,
    };

    const updatedExpenses = [...allData.expenses, newExpense];
    const updatedAccounts = allData.bankAccounts.map(acc => 
        acc.id === account.id ? { ...acc, balance: acc.balance - amountToPay } : acc
    );
    const updatedTitheDelivered = { ...allData.titheDelivered, [monthYearKey]: true };

    updateUserData({ expenses: updatedExpenses, bankAccounts: updatedAccounts, titheDelivered: updatedTitheDelivered });
    
    toast({ title: t('successTitle'), description: t('successDescription') });
    setIsModalOpen(false);
    setSelectedAccount('');
  };

  const isTitheDeliveredForDisplay = allData.titheDelivered?.[displayMonthYearKey];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: t(`common:months.${i}`),
  }));

  return (
    <>
      <motion.div
        className="financial-card rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-950/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('title')}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('honorLord')}</p>
            </div>
          </div>
        </div>

        {isTitheDeliveredForDisplay ? (
            <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">{t('deliveredTitle')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('deliveredMessage')}</p>
            </div>
        ) : (
            <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                <p>{t('notDeliveredMessage')}</p>
            </div>
        )}

        <Button onClick={() => {
            setDeliveryDate({ month: propSelectedDate.month, year: propSelectedDate.year });
            setIsModalOpen(true);
        }} className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white">
            <Send className="h-4 w-4 mr-2" />
            {t('deliverButton')}
        </Button>

        <div className="mt-4 text-center text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold">{t('malachiQuote')}</p>
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deliverButton')}</DialogTitle>
            <DialogDescription>{t('modalDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('selectMonth')}</label>
                <div className="grid grid-cols-2 gap-2">
                    <select
                        name="month"
                        value={deliveryDate.month}
                        onChange={(e) => setDeliveryDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                    </select>
                    <select
                        name="year"
                        value={deliveryDate.year}
                        onChange={(e) => setDeliveryDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                {titheEntries.length > 0 ? (
                titheEntries.map(({ currency, titheDue, tithePaid }) => {
                    const remaining = titheDue - tithePaid;
                    return (
                        <div key={currency} className="bg-gray-100 dark:bg-slate-800/50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('titheIn')} {currency}:</span>
                                <span className="text-lg font-bold text-amber-800 dark:text-amber-400">
                                    {formatCurrency(titheDue, currency)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400">{t('delivered')}:</span>
                                <span className="font-medium text-green-700 dark:text-green-400">{formatCurrency(tithePaid, currency)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-1">
                                <span className="text-gray-600 dark:text-gray-400">{t('missing')}:</span>
                                <span className="font-medium text-red-700 dark:text-red-400">{formatCurrency(Math.max(0, remaining), currency)}</span>
                            </div>
                        </div>
                    )
                })
                ) : (
                <div className="text-center text-gray-600 dark:text-gray-400 p-2">
                    {t('noTitheRegistered')}
                </div>
                )}
            </div>

            <div>
                <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('selectAccount')}</label>
                <select
                  id="account-select"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="" disabled>{t('common:selectAccount')}</option>
                  {allData.bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance, acc.currency)})</option>)}
                </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common:cancel')}</Button>
            <Button onClick={handleDeliverTithe} className="bg-yellow-500 hover:bg-yellow-600" disabled={titheEntries.length === 0}>{t('common:confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TitheCard;