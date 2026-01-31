import { Context } from 'hono';
import { SnapshotService } from '../service/snapshot.service';
import { ApiResponseHandler } from '../helper/api-response';
import { IsService } from '../service/is.service';
import { EmployeeService } from '../service/employee.service';
import { period } from '../helper/period';

export class SnapshotController {
    constructor(
        private snapshotService = SnapshotService,
        private isService = IsService,
        private employeeService = EmployeeService,
        private apiResponse = ApiResponseHandler,
    ) {}

    async salesInvoice(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const employeeId = c.req.param('id');
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

            return c.json(
            this.apiResponse.success("Invoice retrived successfuly", {
                data,
                total,
            })
            );
        } catch (error: any) {
            return c.json(this.apiResponse.error("Failed to retrieve snapshot", error.message));
        }
    }


    async implementatorInvoice(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const employeeId = c.req.param('id');

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

            return c.json(
            this.apiResponse.success("Snapshot retrieved successfully", {
                churnCount,
                data,
                total,
            })
            );
        } catch (error: any) {
            return c.json(this.apiResponse.error("Failed to retrieve snapshot", error.message));
        }
    }

    async managerTeamCommission(c: Context) {
        try {
            const employeeId = c.req.param('id');
            const { year } = c.req.query();
            const yearInt = parseInt(year as string);

            if (isNaN(yearInt)) {
                 return c.json(this.apiResponse.error("Invalid year", "Year must be a number"));
            }

            const startPeriod = period.getStartAndEndDateForMonth(yearInt, 0);
            const endPeriod = period.getStartAndEndDateForMonth(yearInt, 11);

            const startDate = startPeriod.startDate;
            const endDate = endPeriod.endDate;

            const hierarchy = await this.employeeService.getHierarchy(employeeId);
            
            // Exclude the manager themselves
            const subordinates = hierarchy.filter((e: any) => e.employee_id !== employeeId);
            
            if (!subordinates || subordinates.length === 0) {
                 return c.json(this.apiResponse.success("No employees found", []));
            }

            const employeeIds = subordinates.map((e: any) => e.employee_id);
            const snapshots = await this.snapshotService.getSnapshotBySalesIds(employeeIds, startDate, endDate);

            // Group snapshots by sales_id and sum commission
            const commissionMap = new Map<string, number>();
            snapshots.forEach((row: any) => {
                const salesId = row.sales_id;
                const commission = parseFloat(row.sales_commission) || 0;
                const current = commissionMap.get(salesId) || 0;
                commissionMap.set(salesId, current + commission);
            });

            // Map results back to hierarchy
            const data = subordinates.map((emp: any) => ({
                ...emp,
                totalCommission: commissionMap.get(emp.employee_id) || 0
            }));

            const total = data.reduce((sum: number, emp: any) => sum + emp.totalCommission, 0);

            return c.json(this.apiResponse.success("Employee commission hierarchy retrieved successfully", {
                data,
                total
            }));

        } catch (error: any) {
            return c.json(this.apiResponse.error("Failed to retrieve hierarchy commission", error.message));
        }
    }
}
