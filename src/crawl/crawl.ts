import { SnapshotCrawl } from "./snapshot.crawl";
import { SalesCrawl } from "./sales.crawl";

class Crawl {
    public static async run() {
        try {
            console.log("Starting the invoice crawl...");
            await SnapshotCrawl.crawlInternalInvoice();
            console.log("Invoice crawl finished.");
            console.log("Starting the sales crawl...");
            await SalesCrawl.crawlSales();
            console.log("Sales crawl finished.");
            process.exit(0); 
        } catch (error) {
            console.error("Error running the crawl:", error);
            process.exit(1); 
        }
    }
}

Crawl.run();
