import { Context } from 'hono';
import { snapshotService } from '../service/snapshot.service';
import { ApiResponseHandler } from '../helper/api-response';
import { period } from '../helper/period';
import { IsService } from '../service/is.service';

export class CommissionController {
    static async internalCommission(c: Context) {
        try {
            const { employeeId, year } = c.req.query();

            const yearInt = parseInt(year as string);
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            const data: any[] = [];
            let grandTotal = 0;

            for (let i = 0; i < 12; i++) {
                // Pakai helper
                const { startDate, endDate } = period.getStartAndEndDateForMonth(yearInt, i);

                const rows = await snapshotService.getSnapshotBySales(employeeId, startDate, endDate);

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
                grandTotal += monthTotal;

                data.push({
                    month: months[i],
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
                    ],
                    total: Math.round(monthTotal * 100) / 100
                });
            }

            const response = {
                total: Math.round(grandTotal * 100) / 100,
                data: data
            };
            
            return c.json(ApiResponseHandler.success("Count retrived successfuly", response));
            
        } catch (error: any) {
            return c.json(ApiResponseHandler.error('Failed to retrieve commission chart data', error.message));
        }
    }

    static async implementatorCommission(c: Context) {
        try {
            const { employeeId, year } = c.req.query();
            const yearInt = parseInt(year as string);
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            const data: any[] = [];
            let grandTotal = 0;

            for (let i = 0; i < 12; i++) {
                const { startDate, endDate } = period.getStartAndEndDateForMonth(yearInt, i);

                const rows = await snapshotService.getSnapshotByImplementator(employeeId, startDate, endDate);
                const churnCount = await IsService.getCustomerNaByImplementator(employeeId, startDate, endDate)
                
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
                        // Recurring: 1% dari DPP
                        recurringCount++;
                        recurringTotal += dpp * 0.01;
                    } else {
                        // One Time (Base + potentially Booster)
                        
                        if (churnCount > 0) {
                            // Base Commission Only (17.5%)
                            baseCommissionCount++;
                            baseCommissionTotal += dpp * 0.175;
                        } else {
                            // Retention Booster (Base + Booster = 20%)
                            retentionBoosterCount++;
                            retentionBoosterTotal += dpp * 0.20;
                        }
                    }
                });

                const monthTotal = baseCommissionTotal + retentionBoosterTotal + recurringTotal;
                grandTotal += monthTotal;

                data.push({
                    month: months[i],
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
                    ],
                    total: Math.round(monthTotal * 100) / 100
                });
            }

            const response = {
                total: Math.round(grandTotal * 100) / 100,
                data: data
            };
            
            return c.json(ApiResponseHandler.success("Count retrived successfuly", response));
            
        } catch (error: any) {
            return c.json(ApiResponseHandler.error('Failed to retrieve commission chart data', error.message));
        }
    }

}
