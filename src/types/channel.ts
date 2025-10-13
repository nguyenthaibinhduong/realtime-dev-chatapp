export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  member_count?: number;
  members: Member[];
  isActive: boolean
  created_at?: string;
  updated_at?: string;
}


export interface Member {
  id: number;
  username: string;
  email: string;
  isMine?: boolean;
  isOwner?: boolean;
  avartar?: string;
}