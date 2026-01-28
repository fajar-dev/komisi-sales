import { Nusawork } from '../service/nusawork.service';
import { EmployeeService } from '../service/employee.service';

export class EmployeeCrawl {
    public static async crawlEmployee() {
        const sales = await Nusawork.getSalesDigital()
        for (const data of sales) {
            await EmployeeService.insertEmployee(data);
            console.log("Employee inserted: ", data.employeeId);
        }
    }
}