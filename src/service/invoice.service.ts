import { pool } from "../config/database"

export class InvoiceService {
    static async insertInvoice(data: any) {
        const [rows] = await pool.query(`
            INSERT INTO invoices (
                ai,
                invoice_number,
                invoice_date,
                dpp,
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
                commission_amount,
                commission_percentage
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                invoice_number = VALUES(invoice_number),
                invoice_date = VALUES(invoice_date),
                dpp = VALUES(dpp),
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
                commission_amount = VALUES(commission_amount),
                commission_percentage = VALUES(commission_percentage)
        `, [
            data.ai,
            data.invoiceNumber,
            data.invoiceDate,
            data.dpp,
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
            data.commissionAmount,
            data.commissionPercentage
        ]);
        return rows;
    }

    static async getInvoiceBySales(salesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM invoices
            WHERE sales_id = ?
            AND invoice_date BETWEEN ? AND ?
        `, [salesId, startDate, endDate]);
        return rows as any[];
    }

    static async getInvoiceByManagerSalesId(managerSalesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM invoices
            WHERE manager_sales_id = ?
            AND invoice_date BETWEEN ? AND ?
        `, [managerSalesId, startDate, endDate]);
        return rows;
    }

    static async getInvoiceBySalesIdAndManagerSalesId(salesId: string, managerSalesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM invoices
            WHERE sales_id = ?
            AND manager_sales_id = ?
            AND invoice_date BETWEEN ? AND ?
        `, [salesId, managerSalesId, startDate, endDate]);
        return rows;
    }
}