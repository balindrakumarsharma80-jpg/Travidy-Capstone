DELETE FROM public.chat_messages;
DELETE FROM public.itinerary_items;
UPDATE public.checklist_items SET done = false;