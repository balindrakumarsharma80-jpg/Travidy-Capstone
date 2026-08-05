CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  region TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT NOT NULL DEFAULT 1,
  travelers INT NOT NULL DEFAULT 1,
  travelers_label TEXT DEFAULT '2 Adults',
  budget INT NOT NULL DEFAULT 0,
  spent INT NOT NULL DEFAULT 0,
  weather TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trips TO anon, authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_public_read" ON public.trips FOR SELECT USING (true);

CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subtitle TEXT,
  price_label TEXT,
  rating NUMERIC(2,1),
  reviews INT,
  duration TEXT,
  image_key TEXT,
  position INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.recommendations TO anon, authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs_public_read" ON public.recommendations FOR SELECT USING (true);

CREATE TABLE public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day INT NOT NULL DEFAULT 1,
  time_label TEXT NOT NULL,
  title TEXT NOT NULL,
  place TEXT,
  category TEXT,
  price_label TEXT,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  image_key TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.itinerary_items TO anon, authenticated;
GRANT ALL ON public.itinerary_items TO service_role;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itin_public_read" ON public.itinerary_items FOR SELECT USING (true);
CREATE POLICY "itin_public_insert" ON public.itinerary_items FOR INSERT WITH CHECK (true);
CREATE POLICY "itin_public_update" ON public.itinerary_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE ON public.checklist_items TO anon, authenticated;
GRANT ALL ON public.checklist_items TO service_role;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "check_public_read" ON public.checklist_items FOR SELECT USING (true);
CREATE POLICY "check_public_insert" ON public.checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "check_public_update" ON public.checklist_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','ai')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_public_read" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_public_insert" ON public.chat_messages FOR INSERT WITH CHECK (true);

INSERT INTO public.trips (id, title, destination, region, start_date, end_date, days, travelers, travelers_label, budget, spent, weather)
VALUES ('11111111-1111-1111-1111-111111111111', 'Rishikesh Escape', 'Rishikesh', 'Uttarakhand', '2026-06-20', '2026-06-22', 3, 2, '2 Adults', 20000, 12500, '28°C • Sunny');

INSERT INTO public.recommendations (trip_id, name, category, subtitle, price_label, rating, reviews, duration, image_key, position) VALUES
('11111111-1111-1111-1111-111111111111','Shiv Shakti Hostel','hotel','Near Ram Jhula','₹1,200 / night',4.4,128,NULL,'hostel',1),
('11111111-1111-1111-1111-111111111111','River Rafting','activity','Marine Drive Rapids','₹900 / person',4.6,342,'4 hrs','rafting',2),
('11111111-1111-1111-1111-111111111111','Neelkanth Temple','attraction','Morning Visit',NULL,4.7,98,'30 mins','temple',3),
('11111111-1111-1111-1111-111111111111','Little Buddha Café','restaurant','Healthy Food','₹400',4.3,256,NULL,'cafe',4);

INSERT INTO public.itinerary_items (trip_id, day, time_label, title, place, category, price_label, duration, status, image_key, position) VALUES
('11111111-1111-1111-1111-111111111111',1,'8:00 AM','Breakfast','Little Buddha Café, Tapovan','restaurant','₹400','45 mins','navigate','cafe',1),
('11111111-1111-1111-1111-111111111111',1,'9:30 AM','Visit Ram Jhula','Iconic suspension bridge over River Ganga','attraction','Free','45 mins','completed','ramjhula',2),
('11111111-1111-1111-1111-111111111111',1,'11:30 AM','River Rafting','Marine Drive Rapids, Shivpuri','activity','₹900','3 – 4 hrs','upcoming','rafting',3),
('11111111-1111-1111-1111-111111111111',1,'2:00 PM','Lunch','Chotiwala Restaurant, Lakshman Jhula','restaurant','₹500','1 hr','navigate','cafe',4),
('11111111-1111-1111-1111-111111111111',1,'6:00 PM','Ganga Aarti','Triveni Ghat, Rishikesh','attraction','Free','45 mins','reminder','rishikesh',5),
('11111111-1111-1111-1111-111111111111',2,'7:00 AM','Yoga Session','Parmarth Niketan Ashram','activity','₹300','1 hr','upcoming','temple',1),
('11111111-1111-1111-1111-111111111111',2,'10:00 AM','Neelkanth Temple','Morning visit, hill drive','attraction','Free','3 hrs','upcoming','temple',2),
('11111111-1111-1111-1111-111111111111',2,'7:00 PM','Cafe Hopping','Tapovan Market','restaurant','₹600','2 hrs','upcoming','cafe',3),
('11111111-1111-1111-1111-111111111111',3,'8:00 AM','Hotel Check-out','Shiv Shakti Hostel','hotel','Free','30 mins','upcoming','hostel',1),
('11111111-1111-1111-1111-111111111111',3,'10:00 AM','Ram Jhula Walk','Last stroll by the Ganga','attraction','Free','1 hr','upcoming','ramjhula',2);

INSERT INTO public.checklist_items (trip_id, label, done, position) VALUES
('11111111-1111-1111-1111-111111111111','Breakfast',true,1),
('11111111-1111-1111-1111-111111111111','Carry Water Bottle',true,2),
('11111111-1111-1111-1111-111111111111','Hotel Check-out',true,3),
('11111111-1111-1111-1111-111111111111','Buy Rafting Ticket',false,4),
('11111111-1111-1111-1111-111111111111','Visit Ram Jhula',false,5),
('11111111-1111-1111-1111-111111111111','Pack Rain Jacket',false,6),
('11111111-1111-1111-1111-111111111111','Charge Power Bank',false,7);

INSERT INTO public.chat_messages (trip_id, role, text, created_at) VALUES
('11111111-1111-1111-1111-111111111111','user','I want a peaceful 3-day trip to Rishikesh under ₹20,000.', now() - interval '2 minutes'),
('11111111-1111-1111-1111-111111111111','ai','Perfect! I''ve created some recommendations for you.', now() - interval '1 minute');