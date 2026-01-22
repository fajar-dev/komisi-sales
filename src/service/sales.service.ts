import { pool } from "../config/database"

export class SalesService {
    static async insertSales(data: any) {
        const [rows] = await pool.query(`
            INSERT INTO sales (
                user_id,
                employee_id,
                name,
                photo_profile,
                job_position,
                organization_name,
                job_level,
                branch,
                manager_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                employee_id = VALUES(employee_id),
                name = VALUES(name),
                photo_profile = VALUES(photo_profile),
                job_position = VALUES(job_position),
                organization_name = VALUES(organization_name),
                job_level = VALUES(job_level),
                branch = VALUES(branch),
                manager_id = VALUES(manager_id)
        `, [
            data.userId,
            data.employeeId,
            data.name,
            data.photoProfile,
            data.jobPosition,
            data.organizationName,
            data.jobLevel,
            data.branch,
            data.managerId
        ]);
        return rows;
    }

    static async getSalesNusawork() {
        const [rows] = await pool.query(`
            SELECT *
            FROM sales
            WHERE job_position = 'Account Manager' 
            AND organization_name = 'Sales Nusawork'
        `);
        return rows;
    }

    static async getSalesGWS() {
        const [rows] = await pool.query(`
            SELECT *
            FROM sales
            WHERE job_position = 'Account Manager' 
            AND organization_name = 'Sales GWS'
        `);
        return rows;
    }
}
