<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav class="main-nav">
      <RouterLink to="/" class="logo" aria-label="Cashback Detective Home">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect width="32" height="32" rx="8" :fill="`var(--color-primary)`" />
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="white">$</text>
        </svg>
        <span class="logo-text">Cashback Detective</span>
      </RouterLink>
      <ul class="nav-links">
        <li><RouterLink to="/" class="nav-link">Home</RouterLink></li>
        <li><RouterLink to="/investigate" class="nav-link">Investigate</RouterLink></li>
        <li><RouterLink to="/about" class="nav-link">About</RouterLink></li>
      </ul>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  position: sticky;
  top: 0;
  z-index: 100;
}

.main-nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.125rem;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-text {
  display: none;
}

@media (min-width: 640px) {
  .logo-text {
    display: inline;
  }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: block;
  padding: 0.5rem 1rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  border-radius: 6px;
  transition: color 0.2s, background-color 0.2s;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-background-secondary);
}

.nav-link.router-link-exact-active {
  color: var(--color-primary);
  background: var(--color-primary-translucent);
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  width: 100%;
  flex: 1;
}

@media (max-width: 639px) {
  .main-nav {
    padding: 0.75rem 1rem;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>