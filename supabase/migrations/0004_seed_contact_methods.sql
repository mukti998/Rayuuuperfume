-- Seed contact methods for WhatsApp and Telegram
-- Run this in the Supabase SQL editor (bypasses RLS)
-- You can also add/edit more via the admin panel at /gateway-rayu/contact-methods

-- WhatsApp
INSERT INTO public.contact_methods (type, label, value, enabled, sort_order)
VALUES ('whatsapp', 'WhatsApp', '+251955055373', true, 0)
ON CONFLICT DO NOTHING;

-- Telegram
INSERT INTO public.contact_methods (type, label, value, enabled, sort_order)
VALUES ('telegram', 'Telegram', '+251955055373', true, 1)
ON CONFLICT DO NOTHING;
