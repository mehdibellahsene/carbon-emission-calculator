<script setup lang="ts">
import { ref } from 'vue';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const errorMessage = ref('');
const isLoading = ref(false);

const signInWithGoogle = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const result = await signInWithPopup(auth, googleProvider);
    userStore.setUser(result.user);
    router.push('/');
  } catch (error: any) {
    console.error('Authentication error:', error);
    errorMessage.value = error.message || 'Failed to authenticate';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="page-container">
    <div class="login-container">
      <h1 class="page-title fade-in">Climatiq Carbon Calculators</h1>
      <div class="login-card slide-up">
        <div class="login-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75c0 2.57 2.01 4.65 4.63 4.74.08-.01.16-.01.22 0h.1c2.63-.09 4.64-2.17 4.64-4.74C16.85 4.13 14.72 2 12 2zm0 9c-2.07 0-3.75-1.68-3.75-3.75 0-2.07 1.68-3.75 3.75-3.75s3.75 1.68 3.75 3.75c0 2.07-1.68 3.75-3.75 3.75zm7 12c0-3.87-3.13-7-7-7s-7 3.13-7 7h14z"/>
          </svg>
          <h2>Login</h2>
        </div>
        
        <p class="login-message">Sign in to track your carbon calculations and history</p>
        
        <div class="login-actions">
          <button 
            @click="signInWithGoogle" 
            class="btn google-btn"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Connecting...</span>
            <span v-else>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Continue with Google
            </span>
          </button>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  width: 100%;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 1rem;
}

.login-card {
  background: rgba(7, 173, 71, 0.779);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.login-header {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  svg {
    color: rgb(0, 0, 0);
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.8rem;
    margin: 0;
    color: rgb(255, 255, 255);
  }
}

.login-message {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: white;
  color: #333;
  padding: 0.75rem 1rem;
  border-radius: 50px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  svg {
    fill: #4285F4;
  }
  
  &:hover {
    background: #e3e3e3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.error-message {
  margin-top: 1rem;
  color: #ff6b6b;
  font-size: 0.9rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
}
</style>
