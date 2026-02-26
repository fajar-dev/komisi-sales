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
            counter: row.counter,
            invoiceNumber: row.invoice_number,
            position: row.position,
            invoiceDate: row.invoice_date,
            paidDate: row.paid_date,
            monthPeriod: row.month_period,
            dpp: row.dpp,
            mrc: row.mrc,
            implementator: {
                name: row.implementator_name,
                id: row.implementator_id,
                photo: row.implementator_photo,
            },
            newSub: row.new_sub,
            customerServiceId: row.customer_service_id,
            customerId: row.customer_id,
            customerCompany: row.customer_company,
            serviceGroupId: row.service_group_id,
            serviceId: row.service_id,
            serviceName: row.service_name,
            salesId: row.sales_id,
            managerSalesId: row.manager_sales_id,
            referralId: row.referral_id,
            isNew: row.is_new,
            isUpgrade: row.is_upgrade,
            isTermin: row.is_termin,
            isAdjustment: row.is_adjustment,
            type: row.type,
            salesCommission: row.sales_commission,
            salesCommissionPercentage: row.sales_commission_percentage,
            modal: row.adjustment_modal,
            price: row.adjustment_price,
            margin: row.adjustment_margin,
            markup: row.adjustment_markup,
            }));

            const newResellData: any[] = [];
            let newResellTotalCommission = 0;
            let newResellTotalDpp = 0;

            const otherData: any[] = [];
            let otherTotalCommission = 0;
            let otherTotalDpp = 0;

            data.forEach(inv => {
                const commission = Number(inv.salesCommission || 0);
                const dpp = Number(inv.dpp || 0);

                if (inv.type === 'resell' && (inv.isNew || inv.isUpgrade)) {
                    newResellData.push(inv);
                    newResellTotalCommission += commission;
                    newResellTotalDpp += dpp;
                } else {
                    otherData.push(inv);
                    otherTotalCommission += commission;
                    otherTotalDpp += dpp;
                }
            });

            const totalCommission = newResellTotalCommission + otherTotalCommission;
            const totalDpp = newResellTotalDpp + otherTotalDpp;

            return c.json(
            this.apiResponse.success("Invoice retrived successfuly", {
                newResellData,
                newResellTotalCommission,
                newResellTotalDpp,
                otherData,
                otherTotalCommission,
                otherTotalDpp,
                totalCommission,
                totalDpp,
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
            if (type === "recurring") return { value: dpp * 0.01, percentage: 1 };
            if (type === "base") return { value: dpp * 0.175, percentage: 17.5 };
            if (type === "retention") return { value: dpp * 0.2, percentage: 20 };
            return { value: 0, percentage: 0 };
            };

            const data: any[] = result.map((row: any) => {
            let dpp = Number(row.dpp || 0);
            const rawPercentage = Number(row.sales_commission_percentage || 0);

            if (row.is_new || row.is_upgrade) {
                const monthPeriod = row.month_period || row.month_periode || 1;
                dpp = dpp / monthPeriod;
            }

            // recurring kalau pct = 1, selain itu base/retention tergantung churnCount
            const type: "base" | "retention" | "recurring" =
                rawPercentage === 1 ? "recurring" : churnCount > 0 ? "base" : "retention";

            const { value: implementatorCommission, percentage: implementatorCommissionPercentage } = calculateCommission(dpp, type);

            return {
                ai: row.ai,
                counter: row.counter,
                invoiceNumber: row.invoice_number,
                position: row.position,
                invoiceDate: row.invoice_date,
                paidDate: row.paid_date,
                monthPeriod: row.month_period,
                dpp: row.dpp,
                sales: {
                    name: row.sales_name,
                    id: row.sales_id,
                    photo: row.sales_photo,
                },
                newSub: row.new_sub,
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
                isAdjustment: row.is_adjustment,
                type: row.type,
                // renamed fields
                implementatorCommission,
                implementatorCommissionPercentage,
            };
            });

            let totalCommission = 0;
            let totalDpp = 0;

            data.forEach((inv) => {
                totalCommission += Number(inv.implementatorCommission || 0);
                totalDpp += Number(inv.dpp || 0);
            });

            return c.json(
            this.apiResponse.success("Snapshot retrieved successfully", {
                churnCount,
                data,
                totalCommission,
                totalDpp,
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
            return c.json(this.apiResponse.error("Failed to retrieve hierarchy commission", error.message), 500);
        }
    }

    async salesSnapshotByAi(c: Context) {
        try {
            const ai = c.req.param('ai');
            const row: any = await this.snapshotService.getSnapshotByAi(ai);

            if (!row) {
                return c.json(this.apiResponse.error("Snapshot not found"), 404);
            }

            const data = {
                ai: row.ai,
                counter: row.counter,
                invoiceNumber: row.invoice_number,
                position: row.position,
                invoiceDate: row.invoice_date,
                paidDate: row.paid_date,
                monthPeriod: row.month_period,
                dpp: row.dpp,
                newSub: row.new_sub,
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
                isAdjustment: row.is_adjustment,
                type: row.type,
                salesCommission: row.sales_commission,
                salesCommissionPercentage: row.sales_commission_percentage,
                modal: row.adjustment_modal,
                price: row.adjustment_price,
                adjustmentCommission: row.adjustment_commission,
                adjustmentMarkup: row.adjustment_markup,
                adjustmentMargin: row.adjustment_margin,
                adjustmentCommissionPercentage: row.adjustment_commission_percentage,
                adjustmentNote: row.adjustment_note,
            };
            
            return c.json(
                this.apiResponse.success("Invoice retrived successfuly", data)
            );
        } catch (error: any) {
            return c.json(this.apiResponse.error("Failed to retrieve snapshot", error.message), 500);
        }
    }
}
