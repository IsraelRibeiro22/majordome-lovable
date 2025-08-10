import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
    startOfMonth, endOfMonth, addMonths, format, getYear, getMonth, getDate, 
    subMonths, addDays, parseISO, isValid
} from 'date-fns';
import { ptBR, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const DateContext = createContext();

export const useDate = () => useContext(DateContext);

export const DateProvider = ({ children, settings }) => {
    const { i18n } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date('2025-08-01'));

    const locale = useMemo(() => (i18n.language === 'fr' ? fr : ptBR), [i18n.language]);
    const financialCycleStartDay = useMemo(() => settings?.financialCycleStartDay || 1, [settings]);
    const periodView = useMemo(() => settings?.periodView || 'monthly', [settings]);

    const getFinancialCycleForDate = useCallback((date) => {
        const year = getYear(date);
        const month = getMonth(date);
        const day = getDate(date);

        if (day >= financialCycleStartDay) {
            const start = new Date(year, month, financialCycleStartDay);
            const end = addDays(addMonths(start, 1), -1);
            return { start, end };
        } else {
            const end = new Date(year, month, financialCycleStartDay - 1);
            const start = addDays(subMonths(end, 1), 1);
            return { start, end };
        }
    }, [financialCycleStartDay]);

    const getMonthlyCycleForDate = useCallback((date) => ({
        start: startOfMonth(date),
        end: endOfMonth(date),
    }), []);
    
    const getBudgetPeriodKey = useCallback((date) => {
       if (!date || !isValid(date)) return null;
       // Uses the start of the month to create a consistent key like "2025-07"
       return format(startOfMonth(date), 'yyyy-MM');
    }, []);

    const currentPeriod = useMemo(() => {
        if (periodView === 'custom_range') {
            return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
        }
        return periodView === 'financial_cycle'
            ? getFinancialCycleForDate(currentDate)
            : getMonthlyCycleForDate(currentDate);
    }, [periodView, currentDate, getFinancialCycleForDate, getMonthlyCycleForDate]);
    
    const [activePeriod, setActivePeriod] = useState(currentPeriod);

    useEffect(() => {
        setActivePeriod(currentPeriod);
    }, [currentPeriod]);

    const setDateRange = useCallback((range) => {
        if (periodView === 'custom_range' && range?.start && range?.end) {
            setActivePeriod({start: range.start, end: range.end});
        }
    }, [periodView]);

    const handlePreviousPeriod = useCallback(() => {
        setCurrentDate(prevDate => {
            if (periodView === 'financial_cycle') {
                const currentCycle = getFinancialCycleForDate(prevDate);
                return subMonths(currentCycle.start, 1);
            }
            return subMonths(prevDate, 1);
        });
    }, [periodView, getFinancialCycleForDate]);

    const handleNextPeriod = useCallback(() => {
        setCurrentDate(prevDate => {
            if (periodView === 'financial_cycle') {
                const currentCycle = getFinancialCycleForDate(prevDate);
                return addMonths(currentCycle.start, 1);
            }
            return addMonths(prevDate, 1);
        });
    }, [periodView, getFinancialCycleForDate]);

    const getPeriodsForYear = useCallback((year) => {
        if (periodView === 'financial_cycle') {
            const periods = [];
            let date = new Date(year, 0, financialCycleStartDay);
            if (getDate(date) !== financialCycleStartDay) {
                date = new Date(year, 1, financialCycleStartDay - 1);
            }
            
            for (let i = 0; i < 12; i++) {
                const cycle = getFinancialCycleForDate(date);
                if (getYear(cycle.start) === year || getYear(cycle.end) === year) {
                    periods.push(cycle);
                }
                date = addMonths(cycle.start, 1);
            }
            return periods.filter((p, i, self) => i === self.findIndex(t => t.start.getTime() === p.start.getTime()));
        } else { // monthly
            return Array.from({ length: 12 }, (_, i) => ({
                start: startOfMonth(new Date(year, i, 1)),
                end: endOfMonth(new Date(year, i, 1)),
            }));
        }
    }, [periodView, financialCycleStartDay, getFinancialCycleForDate]);

    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

    const getPeriodLabel = useCallback((viewType, start, end, currentLocale) => {
        if (viewType === 'financial_cycle') {
            const startMonth = capitalizeFirstLetter(format(start, 'MMM', { locale: currentLocale }));
            const endMonth = capitalizeFirstLetter(format(end, 'MMM', { locale: currentLocale }));
            if (startMonth === endMonth) {
                return `${startMonth} ${getYear(start)}`;
            }
            return `${startMonth}/${endMonth} ${getYear(end)}`;
        }
        return capitalizeFirstLetter(format(start, 'MMMM yyyy', { locale: currentLocale }));
    }, []);

    const formatPeriod = useCallback((period) => {
        if (!period || !period.start || !period.end) return '';
        const formatStr = 'd MMM';
        return `${format(period.start, formatStr, { locale })} - ${format(period.end, formatStr, { locale })}`;
    }, [locale]);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        const date = parseISO(dateString);
        if (!isValid(date)) return 'Invalid Date';
        // Use 'P' for localized short date format (e.g., 01/01/2025 or 01/01/2025)
        return format(date, 'P', { locale });
    }, [locale]);

    const value = useMemo(() => ({
        currentPeriod: activePeriod,
        setDateRange,
        handlePreviousPeriod,
        handleNextPeriod,
        getPeriodsForYear,
        formatPeriod,
        getPeriodLabel,
        getBudgetPeriodKey,
        formatDate,
        settings: {
            financialCycleStartDay,
            periodView
        },
        locale
    }), [activePeriod, setDateRange, handlePreviousPeriod, handleNextPeriod, getPeriodsForYear, formatPeriod, getPeriodLabel, getBudgetPeriodKey, formatDate, financialCycleStartDay, periodView, locale]);

    return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};