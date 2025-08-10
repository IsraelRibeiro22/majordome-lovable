export const getMockData = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const formatDate = (date) => date.toISOString().split('T')[0];

  return {
    bankAccounts: [
      { id: 1, name: 'Carteira', balance: 1500.75, currency: 'BRL', min_balance: 100 },
      { id: 2, name: 'Conta Principal', balance: 8500.00, currency: 'BRL', min_balance: 1000 },
      { id: 3, name: 'Conta Internacional', balance: 500.00, currency: 'USD', min_balance: 200 },
    ],
    rawCategories: [
      { id: 2, name: 'Alimentação', type: 'expense', color: 'bg-red-500' },
      { id: 3, name: 'Transporte', type: 'expense', color: 'bg-blue-500' },
      { id: 4, name: 'Moradia', type: 'expense', color: 'bg-green-500' },
      { id: 5, name: 'Saúde', type: 'expense', color: 'bg-pink-500' },
      { id: 6, name: 'Educação', type: 'expense', color: 'bg-indigo-500' },
      { id: 7, name: 'Lazer', type: 'expense', color: 'bg-purple-500' },
      { id: 8, name: 'Outros', type: 'expense', color: 'bg-gray-500' },
      { id: 9, name: 'Salário', type: 'income', color: 'bg-green-500' },
      { id: 10, name: 'Freelance', type: 'income', color: 'bg-sky-500' },
      { id: 11, name: 'Investimentos', type: 'income', color: 'bg-teal-500' },
    ],
    expenses: [
      { id: 1, account_id: 1, description: 'Almoço', amount: 35.50, category: 'Alimentação', date: formatDate(new Date(currentYear, currentMonth, 2)) },
      { id: 2, account_id: 2, description: 'Supermercado', amount: 450.00, category: 'Alimentação', date: formatDate(new Date(currentYear, currentMonth, 5)) },
      { id: 3, account_id: 2, description: 'Gasolina', amount: 150.00, category: 'Transporte', date: formatDate(new Date(currentYear, currentMonth, 6)) },
      { id: 4, account_id: 1, description: 'Cinema', amount: 50.00, category: 'Lazer', date: formatDate(new Date(currentYear, currentMonth, 10)) },
    ],
    income: [
      { id: 1, account_id: 2, description: 'Salário Mensal', amount: 7000.00, category: 'Salário', date: formatDate(new Date(currentYear, currentMonth, 5)) },
      { id: 2, account_id: 3, description: 'Projeto Freelance', amount: 300.00, category: 'Freelance', date: formatDate(new Date(currentYear, currentMonth, 12)) },
    ],
    fixedExpenses: [
      { id: 1, account_id: 2, description: 'Aluguel', amount: 2000.00, category: 'Moradia', recurrence: 'monthly', start_date: formatDate(new Date(currentYear, 0, 10)) },
      { id: 2, account_id: 2, description: 'Internet', amount: 99.90, category: 'Moradia', recurrence: 'monthly', start_date: formatDate(new Date(currentYear, 0, 15)) },
    ],
    fixedIncomes: [
      { id: 1, account_id: 2, description: 'Rendimento Poupança', amount: 50.00, category: 'Investimentos', recurrence: 'monthly', start_date: formatDate(new Date(currentYear, 0, 1)) },
    ],
    transfers: [],
    savingsGoals: [
      { id: 1, name: 'Viagem para Israel', target_amount: 15000, current_amount: 3500, deadline: formatDate(new Date(currentYear + 1, 5, 1)) },
    ],
    appointments: [],
    descriptionMemory: [
        { id: 1, description: 'Almoço', type: 'expense' },
        { id: 2, description: 'Supermercado', type: 'expense' },
        { id: 3, description: 'Gasolina', type: 'expense' },
        { id: 4, description: 'Salário Mensal', type: 'income' },
    ],
    budget: {
      [`${currentYear}-${String(currentMonth).padStart(2, '0')}`]: {
        'alimentacao': { amount: 800, currency: 'BRL' },
        'transporte': { amount: 300, currency: 'BRL' },
        'lazer': { amount: 200, currency: 'BRL' },
      }
    }
  };
};