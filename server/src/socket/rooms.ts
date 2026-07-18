export const peerIdFromDmRoom = (
  selfId: string,
  roomId: string
): string | null => {
  const match = /^dm:([^:]+):([^:]+)$/.exec(roomId);
  if (!match) return null;
  const a = match[1];
  const b = match[2];
  if (!a || !b) return null;
  if (a === selfId) return b;
  if (b === selfId) return a;
  return null;
};

export {
  dmRoomId,
  isAllowedSocketRoom,
  userRoomId,
} from "../services/accessControl.js";
