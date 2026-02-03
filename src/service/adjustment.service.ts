import { pool } from "../config/database";

export class AdjustmentService {

    static async getAdjustment(employeeId: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM adjustment
            WHERE approved_id = ?
            AND status = 'pending'
        `, [employeeId]);
        return rows;
    }

    static async acceptAdjustment(ai: number, employeeId: string) {
        const [rows] = await pool.query(`
            UPDATE adjustment
            SET status = 'accept'
            WHERE ai = ? AND approved_id = ?
        `, [ai, employeeId]);
        return rows;
    }

    static async declineAdjustment(ai: number, employeeId: string) {
        const [rows] = await pool.query(`
            UPDATE adjustment
            SET status = 'decline'
            WHERE ai = ? AND approved_id = ?
        `, [ai, employeeId]);
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
            ai
            employee_id,
            approved_id,
            old_value,
            new_value,
            action,
            status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                data.ai,
                data.employeeId,
                data.approvedId,
                data.oldValue,
                data.newValue,
                data.action,
                'pending',
            ]
        );

        return rows;
    }

}