<?php
// index.php - ดึงข้อมูลจาก Database
header('Content-Type: text/html; charset=utf-8');
require_once 'api/config.php';

$db = getDB();

// ดึงข้อมูลบริษัท
$stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
$settings = [];
while ($row = $stmt->fetch()) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

// ดึงสินค้า
$stmt = $db->query("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC");
$products = $stmt->fetchAll();

// ดึงสถิติ
$stat_years = $settings['stat_years'] ?? '10';
$stat_customers = $settings['stat_customers'] ?? '500';
$stat_products = $settings['stat_products'] ?? '1000';

// ฟังก์ชันแปลงหมวดหมู่
function getCategoryName($cat) {
    $names = ['case' => 'เคสโทรศัพท์', 'charger' => 'อุปกรณ์ชาร์จ', 'accessories' => 'อุปกรณ์เสริม'];
    return $names[$cat] ?? $cat;
}

// ฟังก์ชันแปลง subject
function getSubjectName($subject) {
    $names = ['oem' => 'สนใจผลิต OEM', 'product' => 'สอบถามสินค้า', 'partnership' => 'ร่วมงานเป็นพันธมิตร', 'other' => 'อื่นๆ'];
    return $names[$subject] ?? $subject;
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($settings['company_name'] ?? 'Full 9 Company'); ?> | <?php echo htmlspecialchars($settings['company_name_th'] ?? 'บริษัท ฟูล 9 จำกัด'); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($settings['company_description'] ?? 'ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์และ Gadget รับผลิตแบบ OEM'); ?>">
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar" id="navbar">
        <div class="container">
            <div class="nav-brand">
                <span class="logo-text">FULL<span class="highlight">9</span></span>
            </div>
            <ul class="nav-menu" id="navMenu">
                <li><a href="#home" class="nav-link active">หน้าแรก</a></li>
                <li><a href="#about" class="nav-link">เกี่ยวกับเรา</a></li>
                <li><a href="#products" class="nav-link">ผลงาน</a></li>
                <li><a href="#services" class="nav-link">บริการ</a></li>
                <li><a href="#contact" class="nav-link">ติดต่อเรา</a></li>
            </ul>
            <div class="hamburger" id="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero">
        <div class="hero-overlay"></div>
        <div class="container">
            <div class="hero-content">
                <h1 class="hero-title">
                    <span class="title-main">FULL 9</span>
                    <span class="title-sub">COMPANY LIMITED</span>
                </h1>
                <p class="hero-tagline"><?php echo htmlspecialchars($settings['company_description'] ?? 'ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์และ Gadget'); ?></p>
                <p class="hero-description">รับผลิตแบบ OEM คุณภาพสูง ตอบโจทย์ทุกความต้องการของคุณ</p>
                <div class="hero-buttons">
                    <a href="#products" class="btn btn-primary">
                        <i class="fas fa-box-open"></i> ดูผลงาน
                    </a>
                    <a href="#contact" class="btn btn-secondary">
                        <i class="fas fa-phone"></i> ติดต่อเรา
                    </a>
                </div>
            </div>
            <div class="hero-stats">
                <div class="stat-item">
                    <span class="stat-number"><?php echo $stat_years; ?>+</span>
                    <span class="stat-label">ปีประสบการณ์</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number"><?php echo $stat_customers; ?>+</span>
                    <span class="stat-label">ลูกค้า</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number"><?php echo $stat_products; ?>+</span>
                    <span class="stat-label">รายการสินค้า</span>
                </div>
            </div>
        </div>
        <div class="scroll-indicator">
            <i class="fas fa-chevron-down"></i>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="about">
        <div class="container">
            <div class="section-header">
                <span class="section-tag">เกี่ยวกับเรา</span>
                <h2 class="section-title"><?php echo htmlspecialchars($settings['company_name'] ?? 'FULL 9 COMPANY LIMITED'); ?></h2>
                <div class="section-line"></div>
            </div>
            <div class="about-grid">
                <div class="about-content">
                    <h3>ผู้นำด้านอุปกรณ์เสริมโทรศัพท์และ Gadget</h3>
                    <p>
                        <?php echo htmlspecialchars($settings['company_name_th'] ?? 'บริษัท ฟูล 9 จำกัด'); ?> เป็นผู้เชี่ยวชาญในการผลิตและจัดจำหน่ายอุปกรณ์เสริมโทรศัพท์มือถือ 
                        และ Gadget คุณภาพสูง เรามีประสบการณ์มากกว่า <?php echo $stat_years; ?> ปี ในการให้บริการลูกค้าทั้งในประเทศและต่างประเทศ
                    </p>
                    <p>
                        เรารับผลิตสินค้าแบบ OEM (Original Equipment Manufacturer) ตามความต้องการของลูกค้า 
                        ด้วยมาตรฐานการผลิตที่เข้มงวด และการควบคุมคุณภาพทุกขั้นตอน
                    </p>
                    <div class="about-features">
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>มาตรฐานสากล ISO 9001</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>ทีมงานมืออาชีพ</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>บริการครบวงจร</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>จัดส่งทั่วโลก</span>
                        </div>
                    </div>
                </div>
                <div class="about-image">
                    <div class="image-frame">
                        <div class="image-placeholder">
                            <i class="fas fa-industry"></i>
                            <span>โรงงานผลิต</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Products Section -->
    <section id="products" class="products">
        <div class="container">
            <div class="section-header">
                <span class="section-tag">ผลงานของเรา</span>
                <h2 class="section-title">สินค้าและบริการ</h2>
                <div class="section-line"></div>
            </div>
            <div class="products-filter">
                <button class="filter-btn active" data-filter="all">ทั้งหมด</button>
                <button class="filter-btn" data-filter="case">เคสโทรศัพท์</button>
                <button class="filter-btn" data-filter="charger">อุปกรณ์ชาร์จ</button>
                <button class="filter-btn" data-filter="accessories">อุปกรณ์เสริม</button>
            </div>
            <div class="products-grid">
                <?php foreach ($products as $product): ?>
                <div class="product-card" data-category="<?php echo $product['category']; ?>">
                    <div class="product-image">
                        <div class="product-placeholder">
                            <i class="<?php echo htmlspecialchars($product['icon']); ?>"></i>
                        </div>
                        <div class="product-overlay">
                            <span class="product-tag">OEM</span>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3><?php echo htmlspecialchars($product['name']); ?></h3>
                        <p><?php echo htmlspecialchars($product['description']); ?></p>
                        <ul class="product-specs">
                            <?php 
                            $features = json_decode($product['features'], true) ?: [];
                            foreach ($features as $feature): 
                            ?>
                            <li><i class="fas fa-check"></i> <?php echo htmlspecialchars($feature); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="services">
        <div class="container">
            <div class="section-header">
                <span class="section-tag">บริการ OEM</span>
                <h2 class="section-title">บริการรับผลิตแบบครบวงจร</h2>
                <div class="section-line"></div>
            </div>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-pencil-ruler"></i>
                    </div>
                    <h3>ออกแบบสินค้า</h3>
                    <p>ทีมดีไซน์มืออาชีพช่วยออกแบบสินค้าตามแนวคิดของคุณ พร้อม 3D Mockup</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-industry"></i>
                    </div>
                    <h3>ผลิตสินค้า</h3>
                    <p>โรงงานมาตรฐาน ISO ผลิตด้วยเครื่องจักรที่ทันสมัย ควบคุมคุณภาพทุกขั้นตอน</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <h3>แพ็คเกจจิ้ง</h3>
                    <p>ออกแบบและผลิต packaging ที่สวยงาม ตรงตาม brand identity</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-shipping-fast"></i>
                    </div>
                    <h3>จัดส่งทั่วโลก</h3>
                    <p>บริการจัดส่งสินค้าทั้งในและต่างประเทศ ด้วยพันธมิตรขนส่งที่เชื่อถือได้</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact">
        <div class="container">
            <div class="section-header">
                <span class="section-tag">ติดต่อเรา</span>
                <h2 class="section-title">ติดต่อสอบถาม</h2>
                <div class="section-line"></div>
            </div>
            <div class="contact-grid">
                <div class="contact-info">
                    <h3>ข้อมูลติดต่อ</h3>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="contact-details">
                            <h4>บริษัท</h4>
                            <p><?php echo htmlspecialchars($settings['company_name'] ?? 'FULL 9 COMPANY LIMITED'); ?><br><?php echo htmlspecialchars($settings['company_name_th'] ?? 'บริษัท ฟูล 9 จำกัด'); ?></p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="contact-details">
                            <h4>ที่อยู่</h4>
                            <p><?php echo htmlspecialchars($settings['company_address'] ?? 'กรุงเทพมหานคร, ประเทศไทย'); ?></p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-phone"></i>
                        </div>
                        <div class="contact-details">
                            <h4>โทรศัพท์</h4>
                            <p><?php echo htmlspecialchars($settings['company_phone'] ?? '+66 XX XXX XXXX'); ?></p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="contact-details">
                            <h4>อีเมล</h4>
                            <p><?php echo htmlspecialchars($settings['company_email'] ?? 'contact@full9.co.th'); ?></p>
                        </div>
                    </div>
                </div>
                <div class="contact-form-wrapper">
                    <form class="contact-form" id="contactForm">
                        <h3>ส่งข้อความถึงเรา</h3>
                        <div class="form-group">
                            <input type="text" id="name" name="name" placeholder="ชื่อของคุณ *" required>
                        </div>
                        <div class="form-group">
                            <input type="email" id="email" name="email" placeholder="อีเมล *" required>
                        </div>
                        <div class="form-group">
                            <input type="tel" id="phone" name="phone" placeholder="เบอร์โทรศัพท์">
                        </div>
                        <div class="form-group">
                            <select id="subject" name="subject">
                                <option value="">เลือกหัวข้อ</option>
                                <option value="oem">สนใจผลิต OEM</option>
                                <option value="product">สอบถามสินค้า</option>
                                <option value="partnership">ร่วมงานเป็นพันธมิตร</option>
                                <option value="other">อื่นๆ</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <textarea id="message" name="message" rows="5" placeholder="ข้อความ *" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-paper-plane"></i> ส่งข้อความ
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <span class="logo-text">FULL<span class="highlight">9</span></span>
                    <p>ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์และ Gadget<br>รับผลิตแบบ OEM คุณภาพสูง</p>
                </div>
                <div class="footer-links">
                    <h4>ลิงก์ด่วน</h4>
                    <ul>
                        <li><a href="#home">หน้าแรก</a></li>
                        <li><a href="#about">เกี่ยวกับเรา</a></li>
                        <li><a href="#products">ผลงาน</a></li>
                        <li><a href="#services">บริการ</a></li>
                        <li><a href="#contact">ติดต่อเรา</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>บริการ</h4>
                    <ul>
                        <li><a href="#">ผลิต OEM</a></li>
                        <li><a href="#">ออกแบบสินค้า</a></li>
                        <li><a href="#">แพ็คเกจจิ้ง</a></li>
                        <li><a href="#">จัดส่งสินค้า</a></li>
                    </ul>
                </div>
                <div class="footer-contact">
                    <h4>ติดต่อ</h4>
                    <p><i class="fas fa-envelope"></i> <?php echo htmlspecialchars($settings['company_email'] ?? 'contact@full9.co.th'); ?></p>
                    <p><i class="fas fa-phone"></i> <?php echo htmlspecialchars($settings['company_phone'] ?? '+66 XX XXX XXXX'); ?></p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; <?php echo date('Y'); ?> <?php echo htmlspecialchars($settings['company_name'] ?? 'FULL 9 COMPANY LIMITED'); ?>. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="js/main.js"></script>
    <script>
        // Contact Form Handler
        document.getElementById('contactForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            try {
                const res = await fetch('api/inquiries.php?action=submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await res.json();
                if (result.success) {
                    alert('ส่งข้อความสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด');
                    this.reset();
                } else {
                    alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                }
            } catch (e) {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    </script>
</body>
</html>
