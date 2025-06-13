<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '../stores/user';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

const user = computed(() => userStore.currentUser);
const isAuthenticated = computed(() => userStore.isAuthenticated);

const logout = async () => {
  await signOut(auth);
  userStore.clear();
  router.push('/login');
};
</script>

<template>
  <div class="user-profile">
    <template v-if="isAuthenticated">
      <div class="user-info">
        
        <span class="user-name">{{ user?.displayName }}</span>
      </div>
      <button @click="logout" class="logout-btn" aria-label="Logout">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </template>
    <router-link v-else to="/login" class="login-link">
      Sign In
    </router-link>
  </div>
</template>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-avatar-placeholder {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.user-name {
  color: white;
  font-size: 0.9rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
    transform: translateX(2px);
  }
}

.login-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
}
</style>
