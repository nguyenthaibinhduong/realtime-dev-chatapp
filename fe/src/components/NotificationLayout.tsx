import MasterLayout from "@/components/MasterLayout";
import NotificationsList from "@/components/blocks/notifications/NotificationsList";
import NotificationDetail from "./blocks/notifications/NotificationDetail";
import { useState } from "react";
import MenubarLayout from "./MenubarLayout";
import { Notification } from "@/types/notifications";

export default function NotificationLayout({}) {
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  return (
    <MasterLayout
      menu={<MenubarLayout selected="notifications" />}
      sidebar={<NotificationsList />}
    >
      <NotificationDetail
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={(id) => {
          // Handle mark as read logic
          console.log("Mark as read:", id);
        }}
      />
    </MasterLayout>
  );
}
