-- รันคำสั่งนี้ใน phpMyAdmin เพื่อแก้ไข password
-- รหัสผ่านใหม่: admin123

UPDATE admins 
SET password_hash = '$2y$10$G0xWIhsHpqd1CCS7Qbg6/0QGZwX3EnsqReI0Rs/gTult6xAhgMwdi'
WHERE email = 'admin@full9.co.th';
