import { pool } from "../config/database"

export class EmployeeService {
    static async insertEmployee(data: any) {
        const [rows] = await pool.query(`
            INSERT INTO employee (
                id,
                employee_id,
                name,
                email,
                photo_profile,
                job_position,
                organization_name,
                job_level,
                branch,
                manager_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    static async getManager() {
        const [rows] = await pool.query(`
            SELECT *
            FROM employee
            WHERE job_level = 'Manager'
        `);
        return rows;
    }

    static async getManagerById(employeeId: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM employee
            WHERE employee_id = ?
        `, [employeeId]);
        return rows;
    }

    static async getStaff(managerId: string) {
        const [rows] = await pool.query(`
            SELECT *
            FROM employee
            WHERE manager_id = ?
        `, [managerId]);
        return rows;
    }

    static async getEmployeeByEmail(email: string) {
        const [rows] = await pool.query(
            `SELECT * FROM employee WHERE email = ? LIMIT 1`,
            [email]
        );

        return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    }
}
