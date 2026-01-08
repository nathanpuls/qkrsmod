import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__BUILD_TIME__: Date.now()
	},
	server: {
		host: true, // Listen on all network interfaces (allows mobile access)
		hmr: {
			overlay: true // Show errors as overlay in browser
		}
	}
});
