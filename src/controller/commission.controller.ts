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

    async salesCommission(c: Context) {
        try {
            const employeeId = c.req.param("id");
            const { year } = c.req.query();
            const yearInt = parseInt(year as string);

            const round2 = (n: number) => Math.round(n * 100) / 100;
            const toNum = (v: any) => {
                const n = typeof v === "string" ? parseFloat(v) : Number(v);
                return Number.isFinite(n) ? n : 0;
            };

            // Periode/bulanan -> wajib return { total, detail }
            const annual = await this.commissionHelper.processAnnualCommission(
                yearInt,
                async (startDate, endDate) => {
                    const rows = await this.snapshotService.getSnapshotBySales(
                        employeeId,
                        startDate,
                        endDate
                    );

                    // ===== INTERNAL =====
                    let soloCount = 0;
                    let soloTotal = 0;

                    let boosterCount = 0;
                    let boosterTotal = 0;

                    let recurringCount = 0;
                    let recurringTotal = 0;

                    // ===== RESELL =====
                    let resellMargin15Count = 0; // 5%
                    let resellMargin15Total = 0;

                    let resellMargin10to15Count = 0; // 4%
                    let resellMargin10to15Total = 0;

                    let resellMarginBelow10Count = 0; // 2.5%
                    let resellMarginBelow10Total = 0;

                    let resellRecurringCount = 0; // 0.5%
                    let resellRecurringTotal = 0;

                    rows.forEach((row: any) => {
                        if (row.is_deleted === 1 || row.is_deleted === true) return;
                        // if (row.is_upgrade === 1 && row.upgrade_count > 1) return;

                        const commissionAmount = toNum(row.sales_commission);
                        const commissionPercentage = toNum(row.sales_commission_percentage);

                        // INTERNAL
                        if (commissionPercentage === 12) {
                            soloCount++;
                            soloTotal += commissionAmount;
                            return;
                        }
                        if (commissionPercentage === 15) {
                            boosterCount++;
                            boosterTotal += commissionAmount;
                            return;
                        }
                        if (commissionPercentage === 1) {
                            recurringCount++;
                            recurringTotal += commissionAmount;
                            return;
                        }

                        // RESELL (ambil dari % di DB)
                        if (commissionPercentage === 5) {
                            resellMargin15Count++;
                            resellMargin15Total += commissionAmount;
                            return;
                        }
                        if (commissionPercentage === 4) {
                            resellMargin10to15Count++;
                            resellMargin10to15Total += commissionAmount;
                            return;
                        }
                        if (commissionPercentage === 2.5) {
                            resellMarginBelow10Count++;
                            resellMarginBelow10Total += commissionAmount;
                            return;
                        }
                        if (commissionPercentage === 0.5) {
                            resellRecurringCount++;
                            resellRecurringTotal += commissionAmount;
                            return;
                        }
                    });

                    const totalInternal = soloTotal + boosterTotal + recurringTotal;
                    const totalResell =
                        resellMargin15Total +
                        resellMargin10to15Total +
                        resellMarginBelow10Total +
                        resellRecurringTotal;

                    const periodTotal = totalInternal + totalResell;

                    // detail untuk 1 periode (helper akan kumpulkan jadi annual.data)
                    const detail = [
                        {
                            startDate,
                            endDate,
                            total: round2(periodTotal),
                            totalInternal: round2(totalInternal),
                            totalResell: round2(totalResell),
                            internal: [
                                { name: "Solo", count: soloCount, total: round2(soloTotal) },
                                { name: "Booster", count: boosterCount, total: round2(boosterTotal) },
                                { name: "Recurring", count: recurringCount, total: round2(recurringTotal) },
                            ],
                            resell: [
                                {
                                    name: "Margin >= 15% (5%)",
                                    count: resellMargin15Count,
                                    total: round2(resellMargin15Total),
                                },
                                {
                                    name: "Margin >= 10% < 15% (4%)",
                                    count: resellMargin10to15Count,
                                    total: round2(resellMargin10to15Total),
                                },
                                {
                                    name: "Margin < 10% (2.5%)",
                                    count: resellMarginBelow10Count,
                                    total: round2(resellMarginBelow10Total),
                                },
                                {
                                    name: "Recurring (0.5%)",
                                    count: resellRecurringCount,
                                    total: round2(resellRecurringTotal),
                                },
                            ],
                        },
                    ];

                    return {
                        total: round2(periodTotal),
                        detail,
                    };
                }
            );

            // annual: { total: number; data: any[] }
            const yearlyData = Array.isArray(annual?.data) ? annual.data : [];

            //  Akses totalInternal & totalResell dari detail[0]
            const yearlyInternal = yearlyData.reduce((acc: number, d: any) => {
                const monthInternal = (d.detail || []).reduce(
                    (sum: number, dt: any) => sum + toNum(dt.totalInternal),
                    0
                );
                return acc + monthInternal;
            }, 0);

            const yearlyResell = yearlyData.reduce((acc: number, d: any) => {
                const monthResell = (d.detail || []).reduce(
                    (sum: number, dt: any) => sum + toNum(dt.totalResell),
                    0
                );
                return acc + monthResell;
            }, 0);

            const yearlyTotal = yearlyInternal + yearlyResell;

            const finalResult = {
                total: round2(yearlyTotal),
                totalInternal: round2(yearlyInternal),
                totalResell: round2(yearlyResell),
                data: yearlyData,
            };

            return c.json(this.apiResponse.success("Count retrived successfuly", finalResult));
        } catch (error: any) {
            return c.json(
                this.apiResponse.error("Failed to retrieve commission chart data", error.message)
            );
        }
    }


    async implementatorCommission(c: Context) {
        try {
            const employeeId = c.req.param('id');
            const { year } = c.req.query();
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
                    if (row.is_deleted === 1 || row.is_deleted === true) return;

                    let dpp = parseFloat(row.dpp);
                    const commissionPercentage = parseFloat(row.sales_commission_percentage);
                    
                    if (row.is_new || row.is_upgrade) {
                        const monthPeriod = row.month_period || row.month_periode || 1;
                        dpp = dpp / monthPeriod;
                    }

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
            const employeeId = c.req.param('id');
            const { year } = c.req.query();
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
                    if (row.is_deleted === 1 || row.is_deleted === true) return;
                    
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
