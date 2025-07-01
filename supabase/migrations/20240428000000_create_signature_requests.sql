create table if not exists signature_requests (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references vault_documents(id) on delete cascade,
  sender_id uuid references profiles(id),
  recipient_email text not null,
  signature_request_id text not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_signature_requests_document_id on signature_requests(document_id); 