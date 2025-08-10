import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { add, format, isPast, startOfToday, isSameDay } from 'date-fns';
import Header from '@/components/Header';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ptBR, fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const availableTimeSlots = [
  '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
];

const Scheduler = ({ allData, updateAllData, settings, setSettings }) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(undefined);

  const bookedSlots = useMemo(() => {
    return allData.appointments || [];
  }, [allData.appointments]);

  const locale = i18n.language === 'fr' ? fr : ptBR;

  const handleTimeSlotClick = (slot) => {
    if (!selectedDate) return;

    const [hours, minutes] = slot.split(':');
    const appointmentDateTime = new Date(selectedDate);
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const newAppointment = {
      id: Date.now(),
      datetime: appointmentDateTime.toISOString(),
      clientName: allData.name
    };

    updateAllData({ appointments: [...bookedSlots, newAppointment] });
    toast({
      title: t('scheduler.successTitle'),
      description: `${t('scheduler.successDescription')} ${format(appointmentDateTime, 'PPP p', { locale })}.`,
    });
  };

  const isSlotBooked = (slot) => {
    if (!selectedDate) return false;
    const [hours, minutes] = slot.split(':');
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    return bookedSlots.some(appointment => {
      const bookedDateTime = new Date(appointment.datetime);
      return isSameDay(bookedDateTime, selectedDate) &&
             bookedDateTime.getHours() === slotDateTime.getHours() &&
             bookedDateTime.getMinutes() === slotDateTime.getMinutes();
    });
  };

  const isSlotInPast = (slot) => {
    if (!selectedDate) return true;
    const [hours, minutes] = slot.split(':');
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(parseInt(hours), parseInt(minutes));
    return isPast(slotDateTime);
  };

  return (
    <>
      <Helmet>
        <title>{t('scheduler.helmetTitle')}</title>
      </Helmet>
      <div className="min-h-screen text-foreground">
        <Header userData={allData} settings={settings} setSettings={setSettings} />

        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">{t('scheduler.title')}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{t('scheduler.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <motion.div
                className="md:col-span-1 flex justify-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={{ before: startOfToday() }}
                  locale={locale}
                  className="rounded-md border bg-card text-card-foreground shadow-lg"
                />
              </motion.div>

              <motion.div
                className="md:col-span-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="bg-card p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                    {t('scheduler.availableSlots')}: {selectedDate ? format(selectedDate, 'PPP', { locale }) : t('scheduler.selectADay')}
                  </h2>
                  {selectedDate ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {availableTimeSlots.map((slot) => {
                        const booked = isSlotBooked(slot);
                        const past = isSlotInPast(slot);
                        const isDisabled = booked || past;

                        return (
                          <Button
                            key={slot}
                            variant={isDisabled ? "secondary" : "outline"}
                            disabled={isDisabled}
                            onClick={() => handleTimeSlotClick(slot)}
                            className="relative"
                          >
                            {slot}
                            {booked && <Badge variant="destructive" className="absolute -top-2 -right-2">{t('scheduler.booked')}</Badge>}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t('scheduler.slotsWillBeShown')}</p>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default Scheduler;