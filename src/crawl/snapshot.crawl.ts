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
        // const rows = await this.isService.getIinternalByDateRange(startDate, endDate);
        const rows = await this.isService.getIinternalByDateRange('2025-12-26', '2026-01-25');

        const commissionData = rows.map((row: any) => {
            let isNew = false;
            let isUpgrade = false;
            let isTermin = false;
            let commissionPercentage = 0;
            
            let monthPeriod = 0;

            if (row.AwalPeriode && row.AkhirPeriode) {
                const startStr = String(row.AwalPeriode);
                const endStr = String(row.AkhirPeriode);

                const startYear = Number(startStr.slice(0, 4));
                const startMonth = Number(startStr.slice(4, 6));
                const endYear = Number(endStr.slice(0, 4));
                const endMonth = Number(endStr.slice(4, 6));

                if (
                    Number.isFinite(startYear) &&
                    Number.isFinite(startMonth) &&
                    Number.isFinite(endYear) &&
                    Number.isFinite(endMonth)
                ) {
                    monthPeriod =
                        (endYear - startYear) * 12 +
                        (endMonth - startMonth) +
                        1;
                }
            }

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
            // RULE #3:
            // - new subscription + tanpa cross sell -> komisi 12%
            commissionPercentage = 12;

            // Flag:
            // - isUpgrade: upgrade atau prorata
            // - isNew: bukan prorata & bukan upgrade
            if (row.is_upgrade === 1 || row.is_prorata === 1) isUpgrade = true;
            if (row.is_prorata === 0 && row.is_upgrade === 0) isNew = true;
            }

            let commissionAmount = 0;
            const months = Number(row.Month || 0);

            // RULE #4:
            // - Jika new subscription dan periode > 12 bulan
            // - 12 bulan pertama dapat komisi full (12% atau 15%)
            // - Sisa bulan dianggap recurring (1%)
            if (isNew && months > 12) {
                const first12MonthsAmount = dpp * (12 / months);
                const remainingAmount = dpp - first12MonthsAmount;
                commissionAmount = (first12MonthsAmount * (commissionPercentage / 100)) + (remainingAmount * 0.01);
            } else {
                commissionAmount = dpp * (commissionPercentage / 100);
            }

            let referral: string | null = null;
            if (row.ResellerType === "employee" && row.ResellerTypeId != null) {
            referral = row.ResellerTypeId;
            }

            return {
                ai: row.AI,
                invoiceNumber: row.InvoiceNum,
                position: row.Urut,
                invoiceDate: row.InvoiceDate,
                paidDate: row.trx_date,
                monthPeriod,
                dpp,
                newSub: row.new_subscription,
                modal: row.modal,
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
                typeSub: null,
                type: row.BusinessOperation,
                upgradeCount: 0
            };
        });

        const excludedServices = ['CPANEL', 'CPANELDS', 'CLINUXOS', 'IMUNIFYSEC', 'CPPREM', 'WINDLC'];
        
        for (const data of commissionData) {
            if (excludedServices.includes(data.serviceId)) {
                continue;
            }

            if (data.isUpgrade) {
                data.upgradeCount = await this.isService.getUpgradeCount(data.customerServiceId, data.ai);
            }

            if (data.serviceGroupId === 'SV' && data.dpp < 500000) {
                continue;
            }
            await this.snapshotService.insertSnapshot(data);
            console.log("Invoice inserted:", data.invoiceNumber);
        }
    }

    async crawlResellInvoice() {
        const { startDate, endDate } = this.periodHelper.getStartAndEndDateForCurrentMonth();
        // const rows = await this.isService.getResellByDateRange(startDate, endDate);
        const rows = await this.isService.getResellByDateRange('2025-12-26', '2026-01-25');

        const commissionData = rows.map((row: any) => {
            let isNew = false;
            let isUpgrade = false;
            let isTermin = false;
            let commissionPercentage = 0;
            
            let monthPeriod = 0;

            if (row.AwalPeriode && row.AkhirPeriode) {
                const startStr = String(row.AwalPeriode);
                const endStr = String(row.AkhirPeriode);

                const startYear = Number(startStr.slice(0, 4));
                const startMonth = Number(startStr.slice(4, 6));
                const endYear = Number(endStr.slice(0, 4));
                const endMonth = Number(endStr.slice(4, 6));

                if (
                    Number.isFinite(startYear) &&
                    Number.isFinite(startMonth) &&
                    Number.isFinite(endYear) &&
                    Number.isFinite(endMonth)
                ) {
                    monthPeriod =
                        (endYear - startYear) * 12 +
                        (endMonth - startMonth) +
                        1;
                }
            }

            const newSubscription = Number(row.new_subscription ?? 0);
            const crossSellCount = Number(row.cross_sell_count ?? 0);
            const dpp = Number(row.dpp ?? 0);
            const description = String(row.Description ?? "");

            // "termin" sebagai kata utuh, tidak match "terminasi"
            const hasTermin = /\btermin\b(?!\w)/i.test(description);

            if (hasTermin) {
                isTermin = true;
                commissionPercentage = 0;
            } else if (row.counter > 1 && String(row.new_subscription) === "0.00") {
                // Recurring 0.5%
                commissionPercentage = 0.5;
            } else if (newSubscription > 0 && crossSellCount > 0) {
                commissionPercentage = 0;

                if (row.is_prorata === 0 && row.is_upgrade === 0) isNew = true;
                if (row.is_upgrade === 1 || row.is_prorata === 1) isUpgrade = true;
            } else if (newSubscription > 0 && crossSellCount === 0) {
                commissionPercentage = 0;

                if (row.is_upgrade === 1 || row.is_prorata === 1) isUpgrade = true;
                if (row.is_prorata === 0 && row.is_upgrade === 0) isNew = true;
            }

            // FORCE RULE: Google Payment Term Plan -> 0 commission
            // This overrides any previous calculation (recurring, etc.)
            if (row.GooglePaymentTermPlan) {
                commissionPercentage = 0;
            }

            const commissionAmount = dpp * (commissionPercentage / 100);

            let referral: string | null = null;
            if (row.ResellerType === "employee" && row.ResellerTypeId != null) {
                referral = row.ResellerTypeId;
            }

            return {
                ai: row.AI,
                invoiceNumber: row.InvoiceNum,
                position: row.Urut,
                invoiceDate: row.InvoiceDate,
                paidDate: row.trx_date,
                monthPeriod,
                newSub: row.new_subscription,
                dpp,
                modal: row.modal,
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
                typeSub: row.GooglePaymentTermPlan,
                type: row.BusinessOperation,
                upgradeCount: 0
            };
        });

        
        for (const data of commissionData) {
            if (data.isUpgrade) {
                data.upgradeCount = await this.isService.getUpgradeCount(data.customerServiceId, data.ai);
            }
            await this.snapshotService.insertSnapshot(data);
            console.log("Invoice inserted:", data.invoiceNumber);
        }
    }
}