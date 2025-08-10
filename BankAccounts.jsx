import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Plus, Trash2, Edit3, Save, X, ShieldCheck, ShieldAlert, AlertTriangle, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/ui/dialog';
import FinancialViewsDialog from '@/components/FinancialViewsDialog';
import DatePicker from '@/components/DatePicker';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BankAccounts = ({ allData, updateAllData, settings }) => {
    const { t, i18n } = useTranslation(['accounts', 'common', 'toast', 'statement', 'forecast']);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [isViewsOpen, setIsViewsOpen] = useState(false);
    const [initialView, setInitialView] = useState('statement');
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [newAccount, setNewAccount] = useState({
        name: '',
        initial_balance: '',
        currency: 'BRL',
        min_balance: '',
        balance_date: new Date(),
    });
    const { toast } = useToast();

    const formatCurrency = (value, currency = 'BRL') => {
        const locale = i18n.language === 'fr' ? 'fr-FR' : 'pt-BR';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(value);
    };

    const handleEditClick = (account) => {
        setEditingAccount(account);
        setNewAccount({
            name: account.name,
            initial_balance: account.initial_balance,
            currency: account.currency,
            min_balance: account.min_balance || '',
            balance_date: account.balance_date ? new Date(account.balance_date) : new Date(),
        });
    };
    
    const handleCancelEdit = () => {
        setEditingAccount(null);
        setShowAddForm(false);
        setNewAccount({ name: '', initial_balance: '', currency: 'BRL', min_balance: '', balance_date: new Date() });
    };

    const handleSaveAccount = () => {
        if (!newAccount.name || newAccount.initial_balance === '' || !newAccount.balance_date) {
            toast({ title: t('toast:requiredFields'), description: t('toast:fillAllRequiredFields'), variant: "destructive" });
            return;
        }

        const accountData = {
            name: newAccount.name,
            initial_balance: parseFloat(newAccount.initial_balance),
            currency: newAccount.currency,
            min_balance: parseFloat(newAccount.min_balance || 0),
            balance_date: format(newAccount.balance_date, 'yyyy-MM-dd'),
        };
        
        if (editingAccount) {
            const updatedRecord = { ...editingAccount, ...accountData };
            updateAllData({}, { operation: 'update', table: 'bankAccounts', newRecord: updatedRecord, originalRecord: editingAccount });
            toast({ title: t('toast:accountUpdated'), description: t('toast:accountUpdatedSuccess') });
        } else {
            const newRecord = { ...accountData, id: crypto.randomUUID() };
            updateAllData({}, { operation: 'add', table: 'bankAccounts', newRecord });
            toast({ title: t('toast:accountAdded'), description: t('toast:accountAddedSuccess') });
        }
        
        handleCancelEdit();
    };

    const confirmDeleteAccount = () => {
        if (!accountToDelete) return;

        if (allData.bankAccounts.length <= 1) {
            toast({ title: t('toast:actionNotAllowed'), description: t('toast:keepOneAccount'), variant: "destructive" });
            setAccountToDelete(null);
            return;
        }
        
        const account = allData.bankAccounts.find(acc => acc.id === accountToDelete.id);
        if (account) {
            updateAllData({}, { operation: 'delete', table: 'bankAccounts', originalRecord: account });
            toast({ title: t('toast:accountRemoved'), description: t('toast:accountRemovedSuccess') });
        }
        setAccountToDelete(null);
    };

    const openFinancialViews = (view, accountId) => {
        setInitialView(view);
        setSelectedAccountId(accountId);
        setIsViewsOpen(true);
    };
    
    const renderAccountForm = () => (
        <motion.div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-white/30 dark:border-slate-700" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} placeholder={t('accountNamePlaceholder')} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={newAccount.currency} onChange={e => setNewAccount({ ...newAccount, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="BRL">{t('common:brl')}</option>
                    <option value="USD">{t('common:usd')}</option>
                    <option value="EUR">{t('common:eur')}</option>
                </select>
                <input type="number" step="0.01" value={newAccount.initial_balance} onChange={e => setNewAccount({ ...newAccount, initial_balance: e.target.value })} placeholder={t('initialBalancePlaceholder')} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" step="0.01" value={newAccount.min_balance} onChange={e => setNewAccount({ ...newAccount, min_balance: e.target.value })} placeholder={t('safetyBalancePlaceholder')} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="md:col-span-2">
                    <Label htmlFor="balance_date" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('balanceDate')}</Label>
                    <DatePicker
                        id="balance_date"
                        date={newAccount.balance_date}
                        onDateChange={(date) => setNewAccount({ ...newAccount, balance_date: date })}
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={handleCancelEdit}>{t('common:cancel')}</Button>
                <Button onClick={handleSaveAccount} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    <Save className="h-4 w-4 mr-2" /> {t('common:save')}
                </Button>
            </div>
        </motion.div>
    );

    return (
        <>
            <Dialog open={isViewsOpen} onOpenChange={setIsViewsOpen}>
                 <FinancialViewsDialog 
                    allData={allData} 
                    settings={settings}
                    onOpenChange={setIsViewsOpen}
                    initialView={initialView}
                    initialAccountId={selectedAccountId}
                />
            </Dialog>

            <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('accounts:deleteAccountTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('accounts:deleteAccountDescription', { accountName: accountToDelete?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAccountToDelete(null)}>{t('common:cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteAccount} className="bg-red-600 hover:bg-red-700">
                            {t('common:delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <motion.div className="financial-card rounded-xl p-4 sm:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Landmark className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">{t('title')}</h2>
                    </div>
                    {!showAddForm && !editingAccount && (
                        <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-400 dark:to-indigo-500 dark:hover:from-blue-500 dark:hover:to-indigo-600 text-xs sm:text-sm">
                            <Plus className="h-4 w-4 mr-2" /> {t('addAccount')}
                        </Button>
                    )}
                </div>

                {(showAddForm || editingAccount) && renderAccountForm()}
                
                <div className="space-y-4">
                    {(allData.bankAccounts || []).map((account) => {
                        if (editingAccount?.id === account.id) {
                            return null;
                        }
                        
                        const isNegative = account.current_balance < 0;
                        const isBelowMin = account.current_balance < account.min_balance && !isNegative;
                        const isSecure = !isNegative && !isBelowMin;

                        return (
                            <motion.div key={account.id} className="p-3 sm:p-4 bg-white/30 dark:bg-slate-800/50 rounded-lg border border-white/20 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" layout>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {isNegative && <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />}
                                    {isBelowMin && <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 flex-shrink-0" />}
                                    {isSecure && <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />}
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-base sm:text-lg break-all">{account.name}</p>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('safetyBalanceLabel')} {formatCurrency(account.min_balance, account.currency)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between">
                                    <p className={`text-base sm:text-xl font-bold ${isNegative ? 'text-red-500' : isBelowMin ? 'text-amber-500' : 'text-green-500'}`}>
                                        {formatCurrency(account.current_balance, account.currency)}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            onClick={() => openFinancialViews('statement', account.id)} 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                                            title={t('accounts:viewDetails')}
                                        >
                                            <BarChart className="h-5 w-5" />
                                        </Button>
                                        <Button onClick={() => handleEditClick(account)} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" title={t('common:edit')}><Edit3 className="h-4 w-4" /></Button>
                                        <Button onClick={() => setAccountToDelete(account)} size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title={t('common:delete')}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </>
    );
};

export default BankAccounts;