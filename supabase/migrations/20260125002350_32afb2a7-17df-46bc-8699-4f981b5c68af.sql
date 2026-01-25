-- Update all facilities with null region_id to Ashanti/Kumasi
UPDATE facilities 
SET region_id = '8c795513-2e0f-45a8-986f-ab3f32bf6785',
    office_id = 'd4efea2e-0a9c-468a-8003-e90d575162ae'
WHERE region_id IS NULL OR office_id IS NULL;

-- Update all payments with null region_id to Ashanti/Kumasi
UPDATE payments 
SET region_id = '8c795513-2e0f-45a8-986f-ab3f32bf6785',
    office_id = 'd4efea2e-0a9c-468a-8003-e90d575162ae'
WHERE region_id IS NULL OR office_id IS NULL;