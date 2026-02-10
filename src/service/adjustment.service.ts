import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export class AdjustmentService {

    static async getAdjustment(employeeId: string) {
        const [rows] = await pool.query(`
            SELECT 
                a.id,
                a.ai, 
                a.employee_id AS employeeId,
                a.approved_id AS approvedId,
                a.modal,
                a.price,
                a.margin,
                a.markup,
                a.commission_percentage,
                a.commission,
                a.note,
                a.status, 
                e.name as requestName, 
                e.photo_profile as requestPhotoProfile,
                s.customer_company as companyName,
                s.customer_id as customerId,
                s.service_group_id as serviceGroupId,
                s.service_name as serviceName,
                s.invoice_number as invoiceNumber,
                s.position as position
            FROM adjustment a
            LEFT JOIN employee e ON a.employee_id = e.employee_id
            LEFT JOIN snapshot s ON a.ai = s.ai
            WHERE a.approved_id = ?
            AND a.status = 'pending'
        `, [employeeId]);
        return rows;
    }

    static async getAdjustmentByAi(ai: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM adjustment WHERE ai = ? LIMIT 1`,
            [ai]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async acceptAdjustment(id: number, employeeId: string) {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT * FROM adjustment
            WHERE id = ? AND approved_id = ?
        `, [id, employeeId]);

        if (rows.length === 0) return null;

        const adjustment = rows[0];

        await pool.query(`
            UPDATE adjustment
            SET status = 'accept'
            WHERE id = ?
        `, [id]);


        return {
            ai: adjustment.ai,
            commission: adjustment.commission,
            commissionPercentage: adjustment.commission_percentage,
        };
    }

    static async declineAdjustment(id: number, employeeId: string) {
        const [rows] = await pool.query(`
            UPDATE adjustment
            SET status = 'decline'
            WHERE id = ? AND approved_id = ?
        `, [id, employeeId]);
        return rows;
    }

    static async getAdjustmentHistory(employeeId: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM adjustment
            WHERE employee_id = ?
            AND status IN ('accept', 'decline')
        `, [employeeId]);
        return rows;
    }

    static async insertAdjustment(data: any) {
        const [rows] = await pool.query(
            `
            INSERT INTO adjustment (
                ai,
                employee_id,
                approved_id,
                modal,
                price,
                margin,
                markup,
                commission_percentage,
                commission,
                note,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                data.ai,
                data.employeeId,
                data.approvedId,
                data.modal,
                data.price,
                data.margin,
                data.markup,
                data.commissionPercentage,
                data.commission,
                data.note,
                'pending',
            ]
        );

        return rows;
    }

}