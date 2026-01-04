import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-cloudflare will build your app to a worker-compatible format
		// See https://svelte.dev/docs/kit/adapter-cloudflare for more information
		adapter: adapter(),
		version: {
			pollInterval: 60000 // poll for new versions every minute
		}
	}
};

export default config;
