import { useRef } from "react";
import UserProfileWidget from "./UserProfileWidget";

const PreviewProfileTab = ({ profile }) => {
  const containerRef = useRef(null);

  const handleStartChat = (user) => {
    console.log("Предпросмотр: начать чат с", user);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="m3-surface flex justify-center overflow-hidden rounded-2xl border border-border/70 p-4">
        <div className="w-full max-w-md">
          <UserProfileWidget
            profileData={profile}
            containerClassName="relative !shadow-none !rounded-none !w-auto !max-w-none"
            onStartChat={handleStartChat}
            currentUserId={profile?.id}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewProfileTab;
