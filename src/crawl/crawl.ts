import { SnapshotCrawl } from "./snapshot.crawl";
import { EmployeeCrawl } from "./employee.crawl";

class Crawl {
    constructor(
        private snapshotCrawl = new SnapshotCrawl(),
        private employeeCrawl = new EmployeeCrawl()
    ) {}
    
    async run() {
        try {
            console.log("Starting the invoice crawl...");
            await this.snapshotCrawl.crawlInternalInvoice();
            console.log("Invoice crawl finished.");
            console.log("Starting the employee crawl...");
            await this.employeeCrawl.crawlEmployee();
            console.log("Employee crawl finished.");
            process.exit(0); 
        } catch (error) {
            console.error("Error running the crawl:", error);
            process.exit(1); 
        }
    }
}

new Crawl().run();
