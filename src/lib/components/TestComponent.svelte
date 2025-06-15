<!-- src/lib/components/TestComponent.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui';
  import { theme, setTheme } from '$lib/stores/theme.svelte';
  
  let testCount = $state(0);
  let currentTheme = $derived(theme());
  
  function incrementCount() {
    testCount++;
    console.log('Button clicked! Count:', testCount);
  }
  
  function testThemeToggle() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    console.log('Theme changed to:', newTheme);
  }
  
  function testAlert() {
    alert('Button working!');
  }
</script>

<div class="space-y-4 p-4 border border-border rounded-lg bg-card">
  <h3 class="text-lg font-semibold">Test Component</h3>
  
  <!-- Test counter -->
  <div class="flex items-center gap-4">
    <span>Count: {testCount}</span>
    <Button onclick={incrementCount}>
      Increment
    </Button>
  </div>
  
  <!-- Test theme toggle -->
  <div class="flex items-center gap-4">
    <span>Theme: {currentTheme}</span>
    <Button variant="outline" onclick={testThemeToggle}>
      Toggle Theme
    </Button>
  </div>
  
  <!-- Test alert -->
  <div>
    <Button variant="destructive" onclick={testAlert}>
      Test Alert
    </Button>
  </div>
  
  <!-- Test with traditional onclick -->
  <div>
    <button 
      class="btn btn-secondary btn-sm" 
      onclick={() => console.log('Traditional button clicked')}
    >
      Traditional Button
    </button>
  </div>
</div>