import { pool } from "../config/database"

export class SnapshotService {
    static async insertSnapshot(data: any) {
        const sql = `
            INSERT INTO snapshot (
                ai,
                counter,
                invoice_number,
                position,
                invoice_date,
                paid_date,
                month_period,
                dpp,
                new_sub,
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
                mrc,
                implementator_id,
                sales_commission,
                sales_commission_percentage,
                referral_id,
                type,
                cross_sell_count,
                is_adjustment
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            ON DUPLICATE KEY UPDATE
                counter                     = IF(is_adjustment = 1, counter, VALUES(counter)),
                invoice_number              = IF(is_adjustment = 1, invoice_number, VALUES(invoice_number)),
                position                    = IF(is_adjustment = 1, position, VALUES(position)),
                invoice_date                = IF(is_adjustment = 1, invoice_date, VALUES(invoice_date)),
                paid_date                   = IF(is_adjustment = 1, paid_date, VALUES(paid_date)),
                month_period                = IF(is_adjustment = 1, month_period, VALUES(month_period)),
                dpp                         = IF(is_adjustment = 1, dpp, VALUES(dpp)),
                new_sub                     = IF(is_adjustment = 1, new_sub, VALUES(new_sub)),
                description                 = IF(is_adjustment = 1, description, VALUES(description)),
                customer_service_id         = IF(is_adjustment = 1, customer_service_id, VALUES(customer_service_id)),
                customer_id                 = IF(is_adjustment = 1, customer_id, VALUES(customer_id)),
                customer_company            = IF(is_adjustment = 1, customer_company, VALUES(customer_company)),
                service_group_id            = IF(is_adjustment = 1, service_group_id, VALUES(service_group_id)),
                service_id                  = IF(is_adjustment = 1, service_id, VALUES(service_id)),
                service_name                = IF(is_adjustment = 1, service_name, VALUES(service_name)),
                sales_id                    = IF(is_adjustment = 1, sales_id, VALUES(sales_id)),
                manager_sales_id            = IF(is_adjustment = 1, manager_sales_id, VALUES(manager_sales_id)),
                is_new                      = IF(is_adjustment = 1, is_new, VALUES(is_new)),
                is_upgrade                  = IF(is_adjustment = 1, is_upgrade, VALUES(is_upgrade)),
                is_termin                   = IF(is_adjustment = 1, is_termin, VALUES(is_termin)),
                mrc                         = IF(is_adjustment = 1, mrc, VALUES(mrc)),
                implementator_id            = IF(is_adjustment = 1, implementator_id, VALUES(implementator_id)),
                sales_commission            = IF(is_adjustment = 1, sales_commission, VALUES(sales_commission)),
                sales_commission_percentage = IF(is_adjustment = 1, sales_commission_percentage, VALUES(sales_commission_percentage)),
                referral_id                 = IF(is_adjustment = 1, referral_id, VALUES(referral_id)),
                type                        = IF(is_adjustment = 1, type, VALUES(type)),
                cross_sell_count            = IF(is_adjustment = 1, cross_sell_count, VALUES(cross_sell_count)),
                is_adjustment               = IF(is_adjustment = 1, is_adjustment, VALUES(is_adjustment));
        `;

        const params = [
            // INSERT values
            data.ai,
            data.counter,
            data.invoiceNumber,
            data.position,
            data.invoiceDate,
            data.paidDate ?? null,
            data.monthPeriod,
            data.dpp,
            data.newSub,
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
            data.mrc ?? 0,
            data.implementatorId ?? null,
            data.salesCommission ?? 0,
            data.salesCommissionPercentage ?? 0,
            data.referralId ?? null,
            data.type,
            data.crossSellCount ?? 0,
            data.isAdjustment ?? false
        ];

        const [result] = await pool.query(sql, params);

        return result;
    }

    static async getSnapshotBySales(salesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(
            `
            SELECT
            s.*,
            a.commission            AS adjustment_commission,
            a.markup                AS adjustment_markup,
            a.margin                AS adjustment_margin,
            a.commission_percentage AS adjustment_commission_percentage,
            a.note                  AS adjustment_note,
            a.modal                 AS adjustment_modal,
            a.price                 AS adjustment_price,
            e.name                  AS implementator_name,
            e.employee_id           AS implementator_id,
            e.photo_profile         AS implementator_photo
            FROM snapshot s
            LEFT JOIN (
            SELECT a1.*
            FROM adjustment a1
            INNER JOIN (
                SELECT ai, MAX(updated_at) AS max_updated_at
                FROM adjustment
                WHERE status = 'accept'
                GROUP BY ai
            ) x
                ON x.ai = a1.ai AND x.max_updated_at = a1.updated_at
            WHERE a1.status = 'accept'
            ) a
            ON s.ai = a.ai
            LEFT JOIN employee e
            ON s.implementator_id = e.employee_id
            WHERE s.sales_id = ?
            AND s.paid_date BETWEEN ? AND ?
            AND NOT (s.is_upgrade = 1 AND s.new_sub > 0 AND s.new_sub < (s.dpp * 0.2))
            GROUP BY s.ai
            `,
            [salesId, startDate, endDate]
        );

        return rows as any[];
    }

    static async getSnapshotByImplementator(salesId: string, startDate: string, endDate: string) {
        const [rows] = await pool.query(`
             SELECT 
            s.*,
            e.name                  AS sales_name,
            e.employee_id           AS sales_id,
            e.photo_profile         AS sales_photo
            FROM snapshot s
            LEFT JOIN adjustment a 
                ON s.ai = a.ai
            LEFT JOIN employee e
                ON s.sales_id = e.employee_id
            WHERE s.implementator_id = ?
            AND s.paid_date BETWEEN ? AND ?
            AND s.service_group_id = 'NW'
            GROUP BY s.ai
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

    static async updateSnapshot(ai: number, adjustmentData: any) {
        const [rows] = await pool.query(`
            UPDATE snapshot
            SET 
                sales_commission = ?,
                sales_commission_percentage = ?,
                is_adjustment = ?
            WHERE ai = ?
        `, [
            adjustmentData.commission,
            adjustmentData.commission_percentage || adjustmentData.commissionPercentage,
            true,
            ai
        ]);
        return rows;
    }

    static async getSnapshotByAi(ai: string) {
        const [rows] = await pool.query(`
            SELECT
            s.*,
            a.commission            AS adjustment_commission,
            a.markup                AS adjustment_markup,
            a.margin                AS adjustment_margin,
            a.commission_percentage AS adjustment_commission_percentage,
            a.note                  AS adjustment_note,
            a.modal                 AS adjustment_modal,
            a.price                 AS adjustment_price
            FROM snapshot s
            LEFT JOIN (
            SELECT a1.*
            FROM adjustment a1
            INNER JOIN (
                SELECT ai, MAX(updated_at) AS max_updated_at
                FROM adjustment
                WHERE status = 'accept'
                GROUP BY ai
            ) x
                ON x.ai = a1.ai AND x.max_updated_at = a1.updated_at
            WHERE a1.status = 'accept'
            ) a
            ON s.ai = a.ai
            WHERE s.ai = ?
            LIMIT 1
        `, [ai]);
        return (rows as any[])[0];
    }

}