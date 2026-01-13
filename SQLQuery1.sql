CREATE TABLE Admins (
    AdminID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL, -- Store hashed passwords only
    CreatedAt DATETIME DEFAULT GETDATE()
);
INSERT INTO Admins (Username, Email, PasswordHash) 
VALUES ('admin', 'admin@gmail.com', '123456789');
select* from Admins;

CREATE TABLE CustomerLeads (
    LeadID INT PRIMARY KEY IDENTITY(1,1),
    CustomerName NVARCHAR(100) NOT NULL,
    PINCode NVARCHAR(10) NOT NULL,
    Requirements NVARCHAR(MAX), -- JSON string of channels, cameras, etc.
    Status NVARCHAR(20) DEFAULT 'Pending Call', -- Matches Dashboard logic
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Create the Dealers table in CCTV_Platform database
CREATE TABLE Dealers (
    DealerID INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber NVARCHAR(15) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    ServicePIN NVARCHAR(6), -- To match them with leads in their 5-10km radius
    Status NVARCHAR(50) DEFAULT 'Pending Approval',
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Run this in SQL Server Management Studio (SSMS)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Dealers')
BEGIN
    CREATE TABLE Dealers (
        DealerID INT PRIMARY KEY IDENTITY(1,1),
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) UNIQUE NOT NULL,
        PhoneNumber NVARCHAR(15) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL, -- Store passwords here
        ServicePIN NVARCHAR(6) NULL,         -- Used for 5-10km radius matching
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

select*from Dealers;

select * from Admins;

select * from Admins;
select * from Dealers;

-- Update Dealers table to include business details
ALTER TABLE Dealers ADD 
    BusinessName NVARCHAR(150),
    GSTIN NVARCHAR(20),
    BusinessAddress NVARCHAR(MAX),
    City NVARCHAR(50);

    CREATE TABLE Products (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    ModelName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    RetailPrice DECIMAL(10, 2) NOT NULL,
    WholesalePrice DECIMAL(10, 2) NOT NULL, -- Only visible to verified dealers
    StockQuantity INT DEFAULT 0,
    ImageURL NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Technicians (
    TechnicianID INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(15) NOT NULL,
    IsAvailable BIT DEFAULT 1
);

CREATE TABLE ServiceTickets (
    TicketID INT PRIMARY KEY IDENTITY(1,1),
    CustomerName NVARCHAR(100) NOT NULL,
    CustomerPhone NVARCHAR(15) NOT NULL,
    IssueDescription NVARCHAR(MAX),
    Status NVARCHAR(20) DEFAULT 'Open', -- Open, In-Progress, Closed
    AssignedTechnicianID INT FOREIGN KEY REFERENCES Technicians(TechnicianID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ClosedAt DATETIME
);
