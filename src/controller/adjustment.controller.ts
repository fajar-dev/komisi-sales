import { AdjustmentService } from "../service/adjustment.service";
import { Context } from "hono";
import { ApiResponseHandler } from "../helper/api-response";

export class AdjustmentController {
    constructor(
        private adjustmentService = AdjustmentService,
        private apiResponse = ApiResponseHandler,
    ) {}

    async insertAdjustment(c: Context) {
        try {
            const data = await c.req.json();
            const result = await this.adjustmentService.insertAdjustment(data);
            return c.json(this.apiResponse.success("Adjustment inserted successfully", result));
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to insert adjustment', error.message));
        }
    }

    async getAdjustment(c: Context) {
        try {
            const user = c.get('user');
            const result = await this.adjustmentService.getAdjustment(user.employee_id);
            return c.json(this.apiResponse.success("Adjustment retrieved successfully", result));
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to retrieve adjustment', error.message));
        }
    }

    async acceptAdjustment(c: Context) {
        try {
            const ai = Number(c.req.param('ai'));
            const user = c.get('user');
            const result = await this.adjustmentService.acceptAdjustment(ai, user.employee_id);
            return c.json(this.apiResponse.success("Adjustment accepted successfully", result));
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to accept adjustment', error.message));
        }
    }

    async declineAdjustment(c: Context) {
        try {
            const ai = Number(c.req.param('ai'));
            const user = c.get('user');
            const result = await this.adjustmentService.declineAdjustment(ai, user.employee_id);
            return c.json(this.apiResponse.success("Adjustment declined successfully", result));
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to decline adjustment', error.message));
        }
    }

    async getAdjustmentHistory(c: Context) {
        try {
            const user = c.get('user');
            const result = await this.adjustmentService.getAdjustmentHistory(user.employee_id);
            return c.json(this.apiResponse.success("Adjustment history retrieved successfully", result));
        } catch (error: any) {
            return c.json(this.apiResponse.error('Failed to retrieve adjustment history', error.message));
        }
    }
}