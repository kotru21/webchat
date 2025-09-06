## LocalWebChat

Modern real‑time web chat | Современный веб‑чат в реальном времени  
_Active development / Активная разработка_

![Status](https://img.shields.io/badge/Status-In_Development-yellow) ![License](https://img.shields.io/badge/License-MIT-blue)

English · Русский

---

## English

### 1. Overview

LocalWebChat is a full‑stack real‑time chat featuring public & private conversations, media (image / video / audio) with detection & audio duration, edit, soft delete placeholder, pinning, read receipts, presence (online + last activity), profile customization (avatar, banner, bio), dark/light theme, scroll + anchor restoration and a virtualized dynamic list (react-window). Frontend follows Feature‑Sliced Design (app / processes / pages / widgets / features / entities / shared). State is split into small isolated Zustand stores; React Query handles server cache.

### 2. Features

- Real‑time messaging (Socket.IO)
- Public (general) & private chats
- Optimistic send (pending → finalized / failed)
- Media: image / video / audio (duration extraction for audio)
- Edit, soft delete (placeholder retained), pin message
- Read receipts & unread counters
- Presence: online / offline + last activity timestamp
- Virtualized list (react-window) with dynamic height cache
- Scroll & anchor restoration per chat key
- Profile: avatar crop, banner, description
- Dark / light mode (prefers-color-scheme)
- Validation & rate limiting
- Security hardening (CSP, sanitization, JWT, upload processing)

### 3. Tech Stack

Frontend: React, Vite, Tailwind, Zustand, TanStack Query, react-window, framer-motion, date-fns.  
Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO, Multer, Sharp, JWT, bcrypt, express-validator.  
Security: helmet, express-rate-limit, xss-clean, express-mongo-sanitize, compression.

### 4. Architecture (FSD)

`app` · `processes` · `pages` · `widgets` · `features` · `entities` · `shared`

### 5. State Stores

- `chatStore`: selected user/chat meta, unread counters
- `messagesStore`: message lists, pending map, per-chat view (scroll anchor)

### 6. Message Lifecycle

1. Optimistic temp message appended (client id)
2. Server response replaces with persisted message (real id)
3. On error mark failed (UI hint / retry path)

### 7. Scroll Restoration

Key: `general` or `private:<userId>` → persist `{ scrollTop, anchorId, atBottom, ts }` to restore context & keep anchor stable while new messages stream.

### 8. Domain Models

Message fields:

```text
_id, sender, receiver, isPrivate, content,
mediaUrl?, mediaType?, audioDuration?,
isPinned?, readBy[], isDeleted?,
createdAt, updatedAt
```

### 9. REST API (base: <http://localhost:5000/api>)

Auth: `POST /auth/register`, `/auth/login`, `POST /auth/logout`, `GET/PUT /auth/profile`, `GET /auth/users/:id`, `GET /auth/me`  
Messages: `GET /messages`, `POST /messages`, `PUT /messages/:id`, `DELETE /messages/:id` (soft), `POST /messages/:id/read`, `POST /messages/:id/pin`  
Status: `GET /status/:userId`, `PUT /status`, `POST /status/activity`  
Chats: `GET /chats`

### 10. Socket Events

```text
user_connected, users_online, user_status_changed,
join_room, message_send, message_new,
message_read, message_updated, message_delete (reserved), message_pinned
```

### 11. Environment

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

### 12. Installation

```bash
git clone https://github.com/yourusername/local-webchat.git
cd local-webchat
npm install
cd server && npm install && cd ..
```

### 13. Development Run

Two terminals (or background start):

```bash
cd server && npm start &
npm run dev
```

Open: <http://localhost:5173>

### 14. Production Build

```bash
npm run build
```

Serve `dist/` with any static server (Nginx, serve, etc.) while backend keeps running on `PORT`.

### 15. NPM Scripts

```text
frontend: dev | build | preview | lint
backend:  start | dev (nodemon)
```

### 16. Security Notes

- helmet (CSP, headers)
- express-rate-limit (auth / message endpoints)
- xss-clean & express-mongo-sanitize
- JWT (Bearer + Socket handshake)
- Multer + Sharp (sanitized uploads & image processing)
- Compression for payload size

### 17. Performance Notes

- react-window virtualization keeps DOM small
- Dynamic row height cache + targeted `resetAfterIndex`
- Scroll anchor restoration prevents jump on new messages
- Fine-grained Zustand slices minimize re-renders

### 18. Contributing

1. Fork & create feature branch (`feature/xyz`)
2. Conventional commits
3. PR with context (screens / before-after)

### 19. License

MIT (see LICENSE)

---

## Русский

### 1. Обзор

LocalWebChat — полнофункциональный чат в реальном времени: общий и приватные диалоги, медиа (изображения / видео / аудио) с определением типа и длительностью аудио, редактирование, мягкое удаление (placeholder), закрепление, отметки прочтения, статусы (онлайн + последняя активность), профиль (аватар, баннер, описание), тёмная/светлая тема, восстановление скролла и якоря, виртуализированный динамический список. Фронтенд организован по Feature‑Sliced (app / processes / pages / widgets / features / entities / shared). Состояние раздроблено на небольшие Zustand‑сторы + React Query для серверного кэша.

### 2. Возможности

- Мгновенные сообщения (Socket.IO)
- Общий и приватные чаты
- Оптимистическая отправка (pending → finalized / failed)
- Медиа: изображение / видео / аудио (извлечение длительности аудио)
- Редактирование, мягкое удаление (плейсхолдер), закрепление
- Отметки прочтения и счётчики непрочитанного
- Онлайн / офлайн + последняя активность
- Виртуализация списка (react-window) с динамическими высотами
- Восстановление скролла и якоря на чат
- Профиль: обрезка аватара, баннер, описание
- Тёмная / светлая тема (prefers-color-scheme)
- Валидация и rate limit
- Усиленная безопасность (CSP, санация, JWT, обработка загрузок)

### 3. Технологии

Frontend: React, Vite, Tailwind, Zustand, TanStack Query, react-window, framer-motion, date-fns.  
Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO, Multer, Sharp, JWT, bcrypt, express-validator.  
Security: helmet, express-rate-limit, xss-clean, express-mongo-sanitize, compression.

### 4. Архитектура (FSD)

`app` · `processes` · `pages` · `widgets` · `features` · `entities` · `shared`

### 5. Состояние

- `chatStore`: выбранный пользователь / мета, непрочитанные
- `messagesStore`: списки сообщений, pending, представление чата (якорь скролла)

### 6. Жизненный цикл сообщения

1. Оптимистическое временное (client id)
2. Ответ сервера замещает (persisted id)
3. При ошибке пометка failed (UI / retry)

### 7. Восстановление скролла

Ключ: `general` или `private:<userId>` → сохраняем `{ scrollTop, anchorId, atBottom, ts }` для восстановления позиции и стабильного якоря при поступлении новых сообщений.

### 8. Модель Сообщения

```text
_id, sender, receiver, isPrivate, content,
mediaUrl?, mediaType?, audioDuration?,
isPinned?, readBy[], isDeleted?,
createdAt, updatedAt
```

### 9. REST API (база: <http://localhost:5000/api>)

Auth: `POST /auth/register`, `/auth/login`, `POST /auth/logout`, `GET/PUT /auth/profile`, `GET /auth/users/:id`, `GET /auth/me`  
Messages: `GET /messages`, `POST /messages`, `PUT /messages/:id`, `DELETE /messages/:id` (soft), `POST /messages/:id/read`, `POST /messages/:id/pin`  
Status: `GET /status/:userId`, `PUT /status`, `POST /status/activity`  
Chats: `GET /chats`

### 10. События Socket

```text
user_connected, users_online, user_status_changed,
join_room, message_send, message_new,
message_read, message_updated, message_delete (reserved), message_pinned
```

### 11. Переменные окружения

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

### 12. Установка

```bash
git clone https://github.com/yourusername/local-webchat.git
cd local-webchat
npm install
cd server && npm install && cd ..
```

### 13. Запуск (dev)

Два терминала (или запуск бэкенда в фоне):

```bash
cd server && npm start &
npm run dev
```

Открыть: <http://localhost:5173>

### 14. Продакшен сборка

```bash
npm run build
```

Раздавать `dist/` любым статичным сервером; backend продолжает работать на `PORT`.

### 15. Скрипты

```text
frontend: dev | build | preview | lint
backend:  start | dev (nodemon)
```

### 16. Безопасность

- helmet (заголовки, CSP)
- express-rate-limit (auth / messages)
- xss-clean & express-mongo-sanitize
- JWT (Bearer + Socket handshake)
- Multer + Sharp (обработка изображений, санация)
- Compression (уменьшение трафика)

### 17. Производительность

- Виртуализация (react-window)
- Кэш динамических высот + точечный reset
- Восстановление якоря без дёргания
- Мелкие Zustand‑сторы → меньше перерисовок

### 18. Вклад

1. Fork & ветка (`feature/xyz`)
2. Conventional commits
3. PR с описанием и скриншотами

### 19. Лицензия

MIT (см. LICENSE)

---

## Screenshots / Скриншоты

Auth / Авторизация:  
![Auth](https://github.com/user-attachments/assets/8ae98cb1-25e3-4b9a-90eb-92f4ec3c00e6)

Messages / Сообщения:  
![Messages](https://github.com/user-attachments/assets/629e5b93-9f8d-40a3-bbd6-bbc1d1beb7e2)

Edit / Редактирование:  
![Edit](https://github.com/user-attachments/assets/b84104ba-fac6-4d0a-9b69-76e211a69960)

---

## Contribution / Contacts

Author: [@kotru21](https://github.com/kotru21)

---

MIT © 2025
