const TABS = [
  { id: "edit", label: "Редактировать" },
  { id: "preview", label: "Предпросмотр" },
];

const ProfileEditorTabs = ({ activeTab, setActiveTab }) => {
  const onKeyDown = (event) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    if (index < 0) return;

    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % TABS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    setActiveTab(TABS[next].id);
    document.getElementById(`profile-tab-${TABS[next].id}`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Разделы редактора профиля"
      className="flex gap-2 border-b border-border/70 px-4 py-3"
      onKeyDown={onKeyDown}>
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`profile-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`profile-tabpanel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`m3-pill cursor-pointer px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              selected
                ? "border border-primary/25 bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ProfileEditorTabs;
