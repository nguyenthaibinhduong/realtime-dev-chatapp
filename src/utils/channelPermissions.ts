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
  // Default permissions for non-private channels or when no user
  const defaultPermissions: ChannelPermissions = {
    isOwner: false,
    isPM: false,
    isBA: false,
    isTester: false,
    isDev: false,
    isViewer: false,
    userRoles: [],
  };

  // If not a private channel, return default permissions (all access)
  if (!channel || channel.type !== "group-private" || !userId) {

     return {...defaultPermissions}
  }

  // Check if user is owner
  const isOwner = channel.owner?.id === userId;

  // Get user roles from json_data
  const userRoleData = channel.json_data?.userRoles?.find(
    (ur: any) => ur.userId === userId
  );

  const userRoles = userRoleData?.roles || [];

  // Check specific roles
  const isPM = userRoles.includes(1);
  const isBA = userRoles.includes(2);
  const isTester = userRoles.includes(3);
  const isDev = userRoles.includes(4);
  const isViewer = userRoles.includes(0) || userRoles.length === 0;

  // PM and Owner have all permissions
  if (isOwner || isPM) {
    return {
      isOwner,
      isPM,
      isBA,
      isTester,
      isDev,
      isViewer: false,
      userRoles,
    };
  }

  // Viewer has no permissions
  if (isViewer && !isPM && !isOwner) {
    return {
      isOwner: false,
      isPM: false,
      isBA,
      isTester,
      isDev,
      isViewer: true,
      userRoles,
    };
  }

  // Role-based permissions
  return {
    isOwner: false,
    isPM: false,
    isBA,
    isTester,
    isDev,
    isViewer: false,
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
