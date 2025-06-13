<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { value: string; label: string; icon: string }[];
  textColor?: string;
  activeColor?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const updateValue = (value: string) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <div 
    class="transport-options-container slide-up delay-2" 
    :style="{ 
      '--text-color': textColor , 
      '--active-color': activeColor  
    }"
  >
    <div class="transport-options">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="transport-option"
        :class="{ active: modelValue === option.value }"
        @click="updateValue(option.value)"
      >
        <div class="glow-effect"></div>
        <div class="icon" v-html="option.icon"></div>
        <span class="label">{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
<style scoped>
@import './style/TransportOption.css';
</style>