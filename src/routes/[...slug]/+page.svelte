<script>
  import { page } from "$app/stores";
  import Editor from "$lib/components/Editor.svelte";
  import HashtagView from "$lib/components/HashtagView.svelte";

  // Determine path from slug or default to 'home'
  $: path = ($page.params.slug || "home").toLowerCase();

  // Logic to detect hashtag page
  // Legacy paths: /x/hashtag or /x/hashtag/foo
  $: isHashtag = path === "x/hashtag" || path.startsWith("x/hashtag/");

  // Extract tag
  $: tag = isHashtag ? getTag(path, $page.url.searchParams) : null;

  function getTag(p, params) {
    if (params.get("tag")) return params.get("tag");
    const parts = p.split("/");
    // Expected: x/hashtag/tagname
    if (parts.length > 2) return parts[2];
    return null;
  }
</script>

{#if isHashtag}
  <HashtagView {tag} />
{:else}
  {#key path}
    <Editor {path} />
  {/key}
{/if}
