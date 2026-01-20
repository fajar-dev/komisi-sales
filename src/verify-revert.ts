
import { NusaworkController } from './controller/nusawork.controller';
import { checkConnection } from './config/database';

// Mock context
const mockContext = {
    req: {
        query: () => ({
            employeeId: '0202560',
            startDate: '2025-12-25',
            endDate: '2026-01-26',
            type: 'solo'
        })
    },
    json: (data: any) => {
        console.log("-- JSON Response --");
        console.log(JSON.stringify(data, null, 2));
        return data;
    }
} as any;

async function main() {
    await checkConnection();
    console.log("Connected to DB");
    
    try {
        await NusaworkController.comissionAccountManager(mockContext);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main().catch(console.error);
