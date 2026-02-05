import { pool } from "../config/database"

export class SnapshotService {
    static async insertSnapshot(data: any) {
        const emptyToNull = (v: any) =>
            v === '' || v === undefined ? null : v;
        const sql = `
            INSERT INTO snapshot (
                ai,
                invoice_number,
                position,
                invoice_date,
                paid_date,
                month_period,
                dpp,
                new_sub,
                modal,
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
                type_sub,
                type,
                cross_sell_count,
                is_adjustment,
                upgrade_count
            )
            SELECT
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1
                FROM snapshot s
                WHERE s.ai = ?
            );
        `;

        const params = [
            // INSERT values
            data.ai,
            data.invoiceNumber,
            data.position,
            data.invoiceDate,
            data.paidDate ?? null,
            data.monthPeriod,
            data.dpp,
            data.newSub,
            data.modal ?? 0,
            data.description,
            data.customerServiceId,
            data.customerId,
            data.customerCompany,
            data.serviceGroupId,
            data.serviceId,
            data.serviceName,
            data.salesId,
            data.managerSalesId,
            data.isNew ?? false,
            data.isUpgrade ?? false,
            data.isTermin ?? false,
            data.implementatorId ?? null,
            data.salesCommission ?? 0,
            data.salesCommissionPercentage ?? 0,
            data.referralId ?? null,
            emptyToNull(data.typeSub),
            data.type,
            data.crossSellCount ?? 0,
            data.isAdjustment ?? false,
            data.upgradeCount ?? 0,

            // GUARD: PRIMARY KEY
            data.ai
        ];

        const [result] = await pool.query(sql, params);

        return result;
    }

    static async getSnapshotBySales(salesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT s.* 
            FROM snapshot s
            LEFT JOIN adjustment a 
                ON s.ai = a.ai
            WHERE s.sales_id = ?
            AND s.paid_date BETWEEN ? AND ?
             AND NOT (s.is_upgrade = 1 AND s.new_sub > 0 AND s.new_sub < (s.dpp * 0.2))
             group by s.ai
        `, [salesId, startDate, endDate]);
        return rows as any[];
    }

    static async getSnapshotByImplementator(salesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT s.*
            FROM snapshot s
            LEFT JOIN adjustment a 
                ON s.ai = a.ai
            WHERE s.implementator_id = ?
            AND s.paid_date BETWEEN ? AND ?
            AND s.service_group_id = 'NW'
            group by s.ai
        `, [salesId, startDate, endDate]);
        return rows as any[];
    }

    static async getSnapshotByManagerSalesId(managerSalesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM snapshot
            JOIN employee ON snapshot.sales_id = employee.employee_id
            WHERE manager_sales_id = ?
            AND paid_date BETWEEN ? AND ?
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
            AND snapshot.paid_date BETWEEN ? AND ?
        `, [...salesIds, startDate, endDate]);
        
        return rows as any[];
    }

    static async updateSnapshot(ai: number, data: any, isDeleted: boolean) {
        const [rows] = await pool.query(`
            UPDATE snapshot
            SET 
                modal = ?,
                sales_commission = ?,
                sales_commission_percentage = ?,
                is_adjustment = ?,
                is_deleted = ?
            WHERE ai = ?
        `, [
            data.modal,
            data.salesCommission,
            data.salesCommissionPercentage,
            true,
            isDeleted,
            ai
        ]);
        return rows;
    }

    static async getSnapshotByAi(ai: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM snapshot
            WHERE ai = ?
            LIMIT 1
        `, [ai]);
        return (rows as any[])[0];
    }

}