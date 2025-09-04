// React import не требуется

const ProfileEditorTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-gray-300 dark:border-gray-600">
      <button
        type="button"
        className={`px-4 py-2 font-medium text-sm focus:outline-none ${
          activeTab === "edit"
            ? "text-blue-500 border-b-2 border-blue-500"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        }`}
        onClick={() => setActiveTab("edit")}>
        Редактировать
      </button>
      <button
        type="button"
        className={`px-4 py-2 font-medium text-sm focus:outline-none ${
          activeTab === "preview"
            ? "text-blue-500 border-b-2 border-blue-500"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        }`}
        onClick={() => setActiveTab("preview")}>
        Предпросмотр
      </button>
    </div>
  );
};

export default ProfileEditorTabs;
