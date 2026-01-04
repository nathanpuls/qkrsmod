<script>
	import "../app.css";
	import { onMount } from "svelte";
	import { updated } from "$app/stores";
	import { beforeNavigate } from "$app/navigation";

	// Handle version updates
	$: if ($updated) {
		console.log("New version available, reloading...");
		location.reload();
	}

	onMount(() => {
		// Periodically check for updates (this works with version.pollInterval)
	});

	beforeNavigate(({ willUnload, to }) => {
		// If we're navigating and a new version is available, force a full reload
		if ($updated && !willUnload && to) {
			location.href = to.url.href;
		}
	});
</script>

<slot />
