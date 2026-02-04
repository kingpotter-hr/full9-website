import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { FC } from 'react'
import { renderToString } from 'react-dom/server'

// Types
interface Env {
  DB: D1Database
  BUCKET: R2Bucket
  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string
}

// Schema definitions
const contentSchema = z.object({
  id: z.number().optional(),
  key: z.string(),
  value: z.string(),
  section: z.string(),
  type: z.enum(['text', 'html', 'image', 'color']),
  updated_at: z.string().optional()
})

const portfolioSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  description: z.string(),
  image_url: z.string(),
  category: z.string(),
  display_order: z.number(),
  is_active: z.number().default(1)
})

// HTML Template
const htmlTemplate = (content: string, title = 'Full 9 Company Limited') => `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="Full 9 Company Limited - ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์และ Gadget รับผลิตแบบ OEM">
  <link rel="stylesheet" href="/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-cream">
  <div id="root">${content}</div>
  <script src="/app.js"></script>
</body>
</html>`

// Create Hono app
const app = new Hono<{ Bindings: Env }>()

// CORS middleware
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204)
  }
  await next()
})

// ============ API Routes ============

// Get all content
app.get('/api/content', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM content ORDER BY section, key'
  ).all()
  return c.json(results)
})

// Get content by section
app.get('/api/content/:section', async (c) => {
  const section = c.req.param('section')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM content WHERE section = ? ORDER BY key'
  ).bind(section).all()
  return c.json(results)
})

// Get single content
app.get('/api/content/item/:key', async (c) => {
  const key = c.req.param('key')
  const result = await c.env.DB.prepare(
    'SELECT * FROM content WHERE key = ?'
  ).bind(key).first()
  return result ? c.json(result) : c.json({ error: 'Not found' }, 404)
})

// Create/Update content
app.post('/api/content', zValidator('json', contentSchema), async (c) => {
  const data = c.req.valid('json')
  const updated_at = new Date().toISOString()
  
  // Check if exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM content WHERE key = ?'
  ).bind(data.key).first()
  
  if (existing) {
    await c.env.DB.prepare(
      'UPDATE content SET value = ?, section = ?, type = ?, updated_at = ? WHERE key = ?'
    ).bind(data.value, data.section, data.type, updated_at, data.key).run()
  } else {
    await c.env.DB.prepare(
      'INSERT INTO content (key, value, section, type, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(data.key, data.value, data.section, data.type, updated_at).run()
  }
  
  return c.json({ success: true, message: 'Content saved' })
})

// Delete content
app.delete('/api/content/:key', async (c) => {
  const key = c.req.param('key')
  await c.env.DB.prepare('DELETE FROM content WHERE key = ?').bind(key).run()
  return c.json({ success: true, message: 'Content deleted' })
})

// ============ Portfolio API ============

// Get all portfolio items
app.get('/api/portfolio', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM portfolio WHERE is_active = 1 ORDER BY display_order'
  ).all()
  return c.json(results)
})

// Get all portfolio (admin)
app.get('/api/portfolio/all', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM portfolio ORDER BY display_order'
  ).all()
  return c.json(results)
})

// Get single portfolio
app.get('/api/portfolio/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const result = await c.env.DB.prepare(
    'SELECT * FROM portfolio WHERE id = ?'
  ).bind(id).first()
  return result ? c.json(result) : c.json({ error: 'Not found' }, 404)
})

// Create portfolio
app.post('/api/portfolio', zValidator('json', portfolioSchema), async (c) => {
  const data = c.req.valid('json')
  const result = await c.env.DB.prepare(
    'INSERT INTO portfolio (title, description, image_url, category, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(data.title, data.description, data.image_url, data.category, data.display_order, data.is_active).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// Update portfolio
app.put('/api/portfolio/:id', zValidator('json', portfolioSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')
  
  await c.env.DB.prepare(
    'UPDATE portfolio SET title = ?, description = ?, image_url = ?, category = ?, display_order = ?, is_active = ? WHERE id = ?'
  ).bind(data.title, data.description, data.image_url, data.category, data.display_order, data.is_active, id).run()
  
  return c.json({ success: true, message: 'Portfolio updated' })
})

// Delete portfolio
app.delete('/api/portfolio/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM portfolio WHERE id = ?').bind(id).run()
  return c.json({ success: true, message: 'Portfolio deleted' })
})

// ============ Settings API ============

// Get settings
app.get('/api/settings', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM settings'
  ).all()
  const settings: Record<string, string> = {}
  results?.forEach((row: any) => {
    settings[row.key] = row.value
  })
  return c.json(settings)
})

// Update setting
app.post('/api/settings', async (c) => {
  const { key, value } = await c.req.json()
  const existing = await c.env.DB.prepare(
    'SELECT id FROM settings WHERE key = ?'
  ).bind(key).first()
  
  if (existing) {
    await c.env.DB.prepare(
      'UPDATE settings SET value = ? WHERE key = ?'
    ).bind(value, key).run()
  } else {
    await c.env.DB.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?)'
    ).bind(key, value).run()
  }
  
  return c.json({ success: true })
})

// ============ Admin Auth ============

app.post('/api/admin/login', async (c) => {
  const { username, password } = await c.req.json()
  if (username === c.env.ADMIN_USERNAME && password === c.env.ADMIN_PASSWORD) {
    const token = btoa(`${username}:${Date.now()}`)
    return c.json({ success: true, token })
  }
  return c.json({ success: false, message: 'Invalid credentials' }, 401)
})

// ============ Public Pages ============

// Static CSS serving - inline the CSS content
app.get('/styles.css', async (c) => {
  return c.body(cssContent, 200, { 'Content-Type': 'text/css' })
})

// JavaScript app
app.get('/app.js', (c) => {
  return c.body(appJs, 200, { 'Content-Type': 'application/javascript' })
})

// Main page
app.get('/', async (c) => {
  return c.html(htmlTemplate(''))
})

app.get('/admin/*', async (c) => {
  return c.html(htmlTemplate('', 'Admin - Full 9 Company'))
})

app.get('/:path', async (c) => {
  return c.html(htmlTemplate(''))
})

// CSS Content - inline for Cloudflare Workers
const cssContent = \`/* Tailwind-inspired CSS for Full 9 Website */
/* Primary Colors: Green #1B5E20, Gold #D4AF37, Cream #FDFBF7 */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', 'Sarabun', system-ui, -apple-system, sans-serif; background-color: #FDFBF7; color: #1f2937; line-height: 1.6; }

.bg-primary { background-color: #1B5E20; }
.bg-gold { background-color: #D4AF37; }
.bg-cream { background-color: #FDFBF7; }
.text-primary { color: #1B5E20; }
.text-gold { color: #D4AF37; }

.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.z-50 { z-index: 50; }
.flex-1 { flex: 1; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }

.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.pt-20 { padding-top: 5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mx-auto { margin-left: auto; margin-right: auto; }

.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
.text-4xl { font-size: 2.25rem; }
.text-6xl { font-size: 3.75rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.leading-tight { line-height: 1.25; }
.leading-relaxed { line-height: 1.625; }
.tracking-wider { letter-spacing: 0.05em; }
.text-center { text-align: center; }

.w-full { width: 100%; }
.w-12 { width: 3rem; }
.h-12 { height: 3rem; }
.h-20 { height: 5rem; }
.h-64 { height: 16rem; }
.max-w-7xl { max-width: 80rem; }
.max-w-2xl { max-width: 42rem; }

.text-white { color: #ffffff; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.text-gray-900 { color: #111827; }
.text-red-600 { color: #dc2626; }
.text-blue-600 { color: #2563eb; }
.bg-white { background-color: #ffffff; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-200 { background-color: #e5e7eb; }
.bg-red-50 { background-color: #fef2f2; }

.border { border-width: 1px; }
.border-2 { border-width: 2px; }
.border-t { border-top-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }

.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-3xl { border-radius: 1.5rem; }
.rounded-full { border-radius: 9999px; }

.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }

.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-colors { transition-property: color, background-color, border-color; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-300 { transition-duration: 300ms; }
.duration-500 { transition-duration: 500ms; }

.hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
.hover\\:bg-gray-200:hover { background-color: #e5e7eb; }
.hover\\:bg-gold:hover { background-color: #D4AF37; }
.hover\\:bg-primary-dark:hover { background-color: #0D3311; }
.hover\\:text-primary:hover { color: #1B5E20; }
.hover\\:text-gold:hover { color: #D4AF37; }
.hover\\:text-white:hover { color: #ffffff; }
.hover\\:-translate-y-2:hover { transform: translateY(-0.5rem); }
.hover\\:scale-105:hover { transform: scale(1.05); }

.focus\\:border-primary:focus { border-color: #1B5E20; }
.focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(27, 94, 32, 0.2); }
.focus\\:outline-none:focus { outline: none; }

.cursor-pointer { cursor: pointer; }
.overflow-hidden { overflow: hidden; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.resize-none { resize: none; }
.opacity-0 { opacity: 0; }
.opacity-10 { opacity: 0.1; }
.opacity-80 { opacity: 0.8; }

.group:hover .group-hover\\:opacity-100 { opacity: 1; }
.group:hover .group-hover\\:scale-110 { transform: scale(1.1); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
.animate-spin { animation: spin 1s linear infinite; }

.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
.bg-gradient-to-t { background-image: linear-gradient(to top, var(--tw-gradient-stops)); }
.from-primary { --tw-gradient-from: #1B5E20; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(27, 94, 32, 0)); }
.from-gold { --tw-gradient-from: #D4AF37; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(212, 175, 55, 0)); }
.from-cream { --tw-gradient-from: #FDFBF7; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(253, 251, 247, 0)); }
.to-primary { --tw-gradient-to: #1B5E20; }
.to-gold { --tw-gradient-to: #D4AF37; }
.to-transparent { --tw-gradient-to: transparent; }
.to-white { --tw-gradient-to: #ffffff; }
.to-cream { --tw-gradient-to: #FDFBF7; }

.disabled\\:opacity-50:disabled { opacity: 0.5; }
.object-cover { object-fit: cover; }
.backdrop-blur-sm { backdrop-filter: blur(4px); }
.flex-shrink-0 { flex-shrink: 0; }

@media (min-width: 640px) {
  .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 768px) {
  .md\\:flex { display: flex; }
  .md\\:hidden { display: none; }
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .md\\:col-span-2 { grid-column: span 2 / span 2; }
  .md\\:text-4xl { font-size: 2.25rem; }
  .md\\:text-6xl { font-size: 3.75rem; }
}

@media (min-width: 1024px) {
  .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
  .lg\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #D4AF37; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #B7950B; }
\`

// JavaScript Application Code
const appJs = `
const { useState, useEffect, useRef } = React;

// Theme Configuration
const defaultTheme = {
  primary: '#1B5E20',
  gold: '#D4AF37',
  cream: '#FDFBF7'
};

// API Helper
const api = {
  get: async (url) => {
    const res = await fetch(url);
    return res.json();
  },
  post: async (url, data) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  put: async (url, data) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  delete: async (url) => {
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  }
};

// Navigation Component
const Navigation = ({ currentPage, setPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'หน้าแรก' },
    { id: 'portfolio', label: 'ผลงาน' },
    { id: 'about', label: 'เกี่ยวกับเรา' },
    { id: 'contact', label: 'ติดต่อเรา' }
  ];

  const scrollToSection = (id) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return React.createElement('nav', {
    className: \`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
      isScrolled ? 'bg-white/95 shadow-lg backdrop-blur-sm' : 'bg-transparent'
    }\`
  }, [
    React.createElement('div', { key: 'nav-container', className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
      React.createElement('div', { className: 'flex justify-between items-center h-20' }, [
        // Logo
        React.createElement('div', { 
          key: 'logo',
          className: 'flex items-center cursor-pointer',
          onClick: () => scrollToSection('home')
        }, [
          React.createElement('div', { 
            key: 'logo-icon',
            className: 'w-12 h-12 bg-gradient-to-br from-primary to-gold rounded-lg flex items-center justify-center mr-3' 
          }, 
            React.createElement('span', { className: 'text-white font-bold text-xl' }, 'F9')
          ),
          React.createElement('div', { key: 'logo-text' }, [
            React.createElement('h1', { className: 'text-xl font-bold text-primary' }, 'FULL 9'),
            React.createElement('p', { className: 'text-xs text-gold font-medium' }, 'COMPANY LIMITED')
          ])
        ]),

        // Desktop Navigation
        React.createElement('div', { key: 'desktop-nav', className: 'hidden md:flex items-center space-x-8' },
          navLinks.map(link => 
            React.createElement('button', {
              key: link.id,
              onClick: () => scrollToSection(link.id),
              className: 'text-gray-700 hover:text-primary font-medium transition-colors relative group'
            }, [
              link.label,
              React.createElement('span', { 
                key: 'underline',
                className: 'absolute bottom-0 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full' 
              })
            ])
          )
        ),

        // Mobile Menu Button
        React.createElement('button', {
          key: 'mobile-menu-btn',
          className: 'md:hidden p-2',
          onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen)
        }, 
          React.createElement('svg', { className: 'w-6 h-6 text-primary', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16' })
          )
        )
      ]),

      // Mobile Menu
      isMobileMenuOpen && React.createElement('div', { key: 'mobile-menu', className: 'md:hidden bg-white border-t' },
        navLinks.map(link =>
          React.createElement('button', {
            key: link.id,
            onClick: () => scrollToSection(link.id),
            className: 'block w-full text-left px-4 py-3 text-gray-700 hover:bg-cream hover:text-primary transition-colors'
          }, link.label)
        )
      )
    )
  ]);
};

// Hero Section
const HeroSection = ({ content }) => {
  const heroTitle = content?.hero_title?.value || 'ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์ \u0e41\u0e25\u0e30 Gadget';
  const heroSubtitle = content?.hero_subtitle?.value || 'รับผลิตแบบ OEM คุณภาพสูง';
  const heroDescription = content?.hero_description?.value || 'เราคือผู้นำด้านอุปกรณ์เสริมโทรศัพท์มือถือและ Gadget ที่ทันสมัย พร้อมบริการรับผลิตสินค้าแบบ OEM ตามความต้องการของคุณ';

  return React.createElement('section', { id: 'home', className: 'relative min-h-screen flex items-center pt-20' }, [
    // Background
    React.createElement('div', { key: 'bg', className: 'absolute inset-0 bg-gradient-to-br from-cream via-white to-cream' }),
    React.createElement('div', { key: 'pattern', className: 'absolute inset-0 opacity-10', style: {
      backgroundImage: \`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B5E20' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")\`
    }}),

    React.createElement('div', { key: 'content', className: 'relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20' },
      React.createElement('div', { className: 'grid md:grid-cols-2 gap-12 items-center' }, [
        // Text Content
        React.createElement('div', { key: 'text', className: 'animate-fade-in-up' }, [
          React.createElement('div', { key: 'badge', className: 'inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6' }, [
            React.createElement('span', { className: 'w-2 h-2 bg-gold rounded-full mr-2' }),
            'บริษัท ฟูล 9 จำกัด'
          ]),
          React.createElement('h1', { key: 'title', className: 'text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6' },
            heroTitle.split('\\n').map((line, i) => React.createElement('span', { key: i }, i > 0 && React.createElement('br'), React.createElement('span', { className: i === 0 ? '' : 'text-primary' }, line)))
          ),
          React.createElement('p', { key: 'subtitle', className: 'text-xl md:text-2xl text-gold font-semibold mb-4' }, heroSubtitle),
          React.createElement('p', { key: 'desc', className: 'text-gray-600 text-lg mb-8 leading-relaxed' }, heroDescription),
          React.createElement('div', { key: 'buttons', className: 'flex flex-wrap gap-4' }, [
            React.createElement('a', {
              key: 'btn-primary',
              href: '#contact',
              className: 'inline-flex items-center px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl'
            }, [
              'ติดต่อเรา',
              React.createElement('svg', { key: 'icon', className: 'w-5 h-5 ml-2', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M17 8l4 4m0 0l-4 4m4-4H3' })
              )
            ]),
            React.createElement('a', {
              key: 'btn-secondary',
              href: '#portfolio',
              className: 'inline-flex items-center px-8 py-4 border-2 border-gold text-gold rounded-lg font-semibold hover:bg-gold hover:text-white transition-colors'
            }, 'ดูผลงาน')
          ])
        ]),

        // Hero Image
        React.createElement('div', { key: 'image', className: 'relative hidden md:block' },
          React.createElement('div', { className: 'relative' }, [
            React.createElement('div', { key: 'glow', className: 'absolute inset-0 bg-gradient-to-r from-primary/20 to-gold/20 rounded-3xl blur-3xl transform scale-110' }),
            React.createElement('div', { key: 'card', className: 'relative bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-500' }, [
              React.createElement('div', { className: 'grid grid-cols-2 gap-4' }, [
                React.createElement('div', { key: 'item1', className: 'bg-gradient-to-br from-primary to-primary-light rounded-2xl p-6 text-white text-center' }, [
                  React.createElement('div', { className: 'text-4xl mb-2' }, '📱'),
                  React.createElement('p', { className: 'font-semibold' }, 'อุปกรณ์เสริม\nโทรศัพท์')
                ]),
                React.createElement('div', { key: 'item2', className: 'bg-gradient-to-br from-gold to-gold-light rounded-2xl p-6 text-white text-center' }, [
                  React.createElement('div', { className: 'text-4xl mb-2' }, '⌚'),
                  React.createElement('p', { className: 'font-semibold' }, 'Gadget\nทันสมัย')
                ]),
                React.createElement('div', { key: 'item3', className: 'bg-gradient-to-br from-gold-light to-gold rounded-2xl p-6 text-white text-center' }, [
                  React.createElement('div', { className: 'text-4xl mb-2' }, '🏭'),
                  React.createElement('p', { className: 'font-semibold' }, 'รับผลิต\nOEM')
                ]),
                React.createElement('div', { key: 'item4', className: 'bg-gradient-to-br from-primary-light to-primary rounded-2xl p-6 text-white text-center' }, [
                  React.createElement('div', { className: 'text-4xl mb-2' }, '✨'),
                  React.createElement('p', { className: 'font-semibold' }, 'คุณภาพ\nสูง')
                ])
              ])
            ])
          ])
        )
      ])
    )
  ]);
};

// Portfolio Section
const PortfolioSection = ({ portfolio }) => {
  const categories = ['ทั้งหมด', ...new Set(portfolio?.map(p => p.category).filter(Boolean))];
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const filteredPortfolio = activeCategory === 'ทั้งหมด' 
    ? portfolio 
    : portfolio?.filter(p => p.category === activeCategory);

  return React.createElement('section', { id: 'portfolio', className: 'py-20 bg-white' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' }, [
      // Header
      React.createElement('div', { key: 'header', className: 'text-center mb-16' }, [
        React.createElement('span', { className: 'text-gold font-semibold text-sm tracking-wider uppercase' }, 'Portfolio'),
        React.createElement('h2', { className: 'text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4' }, 'ผลงานของเรา'),
        React.createElement('p', { className: 'text-gray-600 max-w-2xl mx-auto' }, 'ตัวอย่างสินค้าที่เราเคยผลิตและจัดจำหน่าย ด้วยคุณภาพที่ได้มาตรฐาน')
      ]),

      // Category Filter
      React.createElement('div', { key: 'filters', className: 'flex flex-wrap justify-center gap-3 mb-12' },
        categories.map(cat =>
          React.createElement('button', {
            key: cat,
            onClick: () => setActiveCategory(cat),
            className: \`px-6 py-2 rounded-full font-medium transition-all \${
              activeCategory === cat 
                ? 'bg-primary text-white shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }\`
          }, cat)
        )
      ),

      // Portfolio Grid
      React.createElement('div', { key: 'grid', className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' },
        filteredPortfolio?.map((item, index) =>
          React.createElement('div', { 
            key: item.id,
            className: 'group bg-cream rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'
          }, [
            React.createElement('div', { key: 'image', className: 'relative h-64 overflow-hidden' }, [
              React.createElement('img', {
                src: item.image_url || 'https://via.placeholder.com/400x300?text=Full+9',
                alt: item.title,
                className: 'w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500'
              }),
              React.createElement('div', { className: 'absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' })
            ]),
            React.createElement('div', { key: 'content', className: 'p-6' }, [
              React.createElement('span', { className: 'text-xs font-semibold text-gold uppercase tracking-wider' }, item.category || 'สินค้า'),
              React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mt-2 mb-2' }, item.title),
              React.createElement('p', { className: 'text-gray-600 text-sm line-clamp-2' }, item.description)
            ])
          ])
        )
      )
    ])
  );
};

// About Section
const AboutSection = ({ content }) => {
  const aboutTitle = content?.about_title?.value || 'เกี่ยวกับ Full 9';
  const aboutContent = content?.about_content?.value || 'บริษัท ฟูล 9 จำกัด เป็นผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์มือถือและ Gadget ที่ทันสมัย เราดำเนินธุรกิจด้วยความมุ่งมั่นในการมอบสินค้าคุณภาพสูงให้กับลูกค้า พร้อมบริการรับผลิตสินค้าแบบ OEM ตามความต้องการเฉพาะทางของคุณ';
  const missionContent = content?.about_mission?.value || 'มุ่งสร้างสรรค์นวัตกรรมอุปกรณ์เสริมและ Gadget ที่ตอบโจทย์ไลฟ์สไตล์คนยุคใหม่ ด้วยคุณภาพระดับสากลในราคาที่เข้าถึงได้';
  const visionContent = content?.about_vision?.value || 'เป็นผู้นำด้านอุปกรณ์เสริมโทรศัพท์และ Gadget ในภูมิภาคเอเชียตะวันออกเฉียงใต้ ที่ลูกค้าไว้วางใจในคุณภาพและบริการ';

  const features = [
    { icon: '🏆', title: 'คุณภาพสูง', desc: 'สินค้าผ่านการตรวจสอบมาตรฐาน' },
    { icon: '🚚', title: 'จัดส่งรวดเร็ว', desc: 'ระบบขนส่งที่มีประสิทธิภาพ' },
    { icon: '🛠️', title: 'รับผลิต OEM', desc: 'ออกแบบตามความต้องการ' },
    { icon: '💎', title: 'ราคาโรงงาน', desc: 'ได้ราคาที่ดีที่สุด' }
  ];

  return React.createElement('section', { id: 'about', className: 'py-20 bg-cream' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' }, [
      React.createElement('div', { key: 'main', className: 'grid md:grid-cols-2 gap-16 items-center mb-20' }, [
        // Left - Image
        React.createElement('div', { key: 'image-section', className: 'relative' }, [
          React.createElement('div', { className: 'absolute -top-4 -left-4 w-24 h-24 bg-gold/20 rounded-full' }),
          React.createElement('div', { className: 'absolute -bottom-4 -right-4 w-32 h-32 bg-primary/20 rounded-full' }),
          React.createElement('div', { className: 'relative bg-white p-8 rounded-3xl shadow-xl' }, [
            React.createElement('div', { className: 'aspect-square bg-gradient-to-br from-primary to-gold rounded-2xl flex items-center justify-center' },
              React.createElement('div', { className: 'text-center text-white' }, [
                React.createElement('div', { className: 'text-6xl mb-4' }, '🏭'),
                React.createElement('p', { className: 'text-2xl font-bold' }, 'FULL 9'),
                React.createElement('p', { className: 'text-sm opacity-80' }, 'SINCE 2018')
              ])
            )
          ])
        ]),

        // Right - Content
        React.createElement('div', { key: 'content-section' }, [
          React.createElement('span', { className: 'text-gold font-semibold text-sm tracking-wider uppercase' }, 'About Us'),
          React.createElement('h2', { className: 'text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-6' }, aboutTitle),
          React.createElement('p', { className: 'text-gray-600 text-lg leading-relaxed mb-8' }, aboutContent),
          
          // Mission & Vision
          React.createElement('div', { className: 'space-y-6 mb-8' }, [
            React.createElement('div', { key: 'mission', className: 'flex items-start' }, [
              React.createElement('div', { className: 'w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4 flex-shrink-0' },
                React.createElement('span', { className: 'text-2xl' }, '🎯')
              ),
              React.createElement('div', [
                React.createElement('h4', { className: 'font-bold text-gray-900 mb-1' }, 'พันธกิจ'),
                React.createElement('p', { className: 'text-gray-600 text-sm' }, missionContent)
              ])
            ]),
            React.createElement('div', { key: 'vision', className: 'flex items-start' }, [
              React.createElement('div', { className: 'w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mr-4 flex-shrink-0' },
                React.createElement('span', { className: 'text-2xl' }, '👁️')
              ),
              React.createElement('div', [
                React.createElement('h4', { className: 'font-bold text-gray-900 mb-1' }, 'วิสัยทัศน์'),
                React.createElement('p', { className: 'text-gray-600 text-sm' }, visionContent)
              ])
            ])
          ])
        ])
      ]),

      // Features Grid
      React.createElement('div', { key: 'features', className: 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6' },
        features.map((feature, idx) =>
          React.createElement('div', { 
            key: idx,
            className: 'bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-center group'
          }, [
            React.createElement('div', { key: 'icon', className: 'text-4xl mb-4 transform group-hover:scale-110 transition-transform' }, feature.icon),
            React.createElement('h4', { key: 'title', className: 'font-bold text-gray-900 mb-2' }, feature.title),
            React.createElement('p', { key: 'desc', className: 'text-gray-600 text-sm' }, feature.desc)
          ])
        )
      )
    ])
  );
};

// Contact Section
const ContactSection = ({ content }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const contactInfo = [
    { icon: '📍', label: 'ที่อยู่', value: content?.contact_address?.value || '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110' },
    { icon: '📞', label: 'โทรศัพท์', value: content?.contact_phone?.value || '02-123-4567' },
    { icon: '📧', label: 'อีเมล', value: content?.contact_email?.value || 'info@full9.co.th' },
    { icon: '⏰', label: 'เวลาทำการ', value: content?.contact_hours?.value || 'จันทร์ - เสาร์ 08:00 - 17:00 น.' }
  ];

  return React.createElement('section', { id: 'contact', className: 'py-20 bg-white' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' }, [
      // Header
      React.createElement('div', { key: 'header', className: 'text-center mb-16' }, [
        React.createElement('span', { className: 'text-gold font-semibold text-sm tracking-wider uppercase' }, 'Contact'),
        React.createElement('h2', { className: 'text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4' }, 'ติดต่อเรา'),
        React.createElement('p', { className: 'text-gray-600 max-w-2xl mx-auto' }, 'สนใจสินค้าหรือบริการของเรา ติดต่อมาได้เลย เรายินดีให้คำปรึกษา')
      ]),

      React.createElement('div', { key: 'content', className: 'grid lg:grid-cols-2 gap-12' }, [
        // Contact Info
        React.createElement('div', { key: 'info' }, [
          React.createElement('div', { className: 'space-y-6 mb-8' },
            contactInfo.map((item, idx) =>
              React.createElement('div', { key: idx, className: 'flex items-start p-4 bg-cream rounded-xl' }, [
                React.createElement('div', { className: 'text-3xl mr-4' }, item.icon),
                React.createElement('div', [
                  React.createElement('p', { className: 'text-sm text-gold font-semibold' }, item.label),
                  React.createElement('p', { className: 'text-gray-700' }, item.value)
                ])
              ])
            )
          ),

          // Map placeholder
          React.createElement('div', { className: 'bg-gray-200 rounded-2xl h-64 flex items-center justify-center' }, [
            React.createElement('div', { className: 'text-center' }, [
              React.createElement('div', { className: 'text-5xl mb-2' }, '🗺️'),
              React.createElement('p', { className: 'text-gray-600' }, 'แผนที่ Google Maps'),
              React.createElement('a', { 
                href: 'https://maps.google.com',
                target: '_blank',
                className: 'text-primary hover:underline text-sm'
              }, 'ดูแผนที่ขนาดใหญ่')
            ])
          ])
        ]),

        // Contact Form
        React.createElement('div', { key: 'form', className: 'bg-cream p-8 rounded-3xl' },
          submitted 
            ? React.createElement('div', { className: 'text-center py-12' }, [
                React.createElement('div', { className: 'text-6xl mb-4' }, '✅'),
                React.createElement('h3', { className: 'text-2xl font-bold text-gray-900 mb-2' }, 'ส่งข้อความสำเร็จ!'),
                React.createElement('p', { className: 'text-gray-600 mb-4' }, 'เราจะติดต่อกลับโดยเร็วที่สุด'),
                React.createElement('button', {
                  onClick: () => setSubmitted(false),
                  className: 'text-primary hover:underline'
                }, 'ส่งข้อความใหม่')
              ])
            : React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' }, [
                React.createElement('div', { key: 'name' }, [
                  React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'ชื่อ-นามสกุล *'),
                  React.createElement('input', {
                    type: 'text',
                    required: true,
                    value: formData.name,
                    onChange: (e) => setFormData({...formData, name: e.target.value}),
                    className: 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                  })
                ]),
                React.createElement('div', { key: 'email', className: 'grid md:grid-cols-2 gap-4' }, [
                  React.createElement('div', [
                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'อีเมล *'),
                    React.createElement('input', {
                      type: 'email',
                      required: true,
                      value: formData.email,
                      onChange: (e) => setFormData({...formData, email: e.target.value}),
                      className: 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    })
                  ]),
                  React.createElement('div', [
                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'เบอร์โทรศัพท์'),
                    React.createElement('input', {
                      type: 'tel',
                      value: formData.phone,
                      onChange: (e) => setFormData({...formData, phone: e.target.value}),
                      className: 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    })
                  ])
                ]),
                React.createElement('div', { key: 'message' }, [
                  React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'ข้อความ *'),
                  React.createElement('textarea', {
                    required: true,
                    rows: 5,
                    value: formData.message,
                    onChange: (e) => setFormData({...formData, message: e.target.value}),
                    className: 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none'
                  })
                ]),
                React.createElement('button', {
                  key: 'submit',
                  type: 'submit',
                  disabled: isSubmitting,
                  className: 'w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center'
                }, isSubmitting 
                  ? [React.createElement('div', { key: 'spinner', className: 'w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2' }), 'กำลังส่ง...']
                  : 'ส่งข้อความ'
                )
              ])
        )
      ])
    ])
  );
};

// Footer
const Footer = () => {
  return React.createElement('footer', { className: 'bg-primary text-white py-12' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' }, [
      React.createElement('div', { key: 'main', className: 'grid md:grid-cols-4 gap-8 mb-8' }, [
        // Company Info
        React.createElement('div', { key: 'company', className: 'col-span-2' }, [
          React.createElement('div', { className: 'flex items-center mb-4' }, [
            React.createElement('div', { className: 'w-10 h-10 bg-gold rounded-lg flex items-center justify-center mr-3' },
              React.createElement('span', { className: 'text-primary font-bold' }, 'F9')
            ),
            React.createElement('div', [
              React.createElement('h3', { className: 'font-bold text-lg' }, 'FULL 9'),
              React.createElement('p', { className: 'text-xs text-gold' }, 'COMPANY LIMITED')
            ])
          ]),
          React.createElement('p', { className: 'text-white/70 text-sm leading-relaxed mb-4' }, 
            'ผู้เชี่ยวชาญด้านอุปกรณ์เสริมโทรศัพท์และ Gadget รับผลิตแบบ OEM คุณภาพสูง'
          )
        ]),

        // Quick Links
        React.createElement('div', { key: 'links' }, [
          React.createElement('h4', { className: 'font-semibold mb-4 text-gold' }, 'เมนู'),
          React.createElement('ul', { className: 'space-y-2 text-sm' }, [
            ['หน้าแรก', '#home'],
            ['ผลงาน', '#portfolio'],
            ['เกี่ยวกับเรา', '#about'],
            ['ติดต่อเรา', '#contact']
          ].map(([label, href]) =>
            React.createElement('li', { key: label },
              React.createElement('a', { href, className: 'text-white/70 hover:text-gold transition-colors' }, label)
            )
          ))
        ]),

        // Contact
        React.createElement('div', { key: 'contact' }, [
          React.createElement('h4', { className: 'font-semibold mb-4 text-gold' }, 'ติดต่อ'),
          React.createElement('ul', { className: 'space-y-2 text-sm text-white/70' }, [
            React.createElement('li', null, 'โทร: 02-123-4567'),
            React.createElement('li', null, 'อีเมล: info@full9.co.th'),
            React.createElement('li', null, 'กรุงเทพมหานคร, ประเทศไทย')
          ])
        ])
      ]),

      // Copyright
      React.createElement('div', { key: 'copyright', className: 'border-t border-white/20 pt-8 text-center text-sm text-white/60' },
        '© 2024 Full 9 Company Limited. All rights reserved.'
      )
    ])
  );
};

// Main App Component
const App = () => {
  const [content, setContent] = useState({});
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contentRes, portfolioRes] = await Promise.all([
          api.get('/api/content'),
          api.get('/api/portfolio')
        ]);
        
        // Convert content array to object
        const contentObj = {};
        contentRes?.forEach(item => {
          contentObj[item.key] = item;
        });
        
        setContent(contentObj);
        setPortfolio(portfolioRes || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-cream' },
      React.createElement('div', { className: 'text-center' }, [
        React.createElement('div', { key: 'spinner', className: 'w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4' }),
        React.createElement('p', { key: 'text', className: 'text-gray-600' }, 'กำลังโหลด...')
      ])
    );
  }

  return React.createElement('div', null, [
    React.createElement(Navigation, { key: 'nav' }),
    React.createElement(HeroSection, { key: 'hero', content }),
    React.createElement(PortfolioSection, { key: 'portfolio', portfolio }),
    React.createElement(AboutSection, { key: 'about', content }),
    React.createElement(ContactSection, { key: 'contact', content }),
    React.createElement(Footer, { key: 'footer' })
  ]);
};

// Check if we're on admin page
const isAdminPage = window.location.pathname.startsWith('/admin');

if (isAdminPage) {
  // Admin Dashboard
  const AdminApp = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const [content, setContent] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    // Login form state
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
      const token = localStorage.getItem('adminToken');
      if (token) setIsLoggedIn(true);
    }, []);

    useEffect(() => {
      if (isLoggedIn) loadData();
    }, [isLoggedIn]);

    const loadData = async () => {
      setLoading(true);
      try {
        const [contentRes, portfolioRes, settingsRes] = await Promise.all([
          api.get('/api/content'),
          api.get('/api/portfolio/all'),
          api.get('/api/settings')
        ]);
        setContent(contentRes || []);
        setPortfolio(portfolioRes || []);
        setSettings(settingsRes || {});
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    };

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        const res = await api.post('/api/admin/login', loginForm);
        if (res.success) {
          localStorage.setItem('adminToken', res.token);
          setIsLoggedIn(true);
        } else {
          setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
      } catch (error) {
        setLoginError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    };

    const handleLogout = () => {
      localStorage.removeItem('adminToken');
      setIsLoggedIn(false);
    };

    if (!isLoggedIn) {
      return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4' },
        React.createElement('div', { className: 'bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md' }, [
          React.createElement('div', { key: 'header', className: 'text-center mb-8' }, [
            React.createElement('div', { className: 'w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-4' },
              React.createElement('span', { className: 'text-2xl font-bold text-primary' }, 'F9')
            ),
            React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Admin Dashboard'),
            React.createElement('p', { className: 'text-gray-500' }, 'Full 9 Company Limited')
          ]),
          loginError && React.createElement('div', { key: 'error', className: 'bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm' }, loginError),
          React.createElement('form', { key: 'form', onSubmit: handleLogin, className: 'space-y-4' }, [
            React.createElement('div', [
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'ชื่อผู้ใช้'),
              React.createElement('input', {
                type: 'text',
                value: loginForm.username,
                onChange: (e) => setLoginForm({...loginForm, username: e.target.value}),
                className: 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
              })
            ]),
            React.createElement('div', [
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'รหัสผ่าน'),
              React.createElement('input', {
                type: 'password',
                value: loginForm.password,
                onChange: (e) => setLoginForm({...loginForm, password: e.target.value}),
                className: 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
              })
            ]),
            React.createElement('button', {
              type: 'submit',
              className: 'w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors'
            }, 'เข้าสู่ระบบ')
          ])
        ])
      );
    }

    return React.createElement('div', { className: 'min-h-screen bg-gray-100' }, [
      // Header
      React.createElement('header', { key: 'header', className: 'bg-white shadow-sm' },
        React.createElement('div', { className: 'px-6 py-4 flex justify-between items-center' }, [
          React.createElement('div', { className: 'flex items-center' }, [
            React.createElement('div', { className: 'w-10 h-10 bg-gold rounded-lg flex items-center justify-center mr-3' },
              React.createElement('span', { className: 'text-primary font-bold' }, 'F9')
            ),
            React.createElement('h1', { className: 'font-bold text-gray-900' }, 'Full 9 Admin')
          ]),
          React.createElement('button', {
            onClick: handleLogout,
            className: 'text-gray-600 hover:text-red-600 transition-colors'
          }, 'ออกจากระบบ')
        ])
      ),

      // Main Content
      React.createElement('div', { key: 'main', className: 'flex' }, [
        // Sidebar
        React.createElement('aside', { key: 'sidebar', className: 'w-64 bg-white min-h-screen shadow-sm' },
          React.createElement('nav', { className: 'p-4 space-y-2' }, [
            ['content', 'จัดการเนื้อหา', '📝'],
            ['portfolio', 'จัดการผลงาน', '🖼️'],
            ['settings', 'ตั้งค่าเว็บไซต์', '⚙️'],
            ['preview', 'ดูตัวอย่าง', '👁️']
          ].map(([tab, label, icon]) =>
            React.createElement('button', {
              key: tab,
              onClick: () => setActiveTab(tab),
              className: \`w-full flex items-center px-4 py-3 rounded-xl transition-colors \${
                activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }\`
            }, [
              React.createElement('span', { className: 'mr-3' }, icon),
              label
            ])
          ))
        ),

        // Content Area
        React.createElement('main', { key: 'content', className: 'flex-1 p-6' },
          activeTab === 'content' && React.createElement(ContentManager, { content, loadData }),
          activeTab === 'portfolio' && React.createElement(PortfolioManager, { portfolio, loadData }),
          activeTab === 'settings' && React.createElement(SettingsManager, { settings, loadData }),
          activeTab === 'preview' && React.createElement(PreviewPanel, null)
        )
      ])
    ]);
  };

  // Content Manager Component
  const ContentManager = ({ content, loadData }) => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ key: '', value: '', section: 'general', type: 'text' });

    const handleSave = async () => {
      await api.post('/api/content', formData);
      setEditing(null);
      setFormData({ key: '', value: '', section: 'general', type: 'text' });
      loadData();
    };

    const handleDelete = async (key) => {
      if (!confirm('ต้องการลบเนื้อหานี้?')) return;
      await api.delete(\`/api/content/\${key}\`);
      loadData();
    };

    const sections = [...new Set(content.map(c => c.section))];

    return React.createElement('div', null, [
      React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-6' }, [
        React.createElement('h2', { className: 'text-2xl font-bold' }, 'จัดการเนื้อหา'),
        React.createElement('button', {
          onClick: () => {
            setEditing('new');
            setFormData({ key: '', value: '', section: 'general', type: 'text' });
          },
          className: 'px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark'
        }, '+ เพิ่มเนื้อหา')
      ]),

      editing && React.createElement('div', { key: 'form', className: 'bg-white p-6 rounded-2xl shadow-sm mb-6' }, [
        React.createElement('h3', { className: 'font-semibold mb-4' }, editing === 'new' ? 'เพิ่มเนื้อหาใหม่' : 'แก้ไขเนื้อหา'),
        React.createElement('div', { className: 'grid md:grid-cols-2 gap-4 mb-4' }, [
          React.createElement('div', [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Key'),
            React.createElement('input', {
              value: formData.key,
              onChange: (e) => setFormData({...formData, key: e.target.value}),
              disabled: editing !== 'new',
              className: 'w-full px-3 py-2 border rounded-lg'
            })
          ]),
          React.createElement('div', [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Section'),
            React.createElement('select', {
              value: formData.section,
              onChange: (e) => setFormData({...formData, section: e.target.value}),
              className: 'w-full px-3 py-2 border rounded-lg'
            }, ['general', 'hero', 'about', 'contact'].map(s => 
              React.createElement('option', { key: s, value: s }, s)
            ))
          ]),
          React.createElement('div', [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Type'),
            React.createElement('select', {
              value: formData.type,
              onChange: (e) => setFormData({...formData, type: e.target.value}),
              className: 'w-full px-3 py-2 border rounded-lg'
            }, ['text', 'html', 'image', 'color'].map(t => 
              React.createElement('option', { key: t, value: t }, t)
            ))
          ])
        ]),
        React.createElement('div', { className: 'mb-4' }, [
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Value'),
          formData.type === 'html' 
            ? React.createElement('textarea', {
                value: formData.value,
                onChange: (e) => setFormData({...formData, value: e.target.value}),
                rows: 5,
                className: 'w-full px-3 py-2 border rounded-lg font-mono text-sm'
              })
            : React.createElement('input', {
                value: formData.value,
                onChange: (e) => setFormData({...formData, value: e.target.value}),
                className: 'w-full px-3 py-2 border rounded-lg'
              })
        ]),
        React.createElement('div', { className: 'flex gap-2' }, [
          React.createElement('button', {
            onClick: handleSave,
            className: 'px-4 py-2 bg-primary text-white rounded-lg'
          }, 'บันทึก'),
          React.createElement('button', {
            onClick: () => setEditing(null),
            className: 'px-4 py-2 bg-gray-200 rounded-lg'
          }, 'ยกเลิก')
        ])
      ]),

      // Content List
      React.createElement('div', { className: 'space-y-4' },
        sections.map(section =>
          React.createElement('div', { key: section, className: 'bg-white rounded-2xl shadow-sm overflow-hidden' }, [
            React.createElement('div', { className: 'bg-primary text-white px-6 py-3 font-semibold' }, section),
            React.createElement('table', { className: 'w-full' },
              React.createElement('tbody', null,
                content.filter(c => c.section === section).map(item =>
                  React.createElement('tr', { key: item.key, className: 'border-b last:border-0 hover:bg-gray-50' }, [
                    React.createElement('td', { className: 'px-6 py-4 font-medium' }, item.key),
                    React.createElement('td', { className: 'px-6 py-4 text-gray-600 max-w-md truncate' }, 
                      item.value.length > 50 ? item.value.substring(0, 50) + '...' : item.value
                    ),
                    React.createElement('td', { className: 'px-6 py-4' },
                      React.createElement('span', { className: 'text-xs bg-gray-100 px-2 py-1 rounded' }, item.type)
                    ),
                    React.createElement('td', { className: 'px-6 py-4 text-right' }, [
                      React.createElement('button', {
                        onClick: () => {
                          setEditing(item.key);
                          setFormData(item);
                        },
                        className: 'text-blue-600 hover:text-blue-800 mr-3'
                      }, 'แก้ไข'),
                      React.createElement('button', {
                        onClick: () => handleDelete(item.key),
                        className: 'text-red-600 hover:text-red-800'
                      }, 'ลบ')
                    ])
                  ])
                )
              )
            )
          ])
        )
      )
    ]);
  };

  // Portfolio Manager
  const PortfolioManager = ({ portfolio, loadData }) => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', image_url: '', category: '', display_order: 0, is_active: 1 });

    const handleSave = async () => {
      if (editing === 'new') {
        await api.post('/api/portfolio', formData);
      } else {
        await api.put(\`/api/portfolio/\${editing}\`, formData);
      }
      setEditing(null);
      loadData();
    };

    const handleDelete = async (id) => {
      if (!confirm('ต้องการลบผลงานนี้?')) return;
      await api.delete(\`/api/portfolio/\${id}\`);
      loadData();
    };

    return React.createElement('div', null, [
      React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-6' }, [
        React.createElement('h2', { className: 'text-2xl font-bold' }, 'จัดการผลงาน'),
        React.createElement('button', {
          onClick: () => {
            setEditing('new');
            setFormData({ title: '', description: '', image_url: '', category: '', display_order: 0, is_active: 1 });
          },
          className: 'px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark'
        }, '+ เพิ่มผลงาน')
      ]),

      editing && React.createElement('div', { key: 'form', className: 'bg-white p-6 rounded-2xl shadow-sm mb-6' }, [
        React.createElement('h3', { className: 'font-semibold mb-4' }, editing === 'new' ? 'เพิ่มผลงานใหม่' : 'แก้ไขผลงาน'),
        React.createElement('div', { className: 'grid md:grid-cols-2 gap-4 mb-4' }, [
          React.createElement('div', [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'ชื่อสินค้า'),
            React.createElement('input', {
              value: formData.title,
              onChange: (e) => setFormData({...formData, title: e.target.value}),
              className: 'w-full px-3 py-2 border rounded-lg'
            })
          ]),
          React.createElement('div', [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'หมวดหมู่'),
            React.createElement('input', {
              value: formData.category,
              onChange: (e) => setFormData({...formData, category: e.target.value}),
              className: 'w-full px-3 py-2 border rounded-lg'
            })
          ]),
          React.createElement('div', [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'ลำดับการแสดง'),
            React.createElement('input', {
              type: 'number',
              value: formData.display_order,
              onChange: (e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0}),
              className: 'w-full px-3 py-2 border rounded-lg'
            })
          ]),
          React.createElement('div', [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'รูปภาพ URL'),
            React.createElement('input', {
              value: formData.image_url,
              onChange: (e) => setFormData({...formData, image_url: e.target.value}),
              className: 'w-full px-3 py-2 border rounded-lg'
            })
          ]),
          React.createElement('div', { className: 'md:col-span-2' }, [
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'รายละเอียด'),
            React.createElement('textarea', {
              value: formData.description,
              onChange: (e) => setFormData({...formData, description: e.target.value}),
              rows: 3,
              className: 'w-full px-3 py-2 border rounded-lg'
            })
          ])
        ]),
        React.createElement('div', { className: 'flex gap-2' }, [
          React.createElement('button', {
            onClick: handleSave,
            className: 'px-4 py-2 bg-primary text-white rounded-lg'
          }, 'บันทึก'),
          React.createElement('button', {
            onClick: () => setEditing(null),
            className: 'px-4 py-2 bg-gray-200 rounded-lg'
          }, 'ยกเลิก')
        ])
      ]),

      // Portfolio List
      React.createElement('div', { className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' },
        portfolio.map(item =>
          React.createElement('div', { key: item.id, className: 'bg-white rounded-2xl shadow-sm overflow-hidden' }, [
            React.createElement('div', { className: 'aspect-video bg-gray-200' },
              item.image_url && React.createElement('img', { src: item.image_url, className: 'w-full h-full object-cover' })
            ),
            React.createElement('div', { className: 'p-4' }, [
              React.createElement('div', { className: 'flex justify-between items-start mb-2' }, [
                React.createElement('span', { className: 'text-xs bg-gold/20 text-gold px-2 py-1 rounded' }, item.category || 'ไม่มีหมวดหมู่'),
                React.createElement('span', { className: \`text-xs px-2 py-1 rounded \${item.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}\` }, 
                  item.is_active ? 'แสดง' : 'ซ่อน'
                )
              ]),
              React.createElement('h4', { className: 'font-semibold mb-1' }, item.title),
              React.createElement('p', { className: 'text-sm text-gray-600 mb-3 line-clamp-2' }, item.description),
              React.createElement('div', { className: 'flex gap-2' }, [
                React.createElement('button', {
                  onClick: () => {
                    setEditing(item.id);
                    setFormData(item);
                  },
                  className: 'flex-1 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20'
                }, 'แก้ไข'),
                React.createElement('button', {
                  onClick: () => handleDelete(item.id),
                  className: 'flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100'
                }, 'ลบ')
              ])
            ])
          ])
        )
      )
    ]);
  };

  // Settings Manager
  const SettingsManager = ({ settings, loadData }) => {
    const [formData, setFormData] = useState({
      primary_color: '#1B5E20',
      gold_color: '#D4AF37',
      cream_color: '#FDFBF7',
      ...settings
    });

    const handleSave = async () => {
      for (const [key, value] of Object.entries(formData)) {
        await api.post('/api/settings', { key, value });
      }
      alert('บันทึกการตั้งค่าเรียบร้อย');
      loadData();
    };

    const colorInputs = [
      { key: 'primary_color', label: 'สีหลัก (เขียวเข้ม)', default: '#1B5E20' },
      { key: 'gold_color', label: 'สีทอง', default: '#D4AF37' },
      { key: 'cream_color', label: 'สีพื้นหลัง (ครีม)', default: '#FDFBF7' }
    ];

    return React.createElement('div', null, [
      React.createElement('h2', { key: 'header', className: 'text-2xl font-bold mb-6' }, 'ตั้งค่าเว็บไซต์'),
      
      React.createElement('div', { key: 'colors', className: 'bg-white p-6 rounded-2xl shadow-sm mb-6' }, [
        React.createElement('h3', { className: 'font-semibold mb-4' }, 'ธีมสี'),
        React.createElement('div', { className: 'grid md:grid-cols-3 gap-4' },
          colorInputs.map(({ key, label, default: def }) =>
            React.createElement('div', { key }, [
              React.createElement('label', { className: 'block text-sm font-medium mb-2' }, label),
              React.createElement('div', { className: 'flex items-center gap-3' }, [
                React.createElement('input', {
                  type: 'color',
                  value: formData[key] || def,
                  onChange: (e) => setFormData({...formData, [key]: e.target.value}),
                  className: 'w-12 h-12 rounded cursor-pointer'
                }),
                React.createElement('input', {
                  type: 'text',
                  value: formData[key] || def,
                  onChange: (e) => setFormData({...formData, [key]: e.target.value}),
                  className: 'flex-1 px-3 py-2 border rounded-lg'
                })
              ])
            ])
          )
        )
      ]),

      React.createElement('button', {
        onClick: handleSave,
        className: 'px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark'
      }, 'บันทึกการตั้งค่า')
    ]);
  };

  // Preview Panel
  const PreviewPanel = () => {
    return React.createElement('div', null, [
      React.createElement('h2', { key: 'header', className: 'text-2xl font-bold mb-6' }, 'ดูตัวอย่างเว็บไซต์'),
      React.createElement('div', { className: 'bg-white p-6 rounded-2xl shadow-sm' }, [
        React.createElement('p', { className: 'text-gray-600 mb-4' }, 'คลิกที่ลิงก์ด้านล่างเพื่อดูตัวอย่างเว็บไซต์ในแท็บใหม่'),
        React.createElement('a', {
          href: '/',
          target: '_blank',
          className: 'inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark'
        }, [
          'เปิดเว็บไซต์',
          React.createElement('svg', { key: 'icon', className: 'w-4 h-4 ml-2', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' })
          )
        ])
      ])
    ]);
  };

  // Render Admin
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(AdminApp));
} else {
  // Render Main Website
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
}
