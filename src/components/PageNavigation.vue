<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import routes from '../router';

const route = useRoute();
const router = useRouter();

const currentIndex = computed(() => {
  return routes.findIndex(r => r.name === route.name);
});

const hasPrev = computed(() => {
  return currentIndex.value > 0;
});

const hasNext = computed(() => {
  return currentIndex.value < routes.length - 1;
});

const goToPrev = () => {
  if (hasPrev.value) {
    router.push(routes[currentIndex.value - 1].path);
  }
};

const goToNext = () => {
  if (hasNext.value) {
    router.push(routes[currentIndex.value + 1].path);
  }
};
</script>

<template>
  <div class="page-navigation">
    <button 
      class="nav-arrow nav-prev" 
      :class="{ 'hidden': !hasPrev }"
      @click="goToPrev"
      aria-label="Previous page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span class="nav-glow"></span>
    </button>
    
    <button 
      class="nav-arrow nav-next" 
      :class="{ 'hidden': !hasNext }"
      @click="goToNext"
      aria-label="Next page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <span class="nav-glow"></span>
    </button>
  </div>
</template>

<style scoped>
@import './style/PageNavigation.css';
</style>