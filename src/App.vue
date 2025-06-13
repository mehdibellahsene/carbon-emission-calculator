<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';
import PageNavigation from './components/PageNavigation.vue';
import ToastContainer from './components/ToastContainer.vue';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from './stores/user';

const route = useRoute();
const userStore = useUserStore();

const currentPage = computed(() => {
  return route.name?.toString() || 'business-travel';
});

const pageTransition = ref('slide-left');
const hideNavigation = computed(() => route.meta.hideNavigation);

const setTransition = (direction: string) => {
  pageTransition.value = direction;
};

onMounted(() => {
  document.documentElement.classList.add('has-loaded');
  onAuthStateChanged(auth, (user) => {
    userStore.setUser(user);
  });
});
</script>

<template>
  <div class="app-container" :class="currentPage">
    <div class="geometric-bg">
      <div class="geo-shape shape1"></div>
      <div class="geo-shape shape2"></div>
      <div class="geo-shape shape3"></div>
    </div>
    <Navbar v-if="!hideNavigation" />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition :name="pageTransition" mode="out-in">
          <component :is="Component" @set-transition="setTransition" />
        </transition>
      </router-view>    </main>
    <PageNavigation v-if="!hideNavigation" />
    <ToastContainer />
  </div>
</template>

<style lang="scss">
:root {
  --color-white: #ffffff;
  --color-black: #000000;
  
  --color-business-travel-start: #43CE4F;
  --color-business-travel-end: #217A29;
  
  --color-intermodal-freight-start: #B682AB;
  --color-intermodal-freight-end: #67387C;
  
  --color-cloud-cpu-start: #5DAADB;
  --color-cloud-cpu-end: #307CAB;
  
  --color-cloud-storage-start: #D02556;
  --color-cloud-storage-end: #500926;
  
  --color-cloud-memory-start: #DB9537;
  --color-cloud-memory-end: #A8352B;
  
  --font-primary: 'Madimi One', sans-serif;
  
  --transition-default: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  --transition-slow: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  
  --glow-shadow: 0 0 40px rgba(255, 255, 255, 0.2);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Madimi One', sans-serif;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(7, 173, 71, 0.8), rgba(0, 128, 0, 0.8));
}

body {
  font-family: 'Madimi One', sans-serif;
  line-height: 1.5;
  color: var(--color-white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.5s ease;
  background: linear-gradient(135deg, rgba(7, 173, 71, 0.8), rgba(0, 128, 0, 0.8));
}

#app {
  height: 100%;
  width: 100%;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  transition: var(--transition-slow);
  position: relative;
  overflow: hidden;
  
  &.business-travel {
    background: linear-gradient(135deg, var(--color-business-travel-start), var(--color-business-travel-end));
  }
  
  &.intermodal-freight {
    background: linear-gradient(135deg, var(--color-intermodal-freight-start), var(--color-intermodal-freight-end));
  }
  
  &.cloud-cpu {
    background: linear-gradient(135deg, var(--color-cloud-cpu-start), var(--color-cloud-cpu-end));
  }
  
  &.cloud-storage {
    background: linear-gradient(135deg, var(--color-cloud-storage-start), var(--color-cloud-storage-end));
  }
  
  &.cloud-memory {
    background: linear-gradient(135deg, var(--color-cloud-memory-start), var(--color-cloud-memory-end));
  }
}

.geometric-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.geo-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  transition: all 10s ease-in-out;
}

.shape1 {
  width: 60vh;
  height: 60vh;
  bottom: -30vh;
  right: -10vh;
  animation: floatShape1 30s infinite alternate ease-in-out;
}

.shape2 {
  width: 40vh;
  height: 40vh;
  top: -15vh;
  left: 20vw;
  animation: floatShape2 25s infinite alternate ease-in-out;
}

.shape3 {
  width: 30vh;
  height: 30vh;
  bottom: 15vh;
  left: -15vh;
  animation: floatShape3 20s infinite alternate ease-in-out;
}

@keyframes floatShape1 {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-30px) rotate(15deg); }
}

@keyframes floatShape2 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(30px, 30px) rotate(-15deg); }
}

@keyframes floatShape3 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-20px, -25px) rotate(10deg); }
}

.main-content {
  flex: 1;
  padding: 0.8rem 1.5rem; /* Reduced from 1.5rem 2rem */
  display: flex;
  flex-direction: column;
  z-index: 1;
  overflow-y: auto;
  max-height: calc(100vh - 110px); /* Reduced slightly from 120px */
  margin-top: 20px; /* Reduced from 40px */
}

h1, h2, h3, h4, h5, h6 {
  color: var(--color-white);
  line-height: 1.2;
  letter-spacing: 0.5px;
}

// Page transitions with more dramatic effects
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
}

.slide-left-enter-from {
  transform: translateX(100px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100px);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100px);
  opacity: 0;
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(40px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive design
@media (min-width: 768px) {
  .main-content {
    padding: 1.5rem 2.5rem; /* Reduced from 2.5rem 3.5rem */
  }
}

@media (min-width: 1024px) {
  .main-content {
    padding: 2rem 3rem; /* Reduced from 3rem 4rem */
  }
}

// Form styling with futuristic touches
input, select, textarea, button {
  font-family: 'Madimi One', sans-serif;
}

.form-control, 
.form-select {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #333;
  border-radius: 12px;
  padding: 8px 12px; /* Reduced from 12px 16px */
  font-size: 0.95rem;
  width: 100%;
  transition: var(--transition-default);
  margin-bottom: 0.6rem; /* Reduced from 1rem */
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2), 0 8px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-white);
  border: none;
  border-radius: 30px;
  padding: 0.7rem 2rem; /* Reduced from 1rem 2.5rem */
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-default);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
  
  &:active {
    transform: translateY(-1px);
  }
}

// Fade and slide animations for content
.has-loaded .fade-in {
  animation: fadeIn 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.has-loaded .slide-up {
  animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

// For animations with delays
@for $i from 1 through 5 {
  .has-loaded .delay-#{$i} {
    animation-delay: #{$i * 0.12}s;
  }
}

// Add these new styles for navbar user account
.navbar-user {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 0.5rem;
  position: relative;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: var(--transition-default);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: var(--glow-shadow);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  svg {
    width: 22px;
    height: 22px;
    fill: rgba(255, 255, 255, 0.9);
  }
}

.user-info {
  margin-left: 0.75rem;
  max-width: 150px;
  
  .user-name {
    font-weight: 600;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-email {
    font-size: 0.8rem;
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 180px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  padding: 0.75rem 0;
  z-index: 100;
  transform-origin: top right;
  transition: transform 0.2s, opacity 0.2s;
  backdrop-filter: blur(10px);
  
  &.hidden {
    transform: scale(0.95);
    opacity: 0;
    pointer-events: none;
  }
  
  .dropdown-item {
    padding: 0.6rem 1.25rem;
    color: #333;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
    
    .icon {
      margin-right: 0.75rem;
      opacity: 0.7;
    }
  }
  
  .logout-item {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    color: #d9534f;
  }
}

// Media queries for responsive navbar user section
@media (max-width: 768px) {
  .user-info {
    display: none;
  }
  
  .navbar-user {
    padding: 0.25rem;
  }
}
</style>