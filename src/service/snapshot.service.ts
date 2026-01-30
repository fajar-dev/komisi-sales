import { pool } from "../config/database"

export class SnapshotService {
    static async insertSnapshot(data: any) {
        const [rows] = await pool.query(
            `
            INSERT INTO snapshot (
            ai,
            invoice_number,
            invoice_date,
            dpp,
            description,
            customer_service_id,
            customer_id,
            customer_company,
            service_group_id,
            service_id,
            service_name,
            sales_id,
            manager_sales_id,
            is_new,
            is_upgrade,
            is_termin,
            implementator_id,
            sales_commission,
            sales_commission_percentage,
            referral_id,
            type,
            cross_sell_count
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            invoice_number = VALUES(invoice_number),
            invoice_date = VALUES(invoice_date),
            dpp = VALUES(dpp),
            description = VALUES(description),
            customer_service_id = VALUES(customer_service_id),
            customer_id = VALUES(customer_id),
            customer_company = VALUES(customer_company),
            service_group_id = VALUES(service_group_id),
            service_id = VALUES(service_id),
            service_name = VALUES(service_name),
            sales_id = VALUES(sales_id),
            manager_sales_id = VALUES(manager_sales_id),
            is_new = VALUES(is_new),
            is_upgrade = VALUES(is_upgrade),
            is_termin = VALUES(is_termin),
            implementator_id = VALUES(implementator_id),
            sales_commission = VALUES(sales_commission),
            sales_commission_percentage = VALUES(sales_commission_percentage),
            referral_id = VALUES(referral_id),
            type = VALUES(type),
            cross_sell_count = VALUES(cross_sell_count)
            `,
            [
            data.ai,
            data.invoiceNumber,
            data.invoiceDate,
            data.dpp,
            data.description,
            data.customerServiceId,
            data.customerId,
            data.customerCompany,
            data.serviceGroupId,
            data.serviceId,
            data.serviceName,
            data.salesId,
            data.managerSalesId,
            data.isNew,
            data.isUpgrade,
            data.isTermin,
            data.implementatorId,
            data.salesCommission,
            data.salesCommissionPercentage,
            data.referralId,
            data.type,
            data.crossSellCount,
            ]
        );

        return rows;
    }


    static async getSnapshotBySales(salesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM snapshot
            WHERE sales_id = ?
            AND invoice_date BETWEEN ? AND ?
        `, [salesId, startDate, endDate]);
        return rows as any[];
    }

    static async getSnapshotByImplementator(salesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM snapshot
            WHERE implementator_id = ?
            AND invoice_date BETWEEN ? AND ?
        `, [salesId, startDate, endDate]);
        return rows as any[];
    }

    static async getSnapshotByManagerSalesId(managerSalesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM snapshot
            JOIN employee ON snapshot.sales_id = employee.employee_id
            WHERE manager_sales_id = ?
            AND invoice_date BETWEEN ? AND ?
        `, [managerSalesId, startDate, endDate]);
        return rows;
    }

    static async getSnapshotBySalesIds(salesIds: string[], startDate: string, endDate: string) {
        if (salesIds.length === 0) return [];
        
        // Create placeholders for IN clause
        const placeholders = salesIds.map(() => '?').join(',');
        
        const [rows] = await pool.query(`
            SELECT snapshot.*, employee.name 
            FROM snapshot
            LEFT JOIN employee ON snapshot.sales_id = employee.employee_id
            WHERE snapshot.sales_id IN (${placeholders})
            AND snapshot.invoice_date BETWEEN ? AND ?
        `, [...salesIds, startDate, endDate]);
        
        return rows as any[];
    }
}