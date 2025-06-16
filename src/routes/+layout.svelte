<!-- src/routes/+layout.svelte -->
<script>
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { Button } from "$lib/components/ui/button";
  import { SunIcon, MoonIcon } from "lucide-svelte";
  import { toggleMode, mode } from "mode-watcher";
  import { Toaster } from "svelte-sonner";

  const currentMode = $derived(mode.current);

  let { children } = $props();
</script>

<ModeWatcher />

<div class="min-h-screen bg-background text-foreground mx-16">
  <!-- Header -->
  <header
    class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container flex h-14 items-center">
      <div class="mr-4 flex">
        <a href="/" class="mr-6 flex items-center space-x-2">
          <span class="font-bold">DocSee</span>
        </a>
      </div>

      <!-- Navigation -->
      <nav class="flex items-center space-x-6 text-sm font-medium">
        <a href="/" class="transition-colors hover:text-foreground/80"
          >Dashboard</a
        >
        <a href="/containers" class="transition-colors hover:text-foreground/80"
          >Containers</a
        >
        <a href="/images" class="transition-colors hover:text-foreground/80"
          >Images</a
        >
        <a href="/volumes" class="transition-colors hover:text-foreground/80"
          >Volumes</a
        >
        <a href="/settings" class="transition-colors hover:text-foreground/80"
          >Settings</a
        >
      </nav>

      <!-- Theme Toggle -->
      <div class="ml-auto flex items-center space-x-4">
        <Button onclick={toggleMode} variant="outline" size="icon">
          <SunIcon
            class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <MoonIcon
            class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
          <span class="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container py-6">
    {@render children()}
  </main>

  <Toaster theme={currentMode} />
</div>
