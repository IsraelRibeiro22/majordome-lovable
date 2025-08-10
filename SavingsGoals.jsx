import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Trash2, Edit3, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import GoalForm from '@/components/savings/GoalForm';
import ContributeToGoalDialog from '@/components/savings/ContributeToGoalDialog';

const SavingsGoals = ({ allData, updateAllData }) => {
  const { t, i18n } = useTranslation(['savings', 'common', 'toast']);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const { toast } = useToast();

  const handleSaveGoal = (formState) => {
    if (!formState.name || !formState.target_amount || !formState.accountId) {
      toast({
        title: t('toast:requiredFields'),
        description: t('toast:fillNameAmountAndAccount'),
        variant: "destructive"
      });
      return;
    }

    const goalData = {
      ...formState,
      target_amount: parseFloat(formState.target_amount),
      current_amount: parseFloat(formState.current_amount) || 0,
      accountId: parseInt(formState.accountId)
    };
    
    let updatedGoals;
    if (editingGoal) {
      updatedGoals = allData.savingsGoals.map(g => g.id === editingGoal.id ? { ...g, ...goalData } : g);
      toast({ title: t('toast:goalUpdated'), description: t('toast:goalUpdatedSuccess') });
    } else {
      updatedGoals = [...(allData.savingsGoals || []), { ...goalData, id: Date.now() }];
      toast({ title: t('toast:goalCreated'), description: t('toast:goalCreatedSuccess') });
    }
    
    updateAllData({ savingsGoals: updatedGoals });
    cancelEdit();
  };
  
  const handleEditClick = (goal) => {
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingGoal(null);
    setShowAddForm(false);
  };

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = allData.savingsGoals.filter(goal => goal.id !== goalId);
    updateAllData({ savingsGoals: updatedGoals });
    toast({ title: t('toast:goalRemoved'), description: t('toast:goalRemovedSuccess') });
  };
  
  const handleContribute = ({ goalId, accountId, amount }) => {
    const goal = allData.savingsGoals.find(g => g.id === goalId);
    const account = allData.bankAccounts.find(acc => acc.id === accountId);
    const numericAmount = parseFloat(amount);
    
    if (!goal || !account) {
      toast({ title: t('toast:error'), description: t('toast:goalOrAccountNotFound'), variant: 'destructive' });
      return;
    }
    
    if (account.current_balance < numericAmount) {
      toast({ title: t('toast:insufficientFunds'), description: t('toast:insufficientFundsMessage'), variant: 'destructive' });
      return;
    }

    const updatedGoals = allData.savingsGoals.map(g => 
        g.id === goalId ? { ...g, current_amount: g.current_amount + amount } : g
    );

    const newExpense = {
      id: `exp-goal-${Date.now()}`,
      description: `${t('savings:goals.contributionToGoal')} "${goal.name}"`,
      amount: amount,
      date: new Date().toISOString(),
      account_id: accountId,
      category: "Metas de Poupança",
      type: 'expense'
    };

    updateAllData({
      expenses: [...(allData.expenses || []), newExpense],
      savingsGoals: updatedGoals
    });

    toast({
      title: t('toast:contributionSuccess'),
      description: `${formatCurrency(amount, account.currency)} ${t('toast:contributedTo')} ${goal.name}.`
    });

    setContributingGoal(null);
  };

  const formatCurrency = (value, currency = 'BRL') => {
    if (value === undefined || value === null) return '';
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'pt-BR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'pt-BR';
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString(locale);
  };

  const getProgressPercentage = (current, target) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };
  
  const getAccountInfo = (id) => allData.bankAccounts.find(acc => acc.id === id);

  return (
    <>
      <motion.div
        className="financial-card rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('savings:goals.title')}</h2>
          {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} size="sm" className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 dark:from-purple-600 dark:to-violet-700 dark:hover:from-purple-700 dark:hover:to-violet-800">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('savings:goals.newGoal')}
              </Button>
          )}
        </div>

        {showAddForm && (
          <GoalForm 
            goal={editingGoal}
            onSave={handleSaveGoal}
            onCancel={cancelEdit}
            bankAccounts={allData.bankAccounts || []}
          />
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {allData.savingsGoals && allData.savingsGoals.length > 0 ? (
            allData.savingsGoals.map((goal, index) => {
              const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
              const isCompleted = progress >= 100;
              const accountInfo = getAccountInfo(goal.accountId);

              return (
                <motion.div
                  key={goal.id}
                  className="p-4 bg-white/30 dark:bg-slate-800/50 rounded-lg border border-white/20 dark:border-slate-700"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className={`h-4 w-4 ${isCompleted ? 'text-green-500' : 'text-purple-500 dark:text-purple-400'}`} />
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">{goal.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(goal.current_amount, accountInfo?.currency)} {t('savings:goals.of')} {formatCurrency(goal.target_amount, accountInfo?.currency)}
                      </p>
                      {goal.deadline && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {t('savings:goals.deadlineLabel')}: {formatDate(goal.deadline)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(goal)} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 h-6 w-6">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 h-6 w-6">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-purple-500 dark:bg-purple-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <span>{progress.toFixed(1)}% {t('savings:goals.completed')}</span>
                      {isCompleted ? (
                        <span className="text-green-500 font-medium">{t('savings:goals.goalAchieved')}</span>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setContributingGoal(goal)}
                          className="text-purple-600 border-purple-400 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-900/40"
                        >
                          <PiggyBank className="h-3 w-3 mr-1" />
                          {t('savings:goals.contribute')}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">{t('savings:goals.noGoalsDefined')}</p>
              <p className="text-xs">{t('savings:goals.createSavingsGoals')}</p>
            </div>
          )}
        </div>
      </motion.div>
      {contributingGoal && (
        <ContributeToGoalDialog
          goal={contributingGoal}
          bankAccounts={allData.bankAccounts}
          onContribute={handleContribute}
          onOpenChange={() => setContributingGoal(null)}
        />
      )}
    </>
  );
};

export default SavingsGoals;