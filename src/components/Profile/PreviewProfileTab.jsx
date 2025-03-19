import React from "react";

const PreviewProfileTab = ({ profile }) => {
  // Функция форматирования текста (ссылок и переносов строк)
  const formatDescription = (text) => {
    if (!text) return "";

    // Заменяем ссылки HTML-тегами
    const linkedText = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
    );

    // Заменяем переносы строк <br> тегами
    return linkedText.replace(/\n/g, "<br>");
  };

  // Получаем URL для аватара
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return "/default-avatar.png";
    if (avatarPath.startsWith("http")) return avatarPath; // Уже полный URL
    return `${import.meta.env.VITE_API_URL}${avatarPath}`;
  };

  // Получаем URL для баннера
  const getBannerUrl = (bannerPath) => {
    if (!bannerPath) return null;
    if (bannerPath.startsWith("http")) return bannerPath; // Уже полный URL
    return `${import.meta.env.VITE_API_URL}${bannerPath}`;
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Профиль */}
      <div className="animate-fade-in">
        {/* Баннер */}
        <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
          {profile.banner && (
            <img
              src={getBannerUrl(profile.banner)}
              alt="Баннер профиля"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Основная информация */}
        <div className="relative px-6 pt-16 pb-6 bg-white dark:bg-gray-800">
          {/* Аватар (накладывается на баннер) */}
          <div className="absolute -top-12 left-6">
            <img
              src={getAvatarUrl(profile.avatar)}
              alt="Аватар пользователя"
              className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
          </div>

          {/* Имя пользователя */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile.username || profile.email}
          </h2>

          {/* О себе */}
          {profile.description && (
            <div className="mt-4 text-gray-600 dark:text-gray-300 break-words">
              <div
                dangerouslySetInnerHTML={{
                  __html: formatDescription(profile.description),
                }}
              />
            </div>
          )}

          {/* Статистика */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-6">
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Статус:
              </span>{" "}
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  profile.status === "online" ? "bg-green-500" : "bg-gray-400"
                } mr-1`}></span>
              <span className="font-medium text-gray-900 dark:text-white">
                {profile.status === "online" ? "Онлайн" : "Оффлайн"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Дата регистрации:
              </span>{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewProfileTab;
