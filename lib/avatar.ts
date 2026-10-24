"use client";

import { useEffect, useState } from "react";

export interface MascotAvatar {
  id: string;
  name: string;
  mood: string;
  src: string;
}

export const MASCOT_AVATARS: MascotAvatar[] = [
  { id: "happy", name: "Cheerful", mood: "Ready to track!", src: "/mascot/avatar_happy.png" },
  { id: "wink", name: "Playful", mood: "Savvy saver", src: "/mascot/avatar_wink.png" },
  { id: "surprised", name: "Excited", mood: "Goals on track!", src: "/mascot/avatar_surprised.png" },
  { id: "zen", name: "Peaceful", mood: "Budget in harmony", src: "/mascot/avatar_zen.png" },
];

const AVATAR_KEY = "budman_active_avatar";
const AVATAR_CHANGE_EVENT = "budman-avatar-change";

export function getActiveAvatar(): MascotAvatar {
  if (typeof window === "undefined") return MASCOT_AVATARS[0];
  const storedId = localStorage.getItem(AVATAR_KEY);
  const found = MASCOT_AVATARS.find((a) => a.id === storedId);
  return found || MASCOT_AVATARS[0];
}

export function setActiveAvatar(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AVATAR_KEY, id);
  window.dispatchEvent(new CustomEvent(AVATAR_CHANGE_EVENT, { detail: id }));
}

export function useActiveAvatar(): {
  avatar: MascotAvatar;
  setAvatar: (id: string) => void;
  allAvatars: MascotAvatar[];
} {
  const [avatar, setAvatarState] = useState<MascotAvatar>(MASCOT_AVATARS[0]);

  useEffect(() => {
    setAvatarState(getActiveAvatar());

    const handleChange = () => {
      setAvatarState(getActiveAvatar());
    };

    window.addEventListener(AVATAR_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(AVATAR_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    avatar,
    setAvatar: setActiveAvatar,
    allAvatars: MASCOT_AVATARS,
  };
}
