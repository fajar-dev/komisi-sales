import { Context } from 'hono';
import { SnapshotService } from '../service/snapshot.service';
import { ApiResponseHandler } from '../helper/api-response';
import { IsService } from '../service/is.service';

export class SnapshotController {
    constructor(
        private snapshotService = SnapshotService,
        private isService = IsService,
        private apiResponse = ApiResponseHandler,
    ) {}

    async internalInvoice(c: Context) {
        try {
            const { employeeId, startDate, endDate } = c.req.query();
            const result = await this.snapshotService.getSnapshotBySales(employeeId, startDate, endDate);

            const data: any[] = result.map((row: any) => ({
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

            const total = data.reduce((sum, inv) => sum + Number(inv.salesCommission || 0), 0);

            // kalau masih butuh breakdown total tanpa memecah data:
            const totalsByPercentage = data.reduce((acc, inv) => {
            const key = String(inv.salesCommissionPercentage ?? "unknown");
            acc[key] = (acc[key] || 0) + Number(inv.salesCommission || 0);
            return acc;
            }, {} as Record<string, number>);

            return c.json(
            this.apiResponse.success("Invoice retrived successfuly", {
                data,
                totalsByPercentage,
                total,
            })
            );
        } catch (error: any) {
            return c.json(this.apiResponse.error("Failed to retrieve snapshot", error.message));
        }
    }


    async implementatorInvoice(c: Context) {
        try {
            const { employeeId, startDate, endDate } = c.req.query();

            const result = await this.snapshotService.getSnapshotByImplementator(employeeId, startDate, endDate);
            const churnCount = await this.isService.getCustomerNaByImplementator(employeeId, startDate, endDate);

            const calculateCommission = (dpp: number, type: "base" | "retention" | "recurring") => {
            if (type === "recurring") return dpp * 0.01;
            if (type === "base") return dpp * 0.175;
            if (type === "retention") return dpp * 0.2;
            return 0;
            };

            const data: any[] = result.map((row: any) => {
            const dpp = Number(row.dpp || 0);
            const percentage = Number(row.sales_commission_percentage || 0);

            // recurring kalau pct = 1, selain itu base/retention tergantung churnCount
            const type: "base" | "retention" | "recurring" =
                percentage === 1 ? "recurring" : churnCount > 0 ? "base" : "retention";

            const implementatorCommission = calculateCommission(dpp, type);

            return {
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

                // renamed fields
                implementatorCommission,
                implementatorCommissionPercentage: percentage,
            };
            });

            const total = data.reduce((sum, inv) => sum + Number(inv.implementatorCommission || 0), 0);

            // optional: breakdown total tanpa memecah data
            const totalsByPercentage = data.reduce((acc, inv) => {
            const key = String(inv.implementatorCommissionPercentage ?? "unknown");
            acc[key] = (acc[key] || 0) + Number(inv.implementatorCommission || 0);
            return acc;
            }, {} as Record<string, number>);

            return c.json(
            this.apiResponse.success("Snapshot retrieved successfully", {
                churnCount,
                data,
                totalsByPercentage,
                total,
            })
            );
        } catch (error: any) {
            return c.json(this.apiResponse.error("Failed to retrieve snapshot", error.message));
        }
    }

}
