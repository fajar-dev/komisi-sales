import { nisPool } from "../config/nis.db"

export class IsService {

    static async getInvoiceNusaworkByDateRange(startDate: string, endDate: string) {
        let query = `
            SELECT 
                nciit.AI, nciit.counter, nciit.new_subscription, nciit.dpp, nciit.is_prorata, nciit.is_upgrade,
                cit.InvoiceNum, 
                IFNULL(citc.InvoiceDate, cit.InvoiceDate) as InvoiceDate, 
                cs.CustServId, cs.SalesId, cs.ManagerSalesId,
                c.CustId, c.CustCompany, 
                s.ServiceId, s.ServiceType, s.ServiceLevel,
                c.Surveyor,
                nci.Description,
                IFNULL(cs.ResellerType, c.ResellerType)   AS ResellerType,
                IFNULL(cs.ResellerTypeId, c.ResellerId)   AS ResellerTypeId,
                (
                    SELECT COUNT(*) 
                    FROM CustomerServices cs2 
                    JOIN Services s2 ON cs2.ServiceId = s2.ServiceId
                    WHERE cs2.CustId = nci.CustId
                    AND (cs2.CustStatus IS NULL OR cs2.CustStatus <> 'NA')
                    AND s2.ServiceLevel IN ('GS', 'ZHP', 'M3', 'GCP', 'WL', 'FD', 'SLBP')
                ) as cross_sell_count
            FROM NewCustomerInvoiceInternetCounter nciit 
            LEFT JOIN NewCustomerInvoice nci ON nciit.AI = nci.AI 
            LEFT JOIN CustomerInvoiceTemp cit ON nci.Id = cit.InvoiceNum AND nci.No = cit.Urut
            LEFT JOIN CustomerInvoiceTemp_Custom citc ON cit.InvoiceNum = citc.InvoiceNum AND cit.Urut = citc.Urut
            LEFT JOIN CustomerServices cs ON cs.CustId = nci.CustId AND cs.ServiceId = cit.ServiceId
            LEFT JOIN Customer c ON c.CustId = nci.CustId
            LEFT JOIN Services s ON cs.ServiceId = s.ServiceId
            WHERE s.ServiceGroup IN ('NW', 'CL', 'WH', 'SV') 
            AND IFNULL(citc.InvoiceDate, cit.InvoiceDate) BETWEEN ? AND ?
            AND nciit.trx_date IS NOT NULL
            GROUP BY nciit.AI
        `;

        const [rows] = await nisPool.query({
            sql: query,
        }, [startDate, endDate]);

        return rows as any[];
    }

    static async getCustomerNaByImplementator(
        employeeId: string,
        startDate: string,
        endDate: string
        ): Promise<number> {
        const query = `
            SELECT COUNT(*) AS total
            FROM CustomerServices cs
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            WHERE cs.ServiceId IN ('NWBUS', 'NWADV')
            AND c.Surveyor = ?
            AND cs.CustStatus = 'NA'
            AND cs.CustUnregDate BETWEEN ? AND ?;
        `;

        const [rows] = await nisPool.query(query, [employeeId, startDate, endDate]);

        return Number((rows as any[])[0]?.total ?? 0);
    }
}