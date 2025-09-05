import { useRef, useState, useCallback } from "react";

// Хук инкапсулирует состояние и операции редактирования профиля (link dialog, emoji insertion).
export function useEditProfileTab({ formData, onFormChange }) {
  const descriptionRef = useRef(null);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedTextRange, setSelectedTextRange] = useState({
    start: 0,
    end: 0,
  });

  const openLinkDialog = useCallback(() => {
    if (descriptionRef.current) {
      setSelectedTextRange({
        start: descriptionRef.current.selectionStart,
        end: descriptionRef.current.selectionEnd,
      });
    }
    setLinkUrl("");
    setShowLinkDialog(true);
  }, []);

  const insertLink = useCallback(() => {
    if (!linkUrl) {
      setShowLinkDialog(false);
      return;
    }
    let formattedUrl = linkUrl;
    if (!/^https?:\/\//i.test(formattedUrl))
      formattedUrl = "https://" + formattedUrl;
    const { start, end } = selectedTextRange;
    const newDescription =
      formData.description.substring(0, start) +
      formattedUrl +
      formData.description.substring(end);
    onFormChange("description", newDescription);
    setShowLinkDialog(false);
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.focus();
        descriptionRef.current.setSelectionRange(
          start + formattedUrl.length,
          start + formattedUrl.length
        );
      }
    }, 10);
  }, [formData.description, linkUrl, onFormChange, selectedTextRange]);

  const insertEmoji = useCallback(
    (emoji) => {
      if (!descriptionRef.current) return;
      const t = descriptionRef.current;
      const start = t.selectionStart;
      const end = t.selectionEnd;
      const newDescription =
        formData.description.substring(0, start) +
        emoji +
        formData.description.substring(end);
      onFormChange("description", newDescription);
      setTimeout(() => {
        t.focus();
        t.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    },
    [formData.description, onFormChange]
  );

  return {
    // refs
    descriptionRef,
    avatarInputRef,
    bannerInputRef,
    // state
    showLinkDialog,
    linkUrl,
    setLinkUrl,
    // actions
    openLinkDialog,
    insertLink,
    insertEmoji,
    closeLinkDialog: () => setShowLinkDialog(false),
  };
}

export default useEditProfileTab;
