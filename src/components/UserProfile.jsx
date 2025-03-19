import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import StatusIndicator from "./StatusIndicator";
import { STATUS_INFO } from "../constants/statusConstants";
import { FiLink, FiExternalLink } from "react-icons/fi";

const UserProfile = ({
  userId,
  onClose,
  anchorEl,
  containerClassName = "",
  isReversed,
}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/auth/users/${userId}`);
        setProfile(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
        setError("Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        !anchorEl?.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorEl]);

  // Парсинг и обработка ссылок в описании профиля
  const parseDescriptionWithLinks = (text) => {
    if (!text) return [];

    // Регулярное выражение для поиска URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // Поиск всех URL в тексте
    while ((match = urlRegex.exec(text)) !== null) {
      // Добавляем обычный текст до ссылки
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      // Добавляем ссылку
      parts.push({
        type: "link",
        url: match[0],
        content: match[0],
      });

      lastIndex = match.index + match[0].length;
    }

    // Добавляем оставшийся текст после последней ссылки
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }

    return parts;
  };

  if (loading) {
    return (
      <div
        ref={popoverRef}
        className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[320px] z-[1000] p-4 ${
          isReversed ? "profile-enter" : "profile-enter-reverse"
        } ${containerClassName}`}>
        <div className="animate-pulse">
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div>
          <div className="flex items-start gap-4 -mt-8 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-800"></div>
            <div className="flex-1 mt-8 min-w-0">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            </div>
          </div>
          <div className="mt-4 px-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        ref={popoverRef}
        className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[320px] p-4 z-[1000] ${
          isReversed ? "profile-enter" : "profile-enter-reverse"
        } ${containerClassName}`}>
        <div className="text-center text-red-500 py-4">
          <p>{error || "Ошибка загрузки профиля"}</p>
        </div>
      </div>
    );
  }

  // Обработка статуса пользователя
  const statusInfo = STATUS_INFO[profile.status] || STATUS_INFO.offline;

  const descriptionParts = parseDescriptionWithLinks(profile.description);

  return (
    <div
      ref={popoverRef}
      className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[320px] z-[1000] overflow-hidden ${
        isReversed ? "profile-enter" : "profile-enter-reverse"
      } ${containerClassName}`}
      style={{
        willChange: "transform, opacity",
      }}>
      {/* Баннер профиля */}
      <div className="h-28 overflow-hidden relative">
        {profile.banner ? (
          <img
            src={`${import.meta.env.VITE_API_URL}${profile.banner}`}
            alt="Баннер профиля"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
        )}
      </div>

      {/* Секция профиля */}
      <div className="relative px-4 pb-4">
        {/* Аватар пользователя с индикатором статуса и статус пользователя */}
        <div className="flex justify-between items-end -mt-10 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img
                src={
                  profile.avatar
                    ? `${import.meta.env.VITE_API_URL}${profile.avatar}`
                    : "/default-avatar.png"
                }
                alt="Аватар пользователя"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
            </div>
          </div>

          {/* Статус пользователя */}
          <div className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full mb-2">
            <StatusIndicator status={profile.status || "offline"} size="xs" />
            <span className="text-gray-700 dark:text-gray-300">
              {statusInfo.name}
            </span>
          </div>
        </div>

        {/* Имя пользователя и почта*/}
        <div className="mb-3 text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {profile.username || "Пользователь"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile.email}
          </p>
        </div>

        {/* Разделитель */}
        {profile.description && (
          <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        )}

        {/* Описание профиля с выделенными ссылками - выровнено по левому краю */}
        {profile.description && (
          <div className="mt-3 text-left">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              О пользователе
            </h3>
            <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed break-words">
              {descriptionParts.map((part, index) => {
                if (part.type === "link") {
                  // Ссылка
                  return (
                    <a
                      key={index}
                      href={part.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation(); // Предотвращение срабатывания обработчиков родительских элементов
                      }}
                      className="inline-flex items-center max-w-full text-blue-500 hover:underline hover:text-blue-600 font-medium my-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                      <FiLink className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      {/* Текст ссылки с обрезанием для длинных URL */}
                      <span className="truncate">
                        {part.content.length > 30
                          ? part.content.substring(0, 27) + "..."
                          : part.content}
                      </span>

                      {/* Иконка "открыть в новом окне" */}
                      <FiExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                    </a>
                  );
                } else {
                  // Обычный текст - обрабатываем переносы строк
                  return part.content
                    .split("\n")
                    .map((line, lineIndex, array) => (
                      <span
                        key={`${index}-${lineIndex}`}
                        className="whitespace-pre-line">
                        {line}
                        {lineIndex < array.length - 1 && <br />}
                      </span>
                    ));
                }
              })}
            </div>
          </div>
        )}

        {/* Дополнительная информация - выровнена по левому краю */}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-left">
          <p>
            Зарегистрирован: {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
