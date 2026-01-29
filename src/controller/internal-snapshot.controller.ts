import { Context } from 'hono';
import { SnapshotService } from '../service/snapshot.service';
import { ApiResponseHandler } from '../helper/api-response';
import { IsService } from '../service/is.service';

export class InternalSnapshotController {
    constructor(
        private snapshotService = SnapshotService,
        private isService = IsService,
        private apiResponse = ApiResponseHandler,
    ) {}

    async amNusaworkInvoice(c: Context) {
        try {
            const { employeeId, startDate, endDate } = c.req.query();
            const result = await this.snapshotService.getSnapshotBySales(employeeId, startDate, endDate);
            const snapshot: any[] = result.map((row: any) => ({
                ai: row.ai,
                invoiceNumber: row.invoice_number,
                invoiceDate: row.invoice_date,
                dpp: row.dpp,
                customerServiceId: row.customer_service_id,
                customerId: row.customer_id,
                customerCompany: row.customer_company,
                serviceGroupId: row.service_group_id,
                serviceId: row.service_id,
                serviceName: row.service_name,
                salesId: row.sales_id,
                managerSalesId: row.manager_sales_id,
                implementatorId: row.implementator_id,
                referralId: row.referral_id,
                isNew: row.is_new,
                isUpgrade: row.is_upgrade,
                isTermin: row.is_termin,
                salesCommission: row.sales_commission,
                salesCommissionPercentage: row.sales_commission_percentage,
            }));

            const solo = snapshot.filter(inv => parseFloat(inv.salesCommissionPercentage) === 12);
            const booster = snapshot.filter(inv => parseFloat(inv.salesCommissionPercentage) === 15);
            const recurring = snapshot.filter(inv => parseFloat(inv.salesCommissionPercentage) === 1);

            const soloTotal = solo.reduce((sum, inv) => sum + parseFloat(inv.salesCommission || 0), 0);
            const boosterTotal = booster.reduce((sum, inv) => sum + parseFloat(inv.salesCommission || 0), 0);
            const recurringTotal = recurring.reduce((sum, inv) => sum + parseFloat(inv.salesCommission || 0), 0);

            const categorized = {
                solo: { data: solo, total: soloTotal },
                booster: { data: booster, total: boosterTotal },
                recurring: { data: recurring, total: recurringTotal },
                total: soloTotal + boosterTotal + recurringTotal
            };

            return c.json(this.apiResponse.success("Invoice retrived successfuly", categorized));

        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to retrieve and categorize snapshot', error.message));
        }
    }

    async implementatorInvoice(c: Context) {
        try {
            const { employeeId, startDate, endDate } = c.req.query();
            
            const result = await this.snapshotService.getSnapshotByImplementator(employeeId, startDate, endDate);
            const churnCount = await this.isService.getCustomerNaByImplementator(employeeId, startDate, endDate);

            const snapshot: any[] = result.map((row: any) => ({
                ai: row.ai,
                invoiceNumber: row.invoice_number,
                invoiceDate: row.invoice_date,
                dpp: row.dpp,
                customerServiceId: row.customer_service_id,
                customerId: row.customer_id,
                customerCompany: row.customer_company,
                serviceGroupId: row.service_group_id,
                serviceId: row.service_id,
                serviceName: row.service_name,
                salesId: row.sales_id,
                managerSalesId: row.manager_sales_id,
                implementatorId: row.implementator_id,
                referralId: row.referral_id,
                isNew: row.is_new,
                isUpgrade: row.is_upgrade,
                isTermin: row.is_termin,
                salesCommission: row.sales_commission,
                salesCommissionPercentage: row.sales_commission_percentage,
            }));

            // Categorize
            const baseCommission: any[] = [];
            const retentionBooster: any[] = [];
            const recurring: any[] = [];

            const calculateCommission = (dpp: number, type: 'base' | 'retention' | 'recurring') => {
                if (type === 'recurring') return dpp * 0.01;
                if (type === 'base') return dpp * 0.175;
                if (type === 'retention') return dpp * 0.20;
                return 0;
            };

            snapshot.forEach(inv => {
                const percentage = parseFloat(inv.salesCommissionPercentage || 0);
                const dpp = parseFloat(inv.dpp || 0);
                
                if (percentage === 1) {
                    // Update the invoice object with the calculated commission for consistency in this view if needed, 
                    // or just leave as is. Let's strictly follow the grouping.
                    recurring.push(inv);
                } else {
                    if (churnCount > 0) {
                        baseCommission.push(inv);
                    } else {
                        retentionBooster.push(inv);
                    }
                }
            });

            const baseCommissionTotal = baseCommission.reduce((sum, inv) => sum + calculateCommission(parseFloat(inv.dpp), 'base'), 0);
            const retentionBoosterTotal = retentionBooster.reduce((sum, inv) => sum + calculateCommission(parseFloat(inv.dpp), 'retention'), 0);
            const recurringTotal = recurring.reduce((sum, inv) => sum + calculateCommission(parseFloat(inv.dpp), 'recurring'), 0);

            const categorized = {
                baseCommission: { data: baseCommission, total: baseCommissionTotal },
                retentionBooster: { data: retentionBooster, total: retentionBoosterTotal },
                recurring: { data: recurring, total: recurringTotal },
                total: baseCommissionTotal + retentionBoosterTotal + recurringTotal
            };

            return c.json(this.apiResponse.success("Snapshot retrieved successfully", categorized));

        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to retrieve and categorize snapshot', error.message));
        }
    }
}
