export type UserRole = "user" | "agent" | "admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketComment = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type KbCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
};

export type KbArticle = {
  id: string;
  category_id: string | null;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
};

export type ChatStatus = "waiting" | "active" | "closed";

export type ChatSession = {
  id: string;
  user_id: string;
  agent_id: string | null;
  subject: string | null;
  status: ChatStatus;
  created_at: string;
  closed_at: string | null;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type AssetStatus = "available" | "assigned" | "in_repair" | "retired";

export type Asset = {
  id: string;
  asset_tag: string;
  name: string;
  category: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  status: AssetStatus;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
