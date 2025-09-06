// Selector helpers for chatStore (re-exporting for convenience)
import { useChatStore } from "./chatStore";
import {
  selectSelectedUser,
  selectUnreadCounts,
  selectUnreadByKey,
  selectSetSelectedUser,
  selectResetUnread,
  selectIncrementUnread,
  selectTotalUnread,
} from "./chatStore";

export const useSelectedUser = () => useChatStore(selectSelectedUser);
export const useUnreadCounts = () => useChatStore(selectUnreadCounts);
export const useUnreadByKey = (key) => useChatStore(selectUnreadByKey(key));
export const useSetSelectedUser = () => useChatStore(selectSetSelectedUser);
export const useResetUnread = () => useChatStore(selectResetUnread);
export const useIncrementUnread = () => useChatStore(selectIncrementUnread);
export const useTotalUnread = () => useChatStore(selectTotalUnread);
