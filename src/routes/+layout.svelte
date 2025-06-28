<!-- src/routes/+layout.svelte -->
<script>
import "../app.css";
import { page } from "$app/stores";
import { Button } from "$lib/components/ui/button";
import { Container, MoonIcon, SunIcon } from "lucide-svelte";
import { ModeWatcher } from "mode-watcher";
import { mode, toggleMode } from "mode-watcher";
import { Toaster } from "svelte-sonner";

const currentMode = $derived(mode.current);

const { children } = $props();

// Navigation items
const navigation = [
	{ name: "Dashboard", href: "/", path: "/" },
	{ name: "Containers", href: "/containers", path: "/containers" },
	{ name: "Images", href: "/images", path: "/images" },
	{ name: "Volumes", href: "/volumes", path: "/volumes" },
	{ name: "Networks", href: "/networks", path: "/networks" },
	{ name: "Settings", href: "/settings", path: "/settings" },
];

// Check if current route is active
/**
 * @param {string} path
 */
function isActive(path) {
	if (path === "/") {
		return $page.route.id === "/";
	}
	return $page.route.id?.startsWith(path);
}
</script>

<ModeWatcher />

<div class="min-h-screen bg-background text-foreground">
  <!-- Header -->
  <header
    class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo and Brand -->
        <div class="flex items-center space-x-4">
          <a
            href="/"
            class="flex items-center space-x-2 transition-colors hover:text-foreground/80"
          >
            <div
              class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"
            >
              <!-- <span class="text-sm font-bold text-primary-foreground">D</span> -->
              <Container class="w-5 h-5" />
            </div>
            <span class="text-xl font-bold">DocSee</span>
          </a>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-1">
          {#each navigation as item}
            <a
              href={item.href}
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors
                {isActive(item.path)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
            >
              {item.name}
            </a>
          {/each}
        </nav>

        <!-- Theme Toggle -->
        <div class="flex items-center space-x-2">
          <Button
            onclick={toggleMode}
            variant="ghost"
            size="icon"
            class="h-9 w-9"
          >
            <SunIcon
              class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            />
            <MoonIcon
              class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            />
            <span class="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div class="md:hidden border-t">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-1 py-2 overflow-x-auto">
          {#each navigation as item}
            <a
              href={item.href}
              class="px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                {isActive(item.path)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
            >
              {item.name}
            </a>
          {/each}
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {@render children()}
    </div>
  </main>

  <!-- Footer -->
  <footer class=" border-t bg-muted/50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>© 2025 DocSee</span>
          <span>•</span>
          <span>Docker Management Made Simple</span>
        </div>
        <div class="flex items-center space-x-4 text-sm text-muted-foreground">
          <a href="https://github.com/Xczer/docsee-gui/wiki" class="hover:text-foreground transition-colors"
            >Documentation</a
          >
          <a href="support@xczer.in" class="hover:text-foreground transition-colors">Support</a
          >
          <a href="https://github.com/Xczer/docsee-gui" class="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Toast Notifications -->
  <Toaster
    theme={currentMode}
    position="bottom-right"
    closeButton={true}
    richColors={true}
  />
</div>
