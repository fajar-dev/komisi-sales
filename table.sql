CREATE TABLE internal_snapshot (
    ai INT PRIMARY KEY,
    invoice_number BIGINT NULL,
    invoice_date TIMESTAMP NULL,
    dpp DECIMAL(15, 2) NULL,
    description TEXT NULL,
    customer_service_id INT NULL,
    customer_id VARCHAR(20) NULL,
    customer_company VARCHAR(255) NULL,
    service_group_id VARCHAR(20) NULL,
    service_id VARCHAR(20) NULL,
    service_name VARCHAR(255) NULL,
    sales_id VARCHAR(20) NULL,
    manager_sales_id VARCHAR(20) NULL,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_upgrade BOOLEAN NOT NULL DEFAULT false,
    is_termin BOOLEAN NOT NULL DEFAULT false,
    implementator_id VARCHAR(20) NULL,
    sales_commission DECIMAL(15, 2) NULL,
    sales_commission_percentage DECIMAL(5, 2) NULL,
    referral_id VARCHAR(20) NULL,
    cross_sell_count INT DEFAULT 0
);

CREATE TABLE employee (
    id INT PRIMARY KEY,                
    employee_id VARCHAR(20) NOT NULL,         
    name VARCHAR(255) NOT NULL,       
    email VARCHAR(255) NOT NULL,        
    photo_profile VARCHAR(255) NOT NULL,               
    job_position VARCHAR(255) NOT NULL,                
    organization_name VARCHAR(255) NOT NULL,           
    job_level VARCHAR(50) NOT NULL,                    
    branch VARCHAR(255) NOT NULL,                      
    manager_id INT                  
);

