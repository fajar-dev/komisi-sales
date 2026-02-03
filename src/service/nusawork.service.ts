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
     * Ambil daftar account manager digital business dari Nusawork.
     */
    static async getSalesDigital(): Promise<any[]> {
        const employees = await this.getEmployees()

        const accountManager = employees.filter((emp: any) =>
            emp.organization_name === 'Sales Nusawork' 
            || emp.organization_name === 'Sales GWS' 
            || emp.organization_name === 'Nusawork'
            || emp.job_position === 'VP Sales Digital Business' 
            || (emp.organization_name === 'Sales' && emp.job_position === 'Account Manager' && emp.id_report_to_value == 13)
        )

        return accountManager.map((emp: any) => ({
            userId: emp.user_id,
            employeeId: emp.employee_id,
            name: emp.full_name,
            email: emp.email,
            photoProfile: emp.photo_profile,
            jobPosition: emp.job_position,
            organizationName: emp.organization_name,
            jobLevel: emp.job_level,
            branch: emp.branch_name,
            managerId: emp.id_report_to_value,
        }))
    }

    /**
     * Ambil daftar account manager digital business dari Nusawork.
     */
    static async getEmployeeAdmin(): Promise<any[]> {
        const employees = await this.getEmployees()

        const accountManager = employees.filter((emp: any) =>
            emp.employee_id === '0202589' ||
            emp.employee_id === '0200306' ||
            emp.employee_id === '0201325'
        )

        return accountManager.map((emp: any) => ({
            userId: emp.user_id,
            employeeId: emp.employee_id,
            name: emp.full_name,
            email: emp.email,
            photoProfile: emp.photo_profile,
            jobPosition: emp.job_position,
            organizationName: emp.organization_name,
            jobLevel: emp.job_level,
            branch: emp.branch_name,
            managerId: null,
        }))
    }
}