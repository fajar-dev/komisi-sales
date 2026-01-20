import { Context } from 'hono';
import { IsService } from '../service/is.service.';

export class NusaworkController {
    static async comissionAccountManager(c: Context) {
        const { employeeId, startDate, endDate, type } = c.req.query();
        const rows = await IsService.getInvoiceNusawork(employeeId, startDate, endDate, type);

        let totalCommission = 0;

        const result = rows.map((row: any) => {
            let commissionPercentage = 0;
            if (type == "recurring") {
                commissionPercentage = 1; // Recurring
            } else if (type == "booster") {
                commissionPercentage = 15; // Booster
            } else if (type == "solo") {
                commissionPercentage = 12; // Solo
            }
            const price = row.nciit.dpp;
            const commissionAmount = price * (commissionPercentage / 100);
            
            totalCommission += commissionAmount;

            return {
                "invoiceNumber" : row.cit.InvoiceNum,
                "invoiceDate" : row.cit.InvoiceDate,
                "dppInvoice" : row.nciit.dpp,
                "seviceId" : row.s.ServiceId,
                "serviceName" : row.s.ServiceType,
                "customerServiceId" : row.cs.CustServId,
                "customerId" : row.c.CustId,
                "customerCompany" : row.c.CustCompany,
                "commissionAmount" : commissionAmount,
            }
        });

        return c.json({
            data: result,
            totalCommission
        });
    }
}
