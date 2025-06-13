import { reactive, readonly } from 'vue';
import { User } from 'firebase/auth';

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
}

const state = reactive<UserState>({
  currentUser: null,
  isLoading: true
});

const setUser = (user: User | null) => {
  state.currentUser = user;
  state.isLoading = false;
};

const clear = () => {
  state.currentUser = null;
};

export const useUserStore = () => {
  return {
    state: readonly(state),
    setUser,
    clear,
    get currentUser() { return state.currentUser; },
    get isLoading() { return state.isLoading; },
    get isAuthenticated() { return !!state.currentUser; },
    get userId() { return state.currentUser?.uid || null; }
  };
};
