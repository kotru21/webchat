import React, { useRef } from "react";
import UserProfile from "../UserProfile";

const PreviewProfileTab = ({ profile }) => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex justify-center rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-md">
          <UserProfile
            profileData={profile}
            containerClassName="relative !shadow-none !rounded-none !w-auto !max-w-none"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewProfileTab;
