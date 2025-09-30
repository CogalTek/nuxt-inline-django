<template>
  <v-card class="pa-4 ma-2">
    <v-card-title>MyComponent</v-card-title>
    <v-card-text>
      <div>{{ msg }}</div>
      <v-btn @click="count++">Clicked {{ count }} times</v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
const props = defineProps<{ msg?: string }>();
const count = ref(0);
</script>
