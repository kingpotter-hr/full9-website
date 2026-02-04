-- Migration: Initial Schema
-- Create content table for CMS
CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    section TEXT DEFAULT 'general',
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'html', 'image', 'color')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
);

-- Insert default content for Hero section
INSERT OR IGNORE INTO content (key, value, section, type) VALUES
('hero_title', 'ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์\nและ Gadget', 'hero', 'text'),
('hero_subtitle', 'รับผลิตแบบ OEM คุณภาพสูง', 'hero', 'text'),
('hero_description', 'เราคือผู้นำด้านอุปกรณ์เสริมโทรศัพท์มือถือและ Gadget ที่ทันสมัย พร้อมบริการรับผลิตสินค้าแบบ OEM ตามความต้องการของคุณ', 'hero', 'text');

-- Insert default content for About section
INSERT OR IGNORE INTO content (key, value, section, type) VALUES
('about_title', 'เกี่ยวกับ Full 9', 'about', 'text'),
('about_content', 'บริษัท ฟูล 9 จำกัด เป็นผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์มือถือและ Gadget ที่ทันสมัย เราดำเนินธุรกิจด้วยความมุ่งมั่นในการมอบสินค้าคุณภาพสูงให้กับลูกค้า พร้อมบริการรับผลิตสินค้าแบบ OEM ตามความต้องการเฉพาะทางของคุณ', 'about', 'text'),
('about_mission', 'มุ่งสร้างสรรค์นวัตกรรมอุปกรณ์เสริมและ Gadget ที่ตอบโจทย์ไลฟ์สไตล์คนยุคใหม่ ด้วยคุณภาพระดับสากลในราคาที่เข้าถึงได้', 'about', 'text'),
('about_vision', 'เป็นผู้นำด้านอุปกรณ์เสริมโทรศัพท์และ Gadget ในภูมิภาคเอเชียตะวันออกเฉียงใต้ ที่ลูกค้าไว้วางใจในคุณภาพและบริการ', 'about', 'text');

-- Insert default content for Contact section
INSERT OR IGNORE INTO content (key, value, section, type) VALUES
('contact_address', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110', 'contact', 'text'),
('contact_phone', '02-123-4567', 'contact', 'text'),
('contact_email', 'info@full9.co.th', 'contact', 'text'),
('contact_hours', 'จันทร์ - เสาร์ 08:00 - 17:00 น.', 'contact', 'text');

-- Insert sample portfolio items
INSERT OR IGNORE INTO portfolio (id, title, description, image_url, category, display_order, is_active) VALUES
(1, 'เคสโทรศัพท์ Premium', 'เคสโทรศัพท์คุณภาพสูง ผลิตจากวัสดุ TPU อย่างดี กันกระแทกได้ดี', 'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=400', 'เคสโทรศัพท์', 1, 1),
(2, 'สายชาร์จ Fast Charge', 'สายชาร์จรองรับ Fast Charge ถึง 60W ความยาว 2 เมตร', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400', 'สายชาร์จ', 2, 1),
(3, 'ที่วางโทรศัพท์ในรถ', 'ที่วางโทรศัพท์ในรถแบบแม่เหล็ก ติดแน่น ปรับมุมได้ 360 องศา', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', 'อุปกรณ์เสริม', 3, 1),
(4, 'หูฟังไร้สาย', 'หูฟังบลูทูธคุณภาพเสียงระดับ Hi-Fi แบตอึดใช้งานได้ 8 ชั่วโมง', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'หูฟัง', 4, 1),
(5, 'Power Bank 20000mAh', 'แบตสำรองความจุสูง รองรับชาร์จเร็ว PD 20W มี 2 พอร์ต USB', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400', 'แบตสำรอง', 5, 1),
(6, 'แท่นชาร์จไร้สาย', 'แท่นชาร์จไร้สาย 15W รองรับทั้ง iPhone และ Android', 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=400', 'ที่ชาร์จ', 6, 1);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
('primary_color', '#1B5E20'),
('gold_color', '#D4AF37'),
('cream_color', '#FDFBF7');