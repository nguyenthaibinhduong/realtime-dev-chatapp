import { Channel } from "@/types/channel";

/**
 * Role IDs
 * PM = 1
 * BA = 2
 * Tester = 3
 * Dev = 4
 * Viewer = 0
 */

export interface ChannelPermissions {
  isOwner: boolean;
  isPM: boolean;
  isBA: boolean;
  isTester: boolean;
  isDev: boolean;
  isViewer: boolean;
  userRoles: number[];
}

/**
 * Get user permissions for a channel
 */
export function getChannelPermissions(
  channel: Channel | null,
  userId: number | undefined
): ChannelPermissions {
  
  // Default permissions when no channel or user
  const noAccessPermissions: ChannelPermissions = {
    isOwner: false,
    isPM: false,
    isBA: false,
    isTester: false,
    isDev: false,
    isViewer: false,
    userRoles: [],
  };

  // If no channel or no userId
  if (!channel || !userId) {
    return noAccessPermissions;
  }

  // Check if user is owner
  const isOwner = channel?.owner?.id == userId;
  console.log("channel?.owner?.id:", channel?.owner?.id, " userId:", userId);
  

  // Check if user is member of the channel
  const isMember = channel.members?.some((member) => member.id === userId);

  // If not a member and not owner, no access
  if (!isMember) {
    return noAccessPermissions;
  }

  // For non-private channels (group, public), all members have full access
  if (channel.type !== "group-private") {
    return {
      isOwner,
      isPM: true,
      isBA: true,
      isTester: true,
      isDev: true,
      isViewer: false,
      userRoles: [1, 2, 3, 4], // All roles for public channels
    };
  }

  // For group-private channels, check roles from json_data
  const userRoleData = channel.json_data?.userRoles?.find(
    (ur: any) => ur.userId === userId
  );

  const userRoles = userRoleData?.roles || [0]; // Default to Viewer if no roles

  // Check specific roles
  const isPM = userRoles.includes(1);
  const isBA = userRoles.includes(2);
  const isTester = userRoles.includes(3);
  const isDev = userRoles.includes(4);
  const isViewer = userRoles.includes(0) && !isPM && !isBA && !isTester && !isDev;

  // Role-based permissions
  return {
    isOwner,
    isPM,
    isBA,
    isTester,
    isDev,
    isViewer,
    userRoles,
  };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  channel: Channel | null,
  userId: number | undefined,
  permission: keyof ChannelPermissions
): boolean {
  const permissions = getChannelPermissions(channel, userId);
  return permissions[permission] as boolean;
}
