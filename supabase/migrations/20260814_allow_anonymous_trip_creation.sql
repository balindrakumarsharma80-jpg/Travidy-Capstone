drop policy if exists "Owner or collaborator access trip" on trips;

create policy "Anyone can create a trip"
on trips for insert
with check (true);

create policy "Public or owned trip read"
on trips for select
using (user_id is null or auth.uid() = user_id or is_trip_collaborator(id, auth.uid()));

create policy "Owner, collaborator, or unclaimed trip update"
on trips for update
using (user_id is null or auth.uid() = user_id or is_trip_collaborator(id, auth.uid()));

create policy "Owner or unclaimed trip delete"
on trips for delete
using (user_id is null or auth.uid() = user_id); 
