<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";

  let name = $state("");
  let greetMsg = $state("");

  async function greet(event: Event) {
    event.preventDefault();
    greetMsg = await invoke("greet", { name });
  }
</script>

<main class="container mx-auto pt-[10vh] flex flex-col justify-center text-center bg-stone-700 h-screen">
  <h1 class="text-center text-2xl font-bold mb-6">Welcome to Tauri + Svelte</h1>

  <div class="flex justify-center space-x-6 mb-6">
    <a href="https://vitejs.dev" target="_blank" class="hover:text-vite">
      <img src="/vite.svg" class="h-24 p-6 transition-all duration-300 hover:filter hover:drop-shadow-[0_0_2em_#747bff]" alt="Vite Logo" />
    </a>
    <a href="https://tauri.app" target="_blank" class="hover:text-tauri">
      <img src="/tauri.svg" class="h-24 p-6 transition-all duration-300 hover:filter hover:drop-shadow-[0_0_2em_#24c8db]" alt="Tauri Logo" />
    </a>
    <a href="https://kit.svelte.dev" target="_blank" class="hover:text-svelte">
      <img src="/svelte.svg" class="h-24 p-6 transition-all duration-300 hover:filter hover:drop-shadow-[0_0_2em_#ff3e00]" alt="SvelteKit Logo" />
    </a>
  </div>

  <p class="mb-8">Click on the Tauri, Vite, and SvelteKit logos to learn more.</p>

  <form class="flex justify-center mb-4" onsubmit={greet}>
    <input
      id="greet-input"
      placeholder="Enter a name..."
      bind:value={name}
      class="rounded-lg border border-transparent px-3 py-2 text-base font-medium bg-white shadow-sm focus:outline-none focus:border-blue-500 mr-2"
    />
    <button
      type="submit"
      class="rounded-lg border border-transparent px-3 py-2 text-base font-medium bg-white shadow-sm cursor-pointer hover:border-blue-500 active:bg-gray-200 focus:outline-none"
    >
      Greet
    </button>
  </form>

  <p class="text-lg">{greetMsg}</p>
</main>
