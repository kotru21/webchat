## LocalWebChat

Modern real‑time web chat | Современный веб‑чат в реальном времени  
_Active development / Активная разработка_

![Status](https://img.shields.io/badge/Status-In_Development-yellow) ![License](https://img.shields.io/badge/License-MIT-blue)

[English](#english) • [Русский](#russian)

---

## English

### Overview

LocalWebChat is a full‑stack real‑time chat: public & private messaging, media, edit / soft delete / pin, read receipts, presence, profile customization and a virtualized list (react-window). Feature‑Sliced Design structure (app / processes / pages / widgets / features / entities / shared). State via small isolated Zustand stores. Scroll position with anchor is restored per chat.

### Features

- Real‑time messaging (Socket.IO)
- General & private chats
- Optimistic send (pending → finalize / fail)
- Media (image / video / audio) with type detection & audio duration
- Edit / soft delete placeholder / pin
- Read receipts & unread counters
- Online / offline + last activity
- Virtualized dynamic list
- Scroll & anchor restoration
- Profile (avatar, banner, description)
- Dark / light mode
- Validation + rate limiting
- Security hardening

### Stack

Frontend: React, Vite, Tailwind, Zustand, React Query, react-window, framer-motion, date-fns.  
Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO, Multer, Sharp, JWT, bcrypt, express-validator.  
Security: helmet, express-rate-limit, xss-clean, express-mongo-sanitize, compression.

### Architecture (FSD)

app · processes · pages · widgets · features · entities · shared

### State Stores

- chatStore (selected user, unread)
- messagesStore (messages, pending, chatViews)

### Message Lifecycle

1. Append optimistic temp message
2. Finalize on server response (replace)
3. Mark failed on error

### Scroll Restoration

Key: `general` or `private:<userId>`; stored `{ scrollTop, anchorId, atBottom, ts }`.

### Message Model

```text
_id, sender, receiver, isPrivate, content, mediaUrl?, mediaType?, audioDuration?, isPinned?, readBy?, isDeleted?, createdAt, updatedAt
```

### REST API (base: <http://localhost:5000/api>)

Auth: register, login, logout, profile, users/:id, me  
Messages: list, create, update, delete (soft), read, pin  
Status: :userId, update, activity  
Chats: list

### Socket Events

```text
user_connected, users_online, user_status_changed,
join_room, message_send, message_new,
message_read, message_updated, message_delete (reserved), message_pinned
```

### Environment

Frontend `.env`:

```bash
VITE_API_URL=http://localhost:5000
```

Backend `server/.env`:

```bash
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/webchat
JWT_SECRET=your_jwt_secret_key
```

### Install

```bash
git clone https://github.com/yourusername/local-webchat.git
cd local-webchat
npm install
cd server && npm install && cd ..
```

### Run (dev)

```bash
cd server && npm start &
npm run dev
```

### Build

```bash
npm run build
```

### Security

helmet, xss-clean, mongo-sanitize, rate limit, JWT, sanitized uploads

### Contributing

Fork → branch → commit → PR

### License

MIT

---

## Русский

### Обзор

Полнофункциональный чат: общий / приватные, медиа, редактирование, мягкое удаление, закрепление, прочтения, статусы, профиль, виртуализация, восстановление скролла и anchor. Архитектура FSD.

### Возможности

- Реальное время (Socket.IO)
- Общий и приватные чаты
- Оптимистическая отправка
- Медиа (image / video / audio)
- Редактирование / мягкое удаление / закрепление
- Отметки прочтения и непрочитанные
- Онлайн / офлайн + активность
- Виртуализированный список
- Восстановление скролла и anchor
- Профиль: аватар, баннер, описание
- Тёмная тема
- Валидация и rate limit
- Безопасность (helmet, sanitize)

### Стек

Frontend: React, Vite, Tailwind, Zustand, React Query, react-window.  
Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO, Multer, Sharp, JWT.  
Security: helmet, rate-limit, xss-clean, mongo-sanitize, compression.

### Архитектура

app · processes · pages · widgets · features · entities · shared

### Хранилища

chatStore, messagesStore

### Жизненный цикл

Отправка → temp → подтверждение → замена или fail

### Восстановление скролла

`general` / `private:<userId>` → `{ scrollTop, anchorId, atBottom }`

### Модель сообщения

```text
_id, sender, receiver, isPrivate, content, mediaUrl?, mediaType?, audioDuration?, isPinned?, readBy?, isDeleted?, createdAt, updatedAt
```

### REST API

Auth, Messages, Status, Chats (см. английскую секцию для деталей)

### События Socket

```text
user_connected, users_online, user_status_changed,
join_room, message_send, message_new,
message_read, message_updated, message_delete (reserved), message_pinned
```

### Переменные окружения

```bash
VITE_API_URL=http://localhost:5000
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/webchat
JWT_SECRET=your_jwt_secret_key
```

### Установка

```bash
git clone https://github.com/yourusername/local-webchat.git
cd local-webchat
npm install
cd server && npm install && cd ..
```

### Запуск

```bash
cd server && npm start &
npm run dev
```

### Безопасность

helmet, xss-clean, mongo-sanitize, rate limit, JWT

### Вклад

Fork → ветка → PR

### Лицензия

MIT

---

## Screenshots / Скриншоты

Auth:  
![Auth](https://github.com/user-attachments/assets/8ae98cb1-25e3-4b9a-90eb-92f4ec3c00e6)

Messages:  
![Messages](https://github.com/user-attachments/assets/629e5b93-9f8d-40a3-bbd6-bbc1d1beb7e2)

Edit:  
![Edit](https://github.com/user-attachments/assets/b84104ba-fac6-4d0a-9b69-76e211a69960)

---

## Contribution / Contacts

Author: @kotru21

```
HOST=http://localhost
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/webchat
JWT_SECRET=your_jwt_secret_key
```

### 9. Installation & Run

```bash
git clone https://github.com/yourusername/local-webchat.git
npm install
cd server && npm install && cd ..

# dev

- Мгновенные сообщения (Socket.IO)
- Общий и приватные чаты
- Оптимистическая отправка (pending → finalize / fail)
- Медиа (изображения / видео / аудио) + длительность аудио
- Редактирование / мягкое удаление / закрепление
- Отметки прочтения и непрочитанные
- Онлайн / офлайн + последняя активность
- Виртуализация списка (react-window)
- Восстановление скролла и якоря на чат
- Профиль: аватар, баннер, описание
- Тёмная тема (media)
- Валидация и rate limit
- Усиленная безопасность (helmet, xss-clean, mongo-sanitize)
cd server && npm start &
npm run dev

Frontend: React, Vite, Tailwind, Zustand, React Query, react-window, framer-motion, date-fns.
Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO, Multer, Sharp, JWT, bcrypt, express-validator.
Security: helmet, express-rate-limit, xss-clean, express-mongo-sanitize, compression.
```

Open: http://localhost:5173

Build production:

```bash
npm run build
```

(Serve dist via any static server; keep backend running.)

### 10. Scripts

```
npm run dev       - start Vite dev + HMR
npm run build     - production build
npm run preview   - preview built bundle
npm run lint      - ESLint
server: npm start / npm run dev (nodemon)
```

### 11. Performance Notes

- react-window virtualization cuts DOM size.
- Dynamic row height cache with resetAfterIndex on change.
- Scroll restoration avoids jank with deferred anchor resolution.
- Minimal global context: localized Zustand slices.

### 12. Security

- helmet CSP (images/media whitelisted)
- xss-clean + express-mongo-sanitize
- rate limiting (auth & message create/update)
- JWT auth (bearer / handshake token)
- Sanitized file uploads (multer + sharp transform path ready)

### 13. Contributing

1. Fork & branch (feature/xyz)
2. Commit conventional style
3. PR with context (screens / before-after)

### 14. License

MIT. See LICENSE.

---

## Русский

<a id="russian"></a>

### 1. Обзор

LocalWebChat — полнофункциональный чат в реальном времени: общий и приватные диалоги, медиа, правка, удаление (мягкое), закрепление, статусы, счётчики непрочитанного, виртуализированный список с восстановлением позиции и якоря. Фронтенд организован по Feature‑Sliced: app / processes / pages / widgets / features / entities / shared.

### 2. Возможности

- Мгновенные сообщения (Socket.IO)
- Общий и приватные чаты
- Оптимистическая отправка (pending → finalize / fail)
- Медиа (изображения / видео / аудио) + длительность аудио
- Редактирование / мягкое удаление / закрепление
- Отметки прочтения и непрочитанные
- Онлайн / офлайн + последняя активность
- Виртуализация списка (react-window)
- Восстановление скролла и якоря на чат
- Профиль: аватар, баннер, описание
- Тёмная тема (media)
- Валидация и rate limit
- Усиленная безопасность (helmet, xss-clean, mongo-sanitize)

### 3. Технологии

Frontend: React, Vite, Tailwind, Zustand, React Query, react-window, framer-motion, date-fns.
Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO, Multer, Sharp, JWT, bcrypt, express-validator.
Security: helmet, express-rate-limit, xss-clean, express-mongo-sanitize, compression.

Слои:
app — провайдеры, инициализация.
processes — сквозные процессы (например, синхронизация статусов).
pages — страницы маршрутов.
widgets — крупные блоки интерфейса.
features — функциональные единицы (отправка, редактирование, закрепление и т.п.).
entities — доменные сущности (message, user, status) и их логика.
shared — утилиты, хранилища, базовые компоненты.

### 5. Модель Сообщения

Поля:

```

```

### 6. REST API (кратко)

/api/auth: register, login, logout, profile (PUT), users/:id, me.
/api/messages: list, create, update, delete (soft), read, pin.
/api/status: :userId, update, activity.
/api/chats: список чатов.

### 7. События Socket

```
user_connected, users_online, user_status_changed,
join_room, message_send, message_new,
message_read, message_updated, message_delete (зарезервировано), message_pinned (вариант updated)
```

### 8. Переменные окружения

Frontend .env:
VITE_API_URL=http://localhost:5000
Backend .env:
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/webchat
JWT_SECRET=your_jwt_secret_key

### 9. Установка и запуск

```bash
git clone https://github.com/yourusername/local-webchat.git
cd local-webchat
npm install
cd server && npm install && cd ..
cd server && npm start &
npm run dev
```

Открыть: http://localhost:5173

Продакшен сборка: `npm run build` (раздавать содержимое dist + поднятый backend).

### 10. Скрипты

dev, build, preview, lint; сервер: start / dev (nodemon).

### 11. Производительность

Виртуализация, измерение динамических высот, отложенное восстановление якоря, минимизация глобального состояния.

### 12. Безопасность

helmet (CSP), xss-clean, mongo-sanitize, rate limit, JWT, проверка и санация загрузок.

### 13. Вклад

Fork → ветка → коммиты → PR с описанием изменений.

### 14. Лицензия

MIT.

---

## Screenshots / Скриншоты

Auth / Авторизация:  
![Auth](https://github.com/user-attachments/assets/8ae98cb1-25e3-4b9a-90eb-92f4ec3c00e6)

Messages / Сообщения:  
![Messages](https://github.com/user-attachments/assets/629e5b93-9f8d-40a3-bbd6-bbc1d1beb7e2)

Edit / Редактирование:  
![Edit](https://github.com/user-attachments/assets/b84104ba-fac6-4d0a-9b69-76e211a69960)

---

## Contribution / Контакты

PRs welcome. Author: [@kotru21](https://github.com/kotru21)
