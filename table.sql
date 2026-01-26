CREATE TABLE invoices (
    ai INT PRIMARY KEY,
    invoice_number BIGINT NOT NULL,
    invoice_date TIMESTAMP NOT NULL,
    dpp DECIMAL(15, 2) NOT NULL,
    customer_service_id INT NOT NULL,
    customer_id VARCHAR(20) NOT NULL,
    customer_company VARCHAR(255) NOT NULL,
    service_group_id VARCHAR(20) NOT NULL,
    service_id VARCHAR(20) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    sales_id VARCHAR(20) NOT NULL,
    manager_sales_id VARCHAR(20) NOT NULL,
    is_new BOOLEAN NOT NULL,
    is_upgrade BOOLEAN NOT NULL,
    commission_amount DECIMAL(15, 2) NOT NULL,
    commission_percentage DECIMAL(5, 2) NOT NULL
    reseller VARCHAR(20) NULL,
);

CREATE TABLE sales (
    user_id INT PRIMARY KEY,                
    employee_id VARCHAR(20) NOT NULL,         
    name VARCHAR(255) NOT NULL,               
    photo_profile VARCHAR(255),               
    job_position VARCHAR(255),                
    organization_name VARCHAR(255),           
    job_level VARCHAR(50),                    
    branch VARCHAR(255),                      
    manager_id INT                  
);

