import {
  mapMessagesArray,
  mapMessageDto,
} from "@features/messaging/mappers/messageMapper";

const EMPTY_CHAT = { messages: [], loaded: true };

function getChatByKey(chats, key) {
  return chats[key] || EMPTY_CHAT;
}

function omitPending(pendingMap, targetId) {
  return Object.fromEntries(
    Object.entries(pendingMap).filter(([id]) => id !== targetId)
  );
}

function updateMessagesInAllChats(chats, updater) {
  const nextChats = { ...chats };

  Object.keys(nextChats).forEach((key) => {
    nextChats[key] = {
      ...nextChats[key],
      messages: updater(nextChats[key].messages),
    };
  });

  return nextChats;
}

export function resolveChatKey(selectedUserId) {
  return selectedUserId ? `private:${selectedUserId}` : "general";
}

export function setChatMessagesMutation(state, selectedUserId, list) {
  const key = resolveChatKey(selectedUserId);

  return {
    chats: {
      ...state.chats,
      [key]: { messages: mapMessagesArray(list), loaded: true },
    },
  };
}

export function addMessageMutation(state, selectedUserId, dto) {
  const key = resolveChatKey(selectedUserId);
  const chat = getChatByKey(state.chats, key);
  const incoming = mapMessageDto(dto);
  const incomingId = incoming._id || incoming.id;
  const exists = chat.messages.some((message) => {
    const messageId = message._id || message.id;
    return messageId === incomingId;
  });

  if (exists) {
    return { chats: state.chats };
  }

  return {
    chats: {
      ...state.chats,
      [key]: { ...chat, messages: [...chat.messages, incoming] },
    },
  };
}

export function addPendingMessageMutation(state, selectedUserId, tempMessage) {
  const key = resolveChatKey(selectedUserId);
  const chat = getChatByKey(state.chats, key);

  return {
    chats: {
      ...state.chats,
      [key]: {
        ...chat,
        messages: [...chat.messages, { ...tempMessage, optimistic: true }],
      },
    },
    pending: { ...state.pending, [tempMessage._id]: { key } },
  };
}

export function finalizePendingMessageMutation(state, tempId, realDto) {
  const meta = state.pending[tempId];
  if (!meta) {
    return state;
  }

  const chat = state.chats[meta.key];
  if (!chat) {
    return state;
  }

  const realMessage = mapMessageDto(realDto);
  const alreadyExists = chat.messages.some(
    (message) => message._id === realMessage._id && message._id !== tempId
  );

  const nextMessages = alreadyExists
    ? chat.messages.filter((message) => message._id !== tempId)
    : chat.messages.map((message) =>
        message._id === tempId ? realMessage : message
      );

  return {
    chats: {
      ...state.chats,
      [meta.key]: {
        ...chat,
        messages: nextMessages,
      },
    },
    pending: omitPending(state.pending, tempId),
  };
}

export function failPendingMessageMutation(state, tempId) {
  const meta = state.pending[tempId];
  if (!meta) {
    return state;
  }

  const chat = state.chats[meta.key];
  if (!chat) {
    return state;
  }

  return {
    chats: {
      ...state.chats,
      [meta.key]: {
        ...chat,
        messages: chat.messages.map((message) =>
          message._id === tempId
            ? { ...message, failed: true, optimistic: false }
            : message
        ),
      },
    },
    pending: omitPending(state.pending, tempId),
  };
}

export function updateMessageMutation(state, messageId, dto) {
  const nextChats = updateMessagesInAllChats(state.chats, (messages) =>
    messages.map((message) =>
      message._id === messageId ? mapMessageDto(dto) : message
    )
  );

  return { chats: nextChats };
}

export function removeMessageMutation(state, messageId) {
  const nextChats = updateMessagesInAllChats(state.chats, (messages) =>
    messages.filter((message) => message._id !== messageId)
  );

  return { chats: nextChats };
}

export function markMessageDeletedMutation(state, messageId) {
  const nextChats = updateMessagesInAllChats(state.chats, (messages) =>
    messages.map((message) =>
      message._id === messageId
        ? { ...message, isDeleted: true, content: message.content }
        : message
    )
  );

  return { chats: nextChats };
}

export function markReadMutation(state, messageId, readBy) {
  const nextChats = updateMessagesInAllChats(state.chats, (messages) =>
    messages.map((message) =>
      message._id === messageId ? { ...message, readBy } : message
    )
  );

  return { chats: nextChats };
}

export function pinMessageMutation(state, messageId, isPinned) {
  const nextChats = updateMessagesInAllChats(state.chats, (messages) =>
    messages.map((message) =>
      message._id === messageId ? { ...message, isPinned } : message
    )
  );

  return { chats: nextChats };
}

export function saveChatViewMutation(state, selectedUserId, view) {
  const key = resolveChatKey(selectedUserId);

  return {
    chatViews: {
      ...state.chatViews,
      [key]: { ...view, ts: Date.now() },
    },
  };
}
