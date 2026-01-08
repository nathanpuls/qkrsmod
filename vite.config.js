import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__BUILD_TIME__: JSON.stringify(new Date().toString())
	},
	server: {
		host: true, // Listen on all network interfaces (allows mobile access)
		hmr: {
			overlay: true // Show errors as overlay in browser
		}
	}
});
