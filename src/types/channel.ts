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
  json_data?: {
    userRoles?: Array<{
      userId: number;
      username?: string;
      roles: number[];
      roleNames?: string[];
    }>;
    projectName?: string;
    [key: string]: any;
  };
  owner?: {
    id: number;
    username: string;
    email: string;
    [key: string]: any;
  };
}


export interface Member {
  id: number;
  username: string;
  email: string;
  isMine?: boolean;
  isOwner?: boolean;
  avartar?: string;
}