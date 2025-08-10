import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Repeat, Calendar, Landmark, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FixedExpenseDialog from '@/components/fixed/FixedExpenseDialog';
import { useTranslation } from 'react-i18next';
import { useDate } from '@/contexts/DateContext';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FixedExpensesManager = ({ allData, updateAllData }) => {
  const { t, i18n } = useTranslation(['fixed', 'common', 'toast']);
  const { formatDate } = useDate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleAddNew = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDelete = (expenseId) => {
    updateAllData({}, { operation: 'delete', table: 'fixedExpenses', originalRecord: { id: expenseId } });
    toast({
      title: t('expenses.toast.removedTitle'),
      description: t('expenses.toast.removedDesc'),
    });
  };

  const sortedFixedExpenses = useMemo(() => {
    return [...(allData.fixedExpenses || [])].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }, [allData.fixedExpenses]);

  const formatCurrency = (value, currency = 'BRL') => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'pt-BR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };
  
  const getAccountName = (id) => allData.bankAccounts.find(acc => acc.id === id)?.name || 'N/A';
  const getAccountCurrency = (id) => allData.bankAccounts.find(acc => acc.id === id)?.currency || 'BRL';

  return (
    <>
      <motion.div 
        className="financial-card rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('expenses.title')}</h2>
          <Button onClick={handleAddNew} className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            {t('expenses.add')}
          </Button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {sortedFixedExpenses.length > 0 ? (
            sortedFixedExpenses.map(expense => (
              <motion.div
                key={expense.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/30 dark:bg-slate-800/50 rounded-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex-1 mb-2 sm:mb-0">
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{expense.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="flex items-center"><Tag className="h-4 w-4 mr-1"/>{expense.category}</span>
                    <span className="flex items-center"><Landmark className="h-4 w-4 mr-1"/>{getAccountName(expense.account_id)}</span>
                    <span className="flex items-center"><Repeat className="h-4 w-4 mr-1"/>{t(`recurrenceOptions.${expense.recurrence}`)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                     <span className="flex items-center"><Calendar className="h-4 w-4 mr-1 text-green-500"/>{t('expenses.startsOn')}: {formatDate(expense.start_date)}</span>
                    {expense.end_date && <span className="flex items-center"><Calendar className="h-4 w-4 mr-1 text-red-500"/>{t('expenses.endsOn')}: {formatDate(expense.end_date)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge variant="destructive" className="text-lg">{formatCurrency(expense.amount, getAccountCurrency(expense.account_id))}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                    <Edit className="h-4 w-4 text-blue-500"/>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500"/>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('toast:areYouSure')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('expenses.toast.deleteWarning')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(expense.id)}>{t('common:delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p>{t('expenses.noData')}</p>
              <p className="text-sm">{t('expenses.clickToAdd')}</p>
            </div>
          )}
        </div>
      </motion.div>

      <FixedExpenseDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        expense={editingExpense}
        allData={allData}
        updateAllData={updateAllData}
      />
    </>
  );
};

export default FixedExpensesManager;