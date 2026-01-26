import { IsService } from '../service/is.service';
import { InvoiceService } from '../service/invoice.service';
import { period } from '../helper/period';

export class InvoiceCrawl {

    public static async crawlNusaworkInvoice() {
        const { startDate, endDate } = period.getStartAndEndDateForCurrentMonth();
        const rows = await IsService.getInvoiceNusaworkByDateRange(startDate, endDate);

        const commissionData = rows.map((row: any) => {
            let isNew = false;
            let isUpgrade = false;
            let commissionPercentage = 0;

            const newSubscription = Number(row.new_subscription ?? 0);
            const crossSellCount = Number(row.cross_sell_count ?? 0);
            const dpp = Number(row.dpp ?? 0);

            if (row.counter > 1 && String(row.new_subscription) === "0.00") {
            commissionPercentage = 1;
            } else if (newSubscription > 0 && crossSellCount > 0) {
            commissionPercentage = 15;

            if (row.is_prorata === 0 && row.is_upgrade === 0) isNew = true;
            if (row.is_upgrade === 1 || row.is_prorata === 1) isUpgrade = true;

            } else if (newSubscription > 0 && crossSellCount === 0) {
            commissionPercentage = 12;

            if (row.is_upgrade === 1 || row.is_prorata === 1) isUpgrade = true;
            if (row.is_prorata === 0 && row.is_upgrade === 0) isNew = true;
            }

            const commissionAmount = dpp * (commissionPercentage / 100);

            let referral: string | null = null;
            if (row.ResellerType === "employee" && row.ResellerTypeId != null) {
            referral = row.ResellerTypeId;
            }

            return {
            ai: row.AI,
            invoiceNumber: row.InvoiceNum,
            invoiceDate: row.InvoiceDate,
            dpp: dpp,
            customerServiceId: row.CustServId,
            customerId: row.CustId,
            customerCompany: row.CustCompany,
            serviceGroupId: row.ServiceLevel,
            serviceId: row.ServiceId,
            serviceName: row.ServiceType,
            salesId: row.SalesId,
            managerSalesId: row.ManagerSalesId,
            isNew,
            isUpgrade,
            commissionAmount,
            commissionPercentage,
            referral
            };
        });

        for (const data of commissionData) {
            await InvoiceService.insertInvoice(data);
            console.log("Invoice inserted:", data.invoiceNumber);
        }
        }

}