import { create } from "zustand";

interface UserInfo {
  id: string;
}

const useUserInfo = create<{
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo | null) => void;
}>((set) => ({
  userInfo: null,
  setUserInfo: (userInfo: UserInfo | null) => set({ userInfo }),
}));

export { useUserInfo };
