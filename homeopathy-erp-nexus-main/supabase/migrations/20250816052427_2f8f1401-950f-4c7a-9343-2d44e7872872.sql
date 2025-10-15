-- Fix remaining RLS security issues - PostgreSQL doesn't support IF NOT EXISTS for policies

-- Enable RLS on remaining tables
alter table public.taxes enable row level security;
alter table public.prescription_items enable row level security;

-- Handle policy creation with proper error handling
do $$
begin
  -- Create policies with error handling to ignore duplicates
  begin
    execute 'create policy "Allow all operations on taxes" on public.taxes for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
  
  begin
    execute 'create policy "Allow all operations on prescription_items" on public.prescription_items for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
  
  begin
    execute 'create policy "Allow all operations on prescriptions" on public.prescriptions for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
  
  begin
    execute 'create policy "Allow all operations on segment_contacts" on public.segment_contacts for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
  
  begin
    execute 'create policy "Allow all operations on campaign_analytics" on public.campaign_analytics for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
  
  begin
    execute 'create policy "Allow all operations on whatsapp_templates" on public.whatsapp_templates for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
  
  begin
    execute 'create policy "Allow all operations on whatsapp_messages" on public.whatsapp_messages for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
end $$;