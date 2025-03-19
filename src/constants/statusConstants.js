export const USER_STATUSES = {
  ONLINE: "online",
  AWAY: "away",
  DND: "dnd",
  INVISIBLE: "invisible",
  OFFLINE: "offline",
};

export const STATUS_INFO = {
  [USER_STATUSES.ONLINE]: {
    id: USER_STATUSES.ONLINE,
    name: "В сети",
    icon: "🟢",
    class: "bg-green-500",
    text: "В сети",
  },
  [USER_STATUSES.AWAY]: {
    id: USER_STATUSES.AWAY,
    name: "Отошел",
    icon: "🟡",
    class: "bg-yellow-500",
    text: "Отошел",
  },
  [USER_STATUSES.DND]: {
    id: USER_STATUSES.DND,
    name: "Не беспокоить",
    icon: "🔴",
    class: "bg-red-500",
    text: "Не беспокоить",
  },
  [USER_STATUSES.INVISIBLE]: {
    id: USER_STATUSES.INVISIBLE,
    name: "Невидимый",
    icon: "⚪",
    class: "bg-gray-400",
    text: "Невидимый",
  },
  [USER_STATUSES.OFFLINE]: {
    id: USER_STATUSES.OFFLINE,
    name: "Не в сети",
    icon: "⚫",
    class: "bg-gray-500",
    text: "Не в сети",
  },
};

// Автоматическое переключение статусов по времени неактивности (в мс)
export const AUTO_STATUS_TIMEOUTS = {
  AWAY: 5 * 60 * 1000, // 5 минут неактивности -> переход в "Отошел"
  OFFLINE: 30 * 60 * 1000, // 30 минут неактивности -> переход в "Не в сети"
};
