import { Context } from 'hono';
import { ApiResponseHandler } from '../helper/api-response';
import { IsService } from '../service/is.service';
import { EmployeeService } from '../service/employee.service';
import { CommissionHelper } from '../helper/commission.helper';
import { SnapshotService } from '../service/snapshot.service';

export class CommissionController {
    constructor(
        private snapshotService = SnapshotService,  
        private employeeService = EmployeeService,
        private isService = IsService,
        private commissionHelper = CommissionHelper,
        private apiResponse = ApiResponseHandler,
    ) {}

    async internalCommission(c: Context) {
        try {
            const { employeeId, year } = c.req.query();
            const yearInt = parseInt(year as string);

            const result = await this.commissionHelper.processAnnualCommission(yearInt, async (startDate, endDate) => {
                const rows = await this.snapshotService.getSnapshotBySales(employeeId, startDate, endDate);

                let soloCount = 0;
                let soloTotal = 0;
                let boosterCount = 0;
                let boosterTotal = 0;
                let recurringCount = 0;
                let recurringTotal = 0;

                rows.forEach((row: any) => {
                    const commissionAmount = parseFloat(row.sales_commission);
                    const commissionPercentage = parseFloat(row.sales_commission_percentage);
                    
                    if (commissionPercentage === 12) {
                        soloCount++;
                        soloTotal += commissionAmount;
                    } else if (commissionPercentage === 15) {
                        boosterCount++;
                        boosterTotal += commissionAmount;
                    } else if (commissionPercentage === 1) {
                        recurringCount++;
                        recurringTotal += commissionAmount;
                    }
                });

                const monthTotal = soloTotal + boosterTotal + recurringTotal;

                return {
                    total: Math.round(monthTotal * 100) / 100,
                    detail: [
                        {
                            name: "Solo",
                            count: soloCount,
                            total: Math.round(soloTotal * 100) / 100
                        },
                        {
                            name: "Booster",
                            count: boosterCount,
                            total: Math.round(boosterTotal * 100) / 100
                        },
                        {
                            name: "Recurring",
                            count: recurringCount,
                            total: Math.round(recurringTotal * 100) / 100
                        }
                    ]
                };
            });
            
            return c.json(this.apiResponse.success("Count retrived successfuly", result));
            
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to retrieve commission chart data', error.message));
        }
    }

    async implementatorCommission(c: Context) {
        try {
            const { employeeId, year } = c.req.query();
            const yearInt = parseInt(year as string);

            const result = await this.commissionHelper.processAnnualCommission(yearInt, async (startDate, endDate) => {
                const rows = await this.snapshotService.getSnapshotByImplementator(employeeId, startDate, endDate);
                const churnCount = await this.isService.getCustomerNaByImplementator(employeeId, startDate, endDate)
                
                let baseCommissionCount = 0;
                let baseCommissionTotal = 0;
                let retentionBoosterCount = 0;
                let retentionBoosterTotal = 0;
                let recurringCount = 0;
                let recurringTotal = 0;

                rows.forEach((row: any) => {
                    const dpp = parseFloat(row.dpp);
                    const commissionPercentage = parseFloat(row.sales_commission_percentage);
                    
                    if (commissionPercentage === 1) {
                        recurringCount++;
                        recurringTotal += dpp * 0.01;
                    } else {
                        if (churnCount > 0) {
                            baseCommissionCount++;
                            baseCommissionTotal += dpp * 0.175;
                        } else {
                            retentionBoosterCount++;
                            retentionBoosterTotal += dpp * 0.20;
                        }
                    }
                });

                const monthTotal = baseCommissionTotal + retentionBoosterTotal + recurringTotal;

                return {
                    total: Math.round(monthTotal * 100) / 100,
                    detail: [
                        {
                            name: "Base Commission",
                            count: baseCommissionCount,
                            total: Math.round(baseCommissionTotal * 100) / 100
                        },
                        {
                            name: "Retention Booster",
                            count: retentionBoosterCount,
                            total: Math.round(retentionBoosterTotal * 100) / 100
                        },
                        {
                            name: "Recurring",
                            count: recurringCount,
                            total: Math.round(recurringTotal * 100) / 100
                        }
                    ]
                };
            });
            
            return c.json(this.apiResponse.success("Count retrived successfuly", result));
            
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to retrieve commission chart data', error.message));
        }
    }

    async managerCommission(c: Context) {
        try {
            const { employeeId, year } = c.req.query();
            const yearInt = parseInt(year as string);

            const managerRows: any = await this.employeeService.getManagerById(employeeId);
            if (!managerRows || managerRows.length === 0) {
                 return c.json(this.apiResponse.error('Manager not found', ''));
            }
            const manager = managerRows[0];
            
            const staffRows = await this.employeeService.getStaff(manager.id) as any[];
            const staffIds = staffRows.map((s: any) => s.employee_id);

            const result = await this.commissionHelper.processAnnualCommission(yearInt, async (startDate, endDate) => {
                let rows: any[] = [];
                if (staffIds.length > 0) {
                    rows = await this.snapshotService.getSnapshotBySalesIds(staffIds, startDate, endDate);
                }

                const salesMap = new Map<string, { name: string, count: number, total: number }>();

                staffRows.forEach((staff: any) => {
                    const name = staff.name || staff.employee_id;
                    salesMap.set(name, { name: name, count: 0, total: 0 });
                });

                (rows as any[]).forEach((row: any) => {
                    const salesName = row.name || row.sales_id; 
                    const commissionAmount = parseFloat(row.sales_commission || 0);

                    if (salesMap.has(salesName)) {
                         const salesData = salesMap.get(salesName)!;
                         salesData.count++;
                         salesData.total += commissionAmount;
                    } else {
                         salesMap.set(salesName, { name: salesName, count: 1, total: commissionAmount });
                    }
                });

                const detail: any[] = [];
                let monthTotal = 0;

                salesMap.forEach((value) => {
                    const roundedTotal = Math.round(value.total * 100) / 100;
                    detail.push({
                        name: value.name,
                        count: value.count,
                        total: roundedTotal
                    });
                    monthTotal += roundedTotal;
                });
                
                const managerMonthCommission = Math.round((monthTotal * 0.25) * 100) / 100;

                return {
                    total: managerMonthCommission,
                    detail: detail
                };
            });
            
            return c.json(this.apiResponse.success("Count retrived successfuly", result));
            
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to retrieve commission chart data', error.message));
        }
    }
}
