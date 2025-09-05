import { useRef } from "react";
import UserProfileWidget from "@features/profile/widgets/UserProfileWidget";

const PreviewProfileTab = ({ profile }) => {
  const containerRef = useRef(null);
  const handleStartChat = (user) => {
    console.log("Предпросмотр: начать чат с", user);
  };
  return (
    <div ref={containerRef} className="relative">
      <div className="flex justify-center rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
