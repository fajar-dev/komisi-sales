import { IsService } from '../service/is.service';
import { InvoiceService } from '../service/invoice.service';
import { format } from 'date-fns';

export class InvoiceCrawl {

    private static async getStartAndEndDateForCurrentMonth() {
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

    public static async crawlNusaworkInvoice() {
        const { startDate, endDate } = await this.getStartAndEndDateForCurrentMonth();
        const rows = await IsService.getInvoiceNusaworkByDateRange(startDate, endDate);

        const commissionData: any[] = rows.map((row: any) => {
            let isNew = false;
            let isUpgrade = false;
            let commissionPercentage = 0;

            if (row.nciit.counter > 1 && row.nciit.new_subscription === "0.00") {
                commissionPercentage = 1;
            } else if (row.nciit.new_subscription > 0 && row[''].cross_sell_count > 0) {
                commissionPercentage = 15;
                if (row.nciit.is_prorata === 0 && row.nciit.is_upgrade === 0) {
                    isNew = true;
                }
                if (row.nciit.is_upgrade === 1 || row.nciit.is_prorata === 1) {
                    isUpgrade = true;
                }
            } else if (row.nciit.new_subscription > 0 && row[''].cross_sell_count === 0) {
                if (row.nciit.is_upgrade === 1 || row.nciit.is_prorata === 1) {
                    isUpgrade = true;
                }
                commissionPercentage = 12;
                if (row.nciit.is_prorata === 0 && row.nciit.is_upgrade === 0) {
                    isNew = true;
                }
            }

            const commissionAmount = row.nciit.dpp * (commissionPercentage / 100);

            return {
                ai: row.nciit?.AI,
                invoiceNumber: row.cit?.InvoiceNum,
                invoiceDate: row.cit?.InvoiceDate,
                dpp: row.nciit?.dpp,
                customerServiceId: row.cs?.CustServId,
                customerId: row.c?.CustId,
                customerCompany: row.c?.CustCompany,
                serviceGroupId: row.s?.ServiceLevel,
                serviceId: row.s?.ServiceId,
                serviceName: row.s?.ServiceType,
                salesId: row.cs?.SalesId,
                managerSalesId: row.cs?.ManagerSalesId,
                isNew,
                isUpgrade,
                commissionAmount,
                commissionPercentage
            };
        });

        for (const data of commissionData) {
            await InvoiceService.insertInvoice(data);
            console.log("Invoice inserted: ", data.invoiceNumber);
        }
    }
}