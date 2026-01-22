import { Nusawork } from '../service/nusawork.service';
import { SalesService } from '../service/sales.service';

export class SalesCrawl {
    public static async crawlSales() {
        const sales = await Nusawork.getSalesDigital()
        for (const data of sales) {
            await SalesService.insertSales(data);
            console.log("Sales inserted: ", data.employeeId);
        }
    }
}