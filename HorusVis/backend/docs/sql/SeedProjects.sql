-- Data Dump for Projects Table
-- Generated: 2026-04-09
-- Database: horusvis
-- Table: Projects

-- Sample Project Records
-- Owner: SuperAdmin (c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3)

INSERT INTO horusvis."Projects" (
    "Id", 
    "ProjectKey", 
    "ProjectName", 
    "Description", 
    "OwnerUserId", 
    "Status", 
    "StartDate", 
    "EndDate", 
    "CreatedAt"
) VALUES

-- Project 1: Web Application Platform (Active)
(
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    'WEBAPP',
    'Web Application Platform',
    'Enterprise web application for internal management systems',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Active',
    '2026-01-15',
    '2026-12-31',
    '2026-01-15T10:30:00+00:00'
),

-- Project 2: Mobile App Development (Active)
(
    'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
    'MOBILE',
    'Mobile App Development',
    'Cross-platform mobile application for iOS and Android',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Active',
    '2026-02-01',
    '2026-09-30',
    '2026-02-01T08:00:00+00:00'
),

-- Project 3: Data Processing Engine (On Hold)
(
    'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
    'DATAENG',
    'Data Processing Engine',
    'Big data pipeline and analytics processing system',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'OnHold',
    '2026-03-01',
    '2026-08-31',
    '2026-03-01T14:15:00+00:00'
),

-- Project 4: Authentication Service Upgrade (Draft)
(
    'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7',
    'AUTHSVC',
    'Authentication Service Upgrade',
    'Modernize authentication and authorization infrastructure',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Draft',
    NULL,
    NULL,
    '2026-04-01T09:45:00+00:00'
),

-- Project 5: Documentation Portal (Active)
(
    'b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8',
    'DOCS',
    'Documentation Portal',
    'Central repository for technical and user documentation',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Active',
    '2025-06-01',
    '2026-05-31',
    '2025-06-01T11:20:00+00:00'
)
ON CONFLICT DO NOTHING;

-- Query: Verify inserted records
SELECT 
    "Id",
    "ProjectKey",
    "ProjectName",
    "Status",
    "StartDate",
    "EndDate",
    "CreatedAt"
FROM horusvis."Projects"
ORDER BY "CreatedAt" DESC;

-- Statistics
SELECT 
    "Status",
    COUNT(*) as "Count"
FROM horusvis."Projects"
GROUP BY "Status"
ORDER BY "Status";
