import ProfileCard from "./ProfileCard";

const PreviewProfileTab = ({ profile }) => {
  if (!profile) {
    return (
      <div
        role="tabpanel"
        id="profile-tabpanel-preview"
        aria-labelledby="profile-tab-preview">
        <p className="text-sm text-muted-foreground">
          Нет данных для предпросмотра
        </p>
      </div>
    );
  }

  return (
    <div
      role="tabpanel"
      id="profile-tabpanel-preview"
      aria-labelledby="profile-tab-preview"
      className="m3-surface flex justify-center overflow-visible rounded-2xl border border-border/70 p-4">
      <ProfileCard profile={profile} isCurrentUser />
    </div>
  );
};

export default PreviewProfileTab;
