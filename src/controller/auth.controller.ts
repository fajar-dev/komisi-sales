import { OAuth2Client } from "google-auth-library";
import { Context } from "hono";
import { sign, verify } from 'hono/jwt';
import { EmployeeService } from "../service/employee.service";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET } from "../config/config";
import { ApiResponseHandler } from "../helper/api-response";

export class AuthController {
    private clientId = GOOGLE_CLIENT_ID;
    private clientSecret = GOOGLE_CLIENT_SECRET;
    private jwtSecret = JWT_SECRET;

    constructor(
        private employeeService = EmployeeService,
        private apiResponse = ApiResponseHandler,
    ) {}

    private getOauth2Client() {
        const oAuth2Client = new OAuth2Client(
            this.clientId,
            this.clientSecret,
            'postmessage'
        );
        return oAuth2Client;
    }

    async verify(code: string): Promise<any> {
        const oAuth2Client = this.getOauth2Client();
        const result = await oAuth2Client.getToken(code);
        const ticket = await oAuth2Client.verifyIdToken({
        idToken: result.tokens.id_token!,
        audience: this.clientId,
        });
        const payload = ticket.getPayload();
        return payload;
    }

    async login(c: Context) {
        try {
            const body = await c.req.json();
            const payload = await this.verify(body.code);
            const employee = await this.employeeService.getEmployeeByEmail(payload.email) as any;
            
            if(!employee){
                return c.json(this.apiResponse.custom(false, 'Employee not found'), 404);
            }

            const now = Math.floor(Date.now() / 1000);
            const accessTokenPayload = {
                sub: employee.employee_id,
                email: employee.email,
                role: employee.job_position,
                exp: now + 60 * 15, // 15 minutes
            };
            const refreshTokenPayload = {
                sub: employee.employee_id,
                email: employee.email,
                exp: now + 60 * 60 * 24 * 7, // 7 days
            };

            const accessToken = await sign(accessTokenPayload, this.jwtSecret!);
            const refreshToken = await sign(refreshTokenPayload, this.jwtSecret!);
            
            return c.json(this.apiResponse.success("Login successful", {
                accessToken,
                refreshToken,
                user: employee
            }));

        } catch (error: any) {
            return c.json(this.apiResponse.error('Login failed', error.message), 500);
        }
    }

    async refresh(c: Context) {
        try {
            const body = await c.req.json();
            const refreshToken = body.refreshToken;

            if (!refreshToken) {
                return c.json(this.apiResponse.error('Refresh token is required'), 400);
            }

            try {
                const payload = await verify(refreshToken, this.jwtSecret!, 'HS256');
                const email = payload.email as string;
                
                const employee = await this.employeeService.getEmployeeByEmail(email) as any;
                if (!employee) {
                    return c.json(this.apiResponse.error('User not found'), 401);
                }

                const now = Math.floor(Date.now() / 1000);
                const newAccessTokenPayload = {
                    sub: employee.employee_id,
                    email: employee.email,
                    role: employee.job_position,
                    exp: now + 60 * 15, // 15 minutes
                };
                const newRefreshTokenPayload = {
                    sub: employee.employee_id,
                    email: employee.email,
                    exp: now + 60 * 60 * 24 * 7, // 7 days
                };

                const accessToken = await sign(newAccessTokenPayload, this.jwtSecret!);
                const newRefreshToken = await sign(newRefreshTokenPayload, this.jwtSecret!);

                return c.json(this.apiResponse.success("Token refreshed", { accessToken, refreshToken: newRefreshToken }));

            } catch (err) {
                return c.json(this.apiResponse.error('Invalid refresh token'), 401);
            }
        } catch (error: any) {
            return c.json(this.apiResponse.error('Refresh failed', error.message), 500);
        }
    }

    async me(c: Context) {
        try {
            const authHeader = c.req.header('Authorization');
            if (!authHeader) {
                return c.json(this.apiResponse.error('Authorization header missing'), 401);
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return c.json(this.apiResponse.error('Token missing'), 401);
            }

            try {
                const payload = await verify(token, this.jwtSecret!, 'HS256');
                const email = payload.email as string;
                const employee = await this.employeeService.getEmployeeByEmail(email) as any;

                if (!employee) {
                    return c.json(this.apiResponse.error('User not found'), 404);
                }

                return c.json(this.apiResponse.success("User retrieved", employee));
            } catch (err) {
                 return c.json(this.apiResponse.error('Invalid token'), 401);
            }

        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to get user', error.message), 500);
        }
    }

    async logout(c: Context) {
        // Stateless JWT logout (client should delete token)
        return c.json(this.apiResponse.success("Logged out successfully"));
    }
}