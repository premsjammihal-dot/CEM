import { db, mutateDb, nowIso, uid } from "./db";
import type { AppNotification, NotificationKind } from "./types";

/** Notifications service — in-app notification center per user. */

export function notify(userId: string, title: string, body: string, kind: NotificationKind): void {
  mutateDb((state) => {
    state.notifications.push({ id: uid("n"), userId, title, body, kind, read: false, createdAt: nowIso() });
  });
}

export function notifyMany(userIds: string[], title: string, body: string, kind: NotificationKind): void {
  mutateDb((state) => {
    for (const userId of userIds) {
      state.notifications.push({ id: uid("n"), userId, title, body, kind, read: false, createdAt: nowIso() });
    }
  });
}

export function myNotifications(userId: string): AppNotification[] {
  return db()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadCount(userId: string): number {
  return db().notifications.filter((n) => n.userId === userId && !n.read).length;
}

export function markRead(id: string): void {
  mutateDb((state) => {
    state.notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  });
}

export function markAllRead(userId: string): void {
  mutateDb((state) => {
    state.notifications = state.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n));
  });
}
