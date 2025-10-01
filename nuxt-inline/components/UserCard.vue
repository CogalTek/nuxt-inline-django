<template>
	<v-card class="mx-auto" :max-width="size === 'sm' ? 300 : 400">
		<v-card-title>
			<v-icon class="me-2">mdi-account</v-icon>
			User Profile
		</v-card-title>
		<v-card-text>
			<div class="text-h6 mb-2">User ID: {{ id }}</div>
			<div class="text-body-1">Size: {{ size }}</div>
			<v-btn @click="loadMore" :loading="loading" color="primary" class="mt-3">
				{{ loading ? "Loading..." : "Load More Info" }}
			</v-btn>
			<div v-if="extraInfo" class="mt-3 pa-2 bg-grey-lighten-4 rounded">
				<strong>Extra Info:</strong> Component successfully mounted via Django!
			</div>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
	id: number;
	size?: "sm" | "md" | "lg";
}>();

const loading = ref(false);
const extraInfo = ref(false);

const loadMore = async () => {
	loading.value = true;
	// Simulate API call
	await new Promise((resolve) => setTimeout(resolve, 1000));
	loading.value = false;
	extraInfo.value = true;
};
</script>
