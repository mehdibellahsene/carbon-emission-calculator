<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast-list" tag="div">
        <ToastNotification
          v-for="toast in toasts"
          :key="toast.id"
          :message="toast.message"
          :type="toast.type"
          :duration="0"
          :show="true"
          @close="removeToast(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast'
import ToastNotification from './ToastNotification.vue'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

/* List transitions */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
