import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Check, Calendar, Repeat, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const availableCurrencies = [
  { code: 'BRL', name: 'Real' },
  { code: 'USD', name: 'Dólar' },
  { code: 'EUR', name: 'Euro' },
];

const SettingsDialog = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const { t } = useTranslation(['settings', 'common']);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  const handleThemeChange = (theme) => {
    setLocalSettings({ ...localSettings, theme });
  };

  const handleCurrencyToggle = (currencyCode) => {
    const newSelection = [...(localSettings.selectedCurrencies || [])];
    const index = newSelection.indexOf(currencyCode);

    if (index > -1) {
      if (newSelection.length > 1) {
        newSelection.splice(index, 1);
      }
    } else {
      newSelection.push(currencyCode);
    }
    setLocalSettings({ ...localSettings, selectedCurrencies: newSelection });
  };

  const handleCycleDayChange = (day) => {
    setLocalSettings({ ...localSettings, financialCycleStartDay: parseInt(day) });
  };

  const handlePeriodViewChange = (view) => {
    setLocalSettings({ ...localSettings, periodView: view });
  }

  const handleConfirm = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings:title')}</DialogTitle>
          <DialogDescription>{t('settings:description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>{t('settings:theme.title')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={localSettings.theme === 'light' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('light')}
              >
                <Sun className="mr-2 h-4 w-4" /> {t('settings:theme.light')}
              </Button>
              <Button
                variant={localSettings.theme === 'dark' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon className="mr-2 h-4 w-4" /> {t('settings:theme.dark')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('settings:currency.title')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {availableCurrencies.map(currency => {
                const isSelected = (localSettings.selectedCurrencies || []).includes(currency.code);
                return (
                  <Button
                    key={currency.code}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleCurrencyToggle(currency.code)}
                    className="flex items-center justify-center gap-2"
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                    <span>{currency.code}</span>
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{t('settings:currency.selectHint')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('settings:financialCycle.title')}</Label>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label htmlFor="cycle-day" className="text-sm text-muted-foreground">{t('settings:financialCycle.startDay')}</Label>
                     <Select
                        value={localSettings.financialCycleStartDay?.toString() || '1'}
                        onValueChange={handleCycleDayChange}
                    >
                        <SelectTrigger id="cycle-day">
                            <SelectValue placeholder={t('settings:financialCycle.selectDay')} />
                        </SelectTrigger>
                        <SelectContent>
                            {days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="period-view" className="text-sm text-muted-foreground">{t('settings:financialCycle.periodView')}</Label>
                     <Select
                        value={localSettings.periodView || 'financial_cycle'}
                        onValueChange={handlePeriodViewChange}
                    >
                        <SelectTrigger id="period-view">
                            <SelectValue placeholder={t('settings:financialCycle.selectView')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="financial_cycle"><Repeat className="mr-2 h-4 w-4" />{t('settings:financialCycle.financialCycle')}</SelectItem>
                            <SelectItem value="calendar_month"><Calendar className="mr-2 h-4 w-4" />{t('settings:financialCycle.calendarMonth')}</SelectItem>
                            <SelectItem value="custom_range"><SlidersHorizontal className="mr-2 h-4 w-4" />{t('settings:financialCycle.customRange')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common:cancel')}</Button>
          <Button onClick={handleConfirm}>{t('common:confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;