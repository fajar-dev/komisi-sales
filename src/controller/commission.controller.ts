import { Context } from 'hono';
import { InvoiceService } from '../service/invoice.service';
import { ApiResponseHandler } from '../helper/api-response';

export class CommissionController {

    static async amNusaworkInvoice(c: Context) {
        try {
            const { employeeId, startDate, endDate } = c.req.query();
            const result = await InvoiceService.getInvoiceBySales(employeeId, startDate, endDate);
            const invoices: any[] = result.map((row: any) => ({
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
                isNew: row.is_new,
                isUpgrade: row.is_upgrade,
                commissionAmount: row.commission_amount,
                commissionPercentage: row.commission_percentage,
            }));

            const solo = invoices.filter(inv => parseFloat(inv.commissionPercentage) === 12);
            const booster = invoices.filter(inv => parseFloat(inv.commissionPercentage) === 15);
            const recurring = invoices.filter(inv => parseFloat(inv.commissionPercentage) === 1);

            const soloTotal = solo.reduce((sum, inv) => sum + parseFloat(inv.commissionAmount || 0), 0);
            const boosterTotal = booster.reduce((sum, inv) => sum + parseFloat(inv.commissionAmount || 0), 0);
            const recurringTotal = recurring.reduce((sum, inv) => sum + parseFloat(inv.commissionAmount || 0), 0);

            const categorized = {
                solo: { data: solo, total: soloTotal },
                booster: { data: booster, total: boosterTotal },
                recurring: { data: recurring, total: recurringTotal },
                total: soloTotal + boosterTotal + recurringTotal
            };

            return c.json(ApiResponseHandler.success("Invoice retrived successfuly", categorized));

        } catch (error: any) {
            return c.json(ApiResponseHandler.error('Failed to retrieve and categorize invoices', error.message));
        }
    }

    static async amNusaworkCommissionChart(c: Context) {
        try {
            const { employeeId, year } = c.req.query();

            if (!employeeId || !year) {
                return c.json(ApiResponseHandler.error('employeeId and year are required'));
            }

            const yearInt = parseInt(year as string);
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            const data: any[] = [];
            let grandTotal = 0;

            for (let i = 0; i < 12; i++) {
                const monthIndex = i;
                const startDateObj = new Date(yearInt, monthIndex - 1, 26);
                const endDateObj = new Date(yearInt, monthIndex, 25);

                const startDate = startDateObj.toISOString().split('T')[0];
                const endDate = endDateObj.toISOString().split('T')[0];

                const rows = await InvoiceService.getInvoiceBySales(employeeId, startDate, endDate);

                let soloCount = 0;
                let soloTotal = 0;
                let boosterCount = 0;
                let boosterTotal = 0;
                let recurringCount = 0;
                let recurringTotal = 0;

                rows.forEach((row: any) => {
                    const commissionAmount = parseFloat(row.commissionAmount || row.commission_amount || 0);
                    const commissionPercentage = parseFloat(row.commissionPercentage || row.commission_percentage || 0);
                    
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
                    solo: {
                        count: soloCount,
                        total: Math.round(soloTotal * 100) / 100
                    },
                    booster: {
                        count: boosterCount,
                        total: Math.round(boosterTotal * 100) / 100
                    },
                    recurring: {
                        count: recurringCount,
                        total: Math.round(recurringTotal * 100) / 100
                    },
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
