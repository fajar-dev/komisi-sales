import { pool } from "../config/database"

export class IsService {

    static async getProducts() {
        const query = `
            SELECT 
                s.ServiceId AS serviceId,
                s.ServiceType AS serviceType,
                s.Type AS type,
                s.ServiceCharge AS serviceCharge,
                s.BusinessOperation AS businessOperation,
                s.ServiceGroup AS serviceGroup,
                sg.Description AS serviceGroupDescription,
                sg.ServiceGroupTypeId AS serviceGroupTypeId,
                sgt.description AS serviceGroupTypeDescription
            
            FROM Services s
            JOIN ServiceGroup sg
                ON s.ServiceGroup = sg.ServiceGroup
            JOIN ServiceGroupType sgt
                ON sg.ServiceGroupTypeId = sgt.id
            WHERE sg.servicegroup = 'BS'
        `
        const [rows] = await pool.query(query)
        return rows
    }
    
    static async getCustomerServicesByAccountManager(employeeId: string) {
        const query = `
            SELECT 
                cs.CustServId AS customerServiceId,
                cs.CustId AS customerId,
                cs.ServiceId AS serviceId,
                cs.CustStatus AS customerStatus,
                cs.CustRegDate AS customerRegistrationDate,
                cs.CustActivationDate AS customerActivationDate,
                cs.CustAccName AS customerAccountName
            FROM CustomerServices cs
            JOIN Customer c
                ON cs.CustId = c.CustId
            WHERE cs.SalesId = '0202560'
        `
        const [rows] = await pool.query(query)
        return rows
    }

    static async getInvoiceNusawork(employeeId: string, startDate: string, endDate: string, type: string) {
        let query = `
            SELECT * 
            FROM NewCustomerInvoiceInternetCounter nciit 
            JOIN NewCustomerInvoice nci ON nciit.AI = nci.AI 
            JOIN CustomerInvoiceTemp cit ON nci.Id = cit.InvoiceNum 
            JOIN CustomerServices cs ON cs.CustId = nci.CustId 
            JOIN Customer c ON c.CustId = nci.CustId
            JOIN Services s ON cs.ServiceId = s.ServiceId
            WHERE cit.ServiceId IN ('NWBUS', 'NWADV') 
            AND cs.SalesId = ?
            AND InvoiceDate BETWEEN ? AND ?
            AND nciit.new_subscription > 0 
            AND trx_date IS NOT NULL
        `;

        // Cek jika type adalah 'booster', tambahkan kondisi tambahan
        if (type === 'booster') {
            query += `
                AND s.ServiceLevel IN ('GS', 'ZHP', 'M3', 'GCP')
                AND (
                    (nciit.counter = 1 AND nciit.is_prorata = false AND nciit.is_upgrade = false)
                    OR (nciit.counter >= 1 AND nciit.is_prorata = true AND nciit.is_upgrade = false)
                    OR (nciit.counter >= 1 AND nciit.is_prorata = false AND nciit.is_upgrade = true)
                    OR (nciit.counter >= 1 AND nciit.is_prorata = true AND nciit.is_upgrade = true)
                );
            `;
        } 

        // Cek jika type adalah 'solo', maka eksklusi ServiceLevel tertentu
        if (type === 'solo') {
            query += `
                AND s.ServiceLevel NOT IN ('GS', 'ZHP', 'M3', 'GCP')
                AND (
                    (nciit.counter = 1 AND nciit.is_prorata = false AND nciit.is_upgrade = false)
                    OR (nciit.counter >= 1 AND nciit.is_prorata = true AND nciit.is_upgrade = false)
                    OR (nciit.counter >= 1 AND nciit.is_prorata = false AND nciit.is_upgrade = true)
                    OR (nciit.counter >= 1 AND nciit.is_prorata = true AND nciit.is_upgrade = true)
                );
            `;
        }

        // Cek jika type adalah 'recurring', tambahkan kondisi tambahan
        if (type === 'recurring') {
            query += `
                AND nciit.counter > 1 AND nciit.is_prorata = false AND nciit.is_upgrade = false;
            `;
        }

        const [rows] = await pool.query({
            sql: query,
            nestTables: true
        }, [employeeId, startDate, endDate]);

        return rows as any[];
    }
}