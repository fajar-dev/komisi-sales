import { Context } from 'hono';
import { InvoiceService } from '../service/invoice.service';

export class CommissionController {

    static async amNusaworkInvoice(c: Context){
        const { employeeId, startDate, endDate } = c.req.query();
        const invoice = await InvoiceService.getInvoiceBySales(employeeId, startDate, endDate)
        return c.json(invoice)
    }

    // static async amNusaworkCommissionChart(c: Context) {
    //     const { employeeId, year } = c.req.query();
    //     const yearInt = parseInt(year as string);
    //     const months = [
    //         "January", "February", "March", "April", "May", "June",
    //         "July", "August", "September", "October", "November", "December"
    //     ];

    //     const response: any = {
    //         total: 0
    //     };

    //     let grandTotal = 0;

    //     for (let i = 0; i < 12; i++) {
    //         const monthIndex = i;
    //         // Logic: Jan (0) starts Dec 26 (year-1) ends Jan 25 (year)
    //         //        Feb (1) starts Jan 26 (year) ends Feb 25 (year)
    //         const startDateObj = new Date(yearInt, monthIndex - 1, 26);
    //         const endDateObj = new Date(yearInt, monthIndex, 25);

    //         // Format YYYY-MM-DD
    //         const startDate = startDateObj.toISOString().split('T')[0];
    //         const endDate = endDateObj.toISOString().split('T')[0];

    //         const rows = await CommissionService.getInvoiceBySales(employeeId, startDate, endDate);
    //         console.log(rows)

    //     //     let soloCount = 0;
    //     //     let soloTotal = 0;
    //     //     let boosterCount = 0;
    //     //     let boosterTotal = 0;
    //     //     let recurringCount = 0;
    //     //     let recurringTotal = 0;

    //     //     rows.forEach((row: any) => {
    //     //         let type = '';
    //     //         let commissionPercentage = 0;
                
    //     //         // Strict logic reused
    //     //         if (row.nciit.counter > 1 && row.nciit.new_subscription === "0.00") {
    //     //             type = 'recurring';
    //     //             commissionPercentage = 1;
    //     //         } else if (row.nciit.new_subscription > 0 && row[''].cross_sell_count > 0) {
    //     //             type = 'booster';
    //     //             commissionPercentage = 15;
    //     //         } else if (row.nciit.new_subscription > 0 && row[''].cross_sell_count === 0) {
    //     //             type = 'solo';
    //     //             commissionPercentage = 12;
    //     //         }

    //     //         if (type) {
    //     //             const commissionAmount = row.nciit.dpp * (commissionPercentage / 100);
    //     //             if (type === 'solo') {
    //     //                 soloCount++;
    //     //                 soloTotal += commissionAmount;
    //     //             } else if (type === 'booster') {
    //     //                 boosterCount++;
    //     //                 boosterTotal += commissionAmount;
    //     //             } else if (type === 'recurring') {
    //     //                 recurringCount++;
    //     //                 recurringTotal += commissionAmount;
    //     //             }
    //     //         }
    //     //     });

    //     //     const monthTotal = soloTotal + boosterTotal + recurringTotal;
    //     //     grandTotal += monthTotal;

    //     //     response[months[i]] = {
    //     //         solo: {
    //     //             count: soloCount,
    //     //             total: soloTotal
    //     //         },
    //     //         booster: {
    //     //             count: boosterCount,
    //     //             total: boosterTotal
    //     //         },
    //     //         recurring: {
    //     //             count: recurringCount,
    //     //             total: recurringTotal
    //     //         },
    //     //         total: monthTotal
    //     //     };
    //     }

    //     // response.total = grandTotal;
    //     return c.json(rows);
    // }
}
