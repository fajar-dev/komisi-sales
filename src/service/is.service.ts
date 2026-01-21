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
        let baseQuery = `
            SELECT 
                nciit.*, 
                nci.*, 
                cit.*, 
                cs.*, 
                c.*, 
                s.*,
                (
                    SELECT COUNT(*) 
                    FROM CustomerServices cs2 
                    JOIN Services s2 ON cs2.ServiceId = s2.ServiceId
                    WHERE cs2.CustId = nci.CustId 
                    AND (
                        s2.ServiceLevel IN ('GS', 'ZHP', 'M3', 'GCP') 
                        OR s2.ServiceGroup = 'BS'
                    )
                ) as cross_sell_count
            FROM NewCustomerInvoiceInternetCounter nciit 
            LEFT JOIN NewCustomerInvoice nci ON nciit.AI = nci.AI 
            LEFT JOIN CustomerInvoiceTemp cit ON nci.Id = cit.InvoiceNum AND nci.No = cit.Urut
            LEFT JOIN CustomerInvoiceTemp_Custom citc ON cit.InvoiceNum = citc.InvoiceNum AND cit.Urut = citc.Urut
            LEFT JOIN CustomerServices cs ON cs.CustId = nci.CustId AND cs.ServiceId = cit.ServiceId
            LEFT JOIN Customer c ON c.CustId = nci.CustId
            LEFT JOIN Services s ON cs.ServiceId = s.ServiceId
            WHERE cit.ServiceId IN ('NWBUS', 'NWADV') 
            AND cs.SalesId = ?
            AND IFNULL(citc.InvoiceDate, cit.InvoiceDate) BETWEEN ? AND ?
            AND trx_date IS NOT NULL
        `;

        let whereClause = "";
        let havingClause = "";
        const groupByClause = ` GROUP BY nciit.AI `;

        // Filter conditions (WHERE part)
        if (type === 'booster') {
            whereClause += `
                AND nciit.new_subscription > 0
            `;
            havingClause += ` HAVING cross_sell_count > 0 `;
        } else if (type === 'solo') {
            whereClause += `
                AND nciit.new_subscription > 0
            `;
            havingClause += ` HAVING cross_sell_count = 0 `;
        } else if (type === 'recurring') {
            whereClause += `
                AND nciit.counter > 1 
                AND nciit.new_subscription = 0
            `;
        }

        const finalQuery = baseQuery + whereClause + groupByClause + havingClause;

        const [rows] = await pool.query({
            sql: finalQuery,
            nestTables: true
        }, [employeeId, startDate, endDate]);

        return rows as any[];
    }
}