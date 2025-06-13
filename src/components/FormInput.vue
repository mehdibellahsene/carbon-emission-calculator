<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  list?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  
  <div class="form-group slide-up" :class="{ 'delay-1': true }">
    <label class="form-label">{{ label }}</label>
    <div class="input-container">      <input
        :type="type || 'text'"
        class="form-control"
        :placeholder="placeholder"
        :value="modelValue"
        @input="updateValue"
        :required="required"
        :list="list"
      />
      <div class="focus-indicator"></div>
    </div>
  </div>
</template>

<style scoped>
@import './style/FormInput.css';
</style>
