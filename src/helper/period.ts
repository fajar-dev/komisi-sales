import { format } from 'date-fns';

export class period{
        static getStartAndEndDateForCurrentMonth() {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
    
            const startMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const startYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
            const startDate = new Date(startYear, startMonth, 26);
            const endDate = new Date(currentYear, currentMonth, 25);
    
            return {
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd')
            };
        }
}