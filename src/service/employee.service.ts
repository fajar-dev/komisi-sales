import { pool } from "../config/database"

export class EmployeeService {
    static async insertEmployee(data: any) {
        const [rows] = await pool.query(
            `
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
            email = VALUES(email),
            photo_profile = VALUES(photo_profile),
            job_position = VALUES(job_position),
            organization_name = VALUES(organization_name),
            job_level = VALUES(job_level),
            branch = VALUES(branch),
            manager_id = VALUES(manager_id)
            `,
            [
            data.userId,
            data.employeeId,
            data.name,
            data.email,             
            data.photoProfile,
            data.jobPosition,
            data.organizationName,
            data.jobLevel,
            data.branch,
            data.managerId ?? null,     
            ]
        );

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

    static async getEmployeeByEmployeeId(employeeId: string) {
        const [rows] = await pool.query(
            `SELECT * FROM employee WHERE employee_id = ? LIMIT 1`,
            [employeeId]
        );
        return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    }

    static async getEmployeeByEmail(email: string) {
        const [rows] = await pool.query(
            `SELECT * FROM employee WHERE email = ? LIMIT 1`,
            [email]
        );

        return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    }

    static async getHierarchy(employeeId: string) {
        const [rows]: any[] = await pool.query(`
            WITH RECURSIVE employee_hierarchy AS (
                SELECT *, 0 as depth
                FROM employee
                WHERE employee_id = ?
                
                UNION ALL
                
                SELECT e.*, eh.depth + 1
                FROM employee e
                INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
            )
            SELECT * FROM employee_hierarchy WHERE has_dashboard = true ORDER BY depth ASC ;
        `, [employeeId]);

        return Array.isArray(rows) ? rows : [];
    }
}
