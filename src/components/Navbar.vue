<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import UserProfile from './UserProfile.vue';

const route = useRoute();
const router = useRouter();

const navItems = [
  { name: 'business-travel', title: ' Travel', path: '/', group: 'Business' },
  { name: 'intermodal-freight', title: ' Freight', path: '/intermodal-freight', group: 'Intermodal' },
  { name: 'cloud-cpu', title: 'CPU', path: '/cloud-cpu', group: 'Cloud Computing' },
  { name: 'cloud-storage', title: 'STORAGE', path: '/cloud-storage', group: 'Cloud Computing' },
  { name: 'cloud-memory', title: 'MEMORY', path: '/cloud-memory', group: 'Cloud Computing' },
  { name: 'carbon-history', title: 'HISTORY', path: '/carbon-history', group: 'Analytics' }
];

const currentIndex = computed(() => {
  return navItems.findIndex(item => item.name === route.name);
});

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <nav class="navbar">
    <div class="glass-panel"></div>
    <div class="progress-nav">
      <div 
        v-for="(item, index) in navItems" 
        :key="item.name"
        class="nav-item"
      >
        <div class="nav-text" 
             :class="{ 'active': item.name === route.name, 'has-group': item.group }"
             @click="navigateTo(item.path)">
          <div v-if="item.group" class="group-label">{{ item.group }}</div>
          <div class="title-label">{{ item.title }}</div>
        </div>
        
        <div class="nav-point-container">
          <div 
            class="nav-point" 
            :class="{ 
              'active': item.name === route.name,
              'completed': index < currentIndex
            }"
            @click="navigateTo(item.path)"
          ></div>
          
          <div 
            v-if="index < navItems.length - 1"
            class="nav-line"
            :class="{ 
              'active': index < currentIndex
            }"
          ></div>
        </div>
      </div>
    </div>
    
    <UserProfile class="user-profile-container" />
  </nav>
</template>

<style lang="scss" scoped>
.navbar {
  padding: 1.75rem 1.5rem;
  z-index: 10;
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
}

.glass-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  z-index: -1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.progress-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  text-align: center;
  
  &:last-child {
    .nav-line {
      display: none;
    }
  }
}

.nav-text {
  text-align: center;
  font-weight: 500;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  cursor: pointer;
  font-family: 'Madimi One', sans-serif;
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Changed from flex-end to center */
  align-items: center;
  letter-spacing: 0.5px;
  position: relative; /* Added to ensure proper positioning */
  
  &:hover {
    color: var(--color-white);
    transform: translateY(-3px);
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
  
  &.active {
    color: var(--color-white);
    font-weight: 600;
    transform: translateY(-3px);
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
  }
  
  .group-label {
    font-size: 0.7rem;
    opacity: 0.8;
    margin-bottom: 0.25rem;
    width: 100%;
    text-align: center;
    letter-spacing: 1px;
    
    @media (min-width: 768px) {
      font-size: 0.8rem;
    }
  }
  
  .title-label {
    width: 100%;
    text-align: center;
    white-space: normal; /* Allow wrapping */
    line-height: 1.2; /* Improve spacing for multi-line text */
  }
  
  /* Adjust spacing for items with/without group labels */
  &.has-group {
    padding-top: 0;
  }
  
  &:not(.has-group) {
    justify-content: center; /* Center single items vertically */
    padding-top: 10px; /* Add space at top to align with grouped items */
  }
}

.nav-point-container {
  display: flex;
  align-items: center;
  justify-content: center; /* Center the navigation point */
  width: 100%;
  height: 25px;
  position: relative;
}

.nav-point {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgb(255, 255, 255);
  border: 2px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  position: relative;
  z-index: 2;
  
  &:hover {
    transform: scale(1.2);
    box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.2), 0 0 20px rgba(255, 255, 255, 0.3);
  }
  
  &.active {
    background-color: var(--color-white);
    border-color: var(--color-white);
    transform: scale(1.3);
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.4);
  }
  
  &.completed {
    background-color: var(--color-white);
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 6px;
    height: 6px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    transition: all 0.5s ease;
  }
  
  &.active::after {
    transform: translate(-50%, -50%) scale(1);
  }
}

.nav-line {
  flex: 1;
  height: 2px;
  background-color: rgba(255, 255, 255, 0.3);
  transition: all 0.8s ease;
  position: absolute;
  top: 50%;
  left: 50%; /* Start from the center of the point */
  right: -20px; /* Extend the line further to the right */
  transform: translateY(-50%);
  z-index: 1;
  width: calc(100% - 11px); /* Adjust width to make the line longer */
  
  &.active {
    background-color: var(--color-white);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
}

.user-profile-container {
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
}
</style>