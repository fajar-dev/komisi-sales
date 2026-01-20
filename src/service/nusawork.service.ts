import axios, { AxiosInstance } from 'axios'
import { NUSAWORK_API_URL, NUSAWORK_CLIENT_ID, NUSAWORK_CLIENT_SECRET } from '../config/config'

export class Nusawork {
    private static readonly apiUrl = NUSAWORK_API_URL
    private static readonly clientId = NUSAWORK_CLIENT_ID
    private static readonly clientSecret = NUSAWORK_CLIENT_SECRET

    private static readonly http: AxiosInstance = axios.create({
        baseURL: this.apiUrl,
        headers: {
            Accept: "application/json",
        },
    })

    /**
     * Ambil access token dari Nusawork menggunakan client credentials.
     */
    private static async getToken(): Promise<string> {
        const res = await this.http.post<any>("/auth/api/oauth/token",{
            grant_type: "client_credentials",
            client_id: this.clientId,
            client_secret: this.clientSecret,
        },{
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })

        return res.data.access_token as string
    }

    /**
     * Ambil list karyawan aktif dari Nusawork.
     */
    static async getEmployees(): Promise<any[]> {
        const token = await this.getToken()

        const res = await this.http.post<any>("/emp/api/v4.2/client/employee/filter", {
            fields: { active_status: ["active"] },
            is_paginate: false,
            multi_value: false,
            currentPage: 1,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        
        return (res?.data?.data as any[]) ?? []
    }

    /**
     * Ambil daftar account manager dari Nusawork.
     */
    static async getAccountManager(): Promise<any[]> {
        const employees = await this.getEmployees()

        const accountManager = employees.filter((emp: any) =>
            emp.organization_name === 'Sales Nusawork' 
            || emp.organization_name === 'Sales GWS'
            || emp.organization_name === 'Nusawork'
        )

        return accountManager.map((emp: any) => ({
            employeeId: emp.employee_id,
            name: emp.full_name,
            photoProfile: emp.photo_profile,
            jobPosition: emp.job_position,
            organizationName: emp.organization_name,
            jobLevel: emp.job_level,
            branch: emp.branch_name,
            joinDate: emp.join_date,
        }))
    }
}