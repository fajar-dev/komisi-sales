import { IsService } from '../service/is.service';
import { SnapshotService } from '../service/snapshot.service';
import { period } from '../helper/period';

export class SnapshotCrawl {
    constructor(
        private isService = IsService,
        private snapshotService = SnapshotService,
        private periodHelper = period
    ) {}

    async crawlInternalInvoice() {
        const { startDate, endDate } = this.periodHelper.getStartAndEndDateForCurrentMonth();
        const rows = await this.isService.getIinternalByDateRange(startDate, endDate);

        const commissionData = rows.map((row: any) => {
            let isNew = false;
            let isUpgrade = false;
            let isTermin = false;
            let commissionPercentage = 0;

            const newSubscription = Number(row.new_subscription ?? 0);
            const crossSellCount = Number(row.cross_sell_count ?? 0);
            const dpp = Number(row.dpp ?? 0);
            const description = String(row.Description ?? "");

            // "termin" sebagai kata utuh, tidak match "terminasi"
            const hasTermin = /\btermin\b(?!\w)/i.test(description);

            if (hasTermin) {
            // - terminated = true
            // - komisi 15% jika ada cross sell, kalau tidak 12%
            isTermin = true;
            commissionPercentage = crossSellCount > 0 ? 15 : 12;
            } else if (row.counter > 1 && String(row.new_subscription) === "0.00") {
            // RULE #1:
            // - invoice ulang (counter > 1) & bukan new subscription -> komisi 1%
            commissionPercentage = 1;
            } else if (newSubscription > 0 && crossSellCount > 0) {
            // RULE #2:
            // - new subscription + ada cross sell -> komisi 15%
            commissionPercentage = 15;

            // Flag:
            // - isNew: bukan prorata & bukan upgrade
            // - isUpgrade: upgrade atau prorata
            if (row.is_prorata === 0 && row.is_upgrade === 0) isNew = true;
            if (row.is_upgrade === 1 || row.is_prorata === 1) isUpgrade = true;
            } else if (newSubscription > 0 && crossSellCount === 0) {
            // RULE LAMA #3:
            // - new subscription + tanpa cross sell -> komisi 12%
            commissionPercentage = 12;

            // Flag:
            // - isUpgrade: upgrade atau prorata
            // - isNew: bukan prorata & bukan upgrade
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
                dpp,
                description,
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
                isTermin,
                salesCommission: commissionAmount,
                salesCommissionPercentage: commissionPercentage,
                implementatorId: row.Surveyor,
                referralId: referral,
                crossSellCount: row.cross_sell_count,
                type: row.BusinessOperation
            };
        });

        for (const data of commissionData) {
            await this.snapshotService.insertSnapshot(data);
            console.log("Invoice inserted:", data.invoiceNumber);
        }
    }
}