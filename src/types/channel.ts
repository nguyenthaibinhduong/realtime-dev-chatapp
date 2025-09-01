export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  member_count?: number;
  members: Member[];
}


export interface Member {
  id: number;
  username: string;
  email: string;
  isMine?: boolean;
}