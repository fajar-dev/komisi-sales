import { pool } from "../config/database"

export class IsService {
    static async getAccountManager() {
        const query = `
            SELECT 
                emp.EmpId AS id,
                CONCAT(emp.EmpFName, ' ', emp.EmpLName) AS fullName,
                emp.EmpEmail AS email,
                emp.EmpHP AS phone,
                jt.Title AS jobTitle,
                dept.DeptDetails AS department
            FROM employee emp
            JOIN Department dept
                ON emp.DeptId = dept.DeptId
            JOIN JobTitle jt 
                ON emp.JobTitle = jt.Id
            WHERE jt.Id = 50 
        `
        const [rows] = await pool.query(query)
        return rows
    }

    
}