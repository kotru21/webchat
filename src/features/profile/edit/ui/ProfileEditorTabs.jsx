// moved from components/Profile/ProfileEditorTabs.jsx
const ProfileEditorTabs = ({ activeTab, setActiveTab }) => (
  <div className="flex gap-2 border-b border-border/70 px-4 py-3">
    <button
      type="button"
      className={`m3-pill px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
        activeTab === "edit"
          ? "border border-primary/25 bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      onClick={() => setActiveTab("edit")}>
      Редактировать
    </button>
    <button
      type="button"
      className={`m3-pill px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
        activeTab === "preview"
          ? "border border-primary/25 bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      onClick={() => setActiveTab("preview")}>
      Предпросмотр
    </button>
  </div>
);

export default ProfileEditorTabs;
