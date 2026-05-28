# Tailwind CSS Responsive Design & Dark Mode

## Responsive Design Patterns

### Mobile-First Responsive Layout

```html
<div class="container mx-auto px-4">
  <!-- Hero Section -->
  <div class="flex flex-col items-center gap-8 py-12 md:flex-row">
    <div class="flex-1">
      <h1 class="mb-4 text-3xl font-bold md:text-5xl">Welcome to Our Site</h1>
      <p class="mb-6 text-lg text-gray-600">Build amazing things with Tailwind CSS</p>
      <button class="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">Get Started</button>
    </div>
    <div class="flex-1">
      <img src="hero.jpg" class="w-full rounded-lg shadow-lg" />
    </div>
  </div>
</div>
```

### Responsive Grid Gallery

```html
<div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  <div class="aspect-square overflow-hidden rounded-lg bg-gray-200">
    <img src="image1.jpg" class="h-full w-full object-cover transition hover:scale-105" />
  </div>
  <div class="aspect-square overflow-hidden rounded-lg bg-gray-200">
    <img src="image2.jpg" class="h-full w-full object-cover transition hover:scale-105" />
  </div>
  <!-- More items... -->
</div>
```

### Responsive Card Component

```tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-lg sm:flex sm:max-w-2xl">
      <img className="h-48 w-full object-cover sm:h-auto sm:w-48" src={product.image} alt={product.name} />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="mt-2 text-gray-600">{product.description}</p>
        <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

---

## Dark Mode

### Basic Dark Mode Support

```html
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 class="text-gray-900 dark:text-white">Title</h1>
  <p class="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

Enable dark mode in tailwind.config.js:

```javascript
module.exports = {
  darkMode: "class", // or 'media'
  // ...
};
```

### Dark Mode Toggle (React)

```tsx
function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <button onClick={() => setDarkMode(!darkMode)} className="rounded-lg bg-gray-200 p-2 dark:bg-gray-800">
      {darkMode ? "🌙" : "☀️"}
    </button>
  );
}
```

### Dark Mode Best Practices

1. **Use semantic color names**: Instead of `bg-white` use `bg-surface` custom color
2. **Test with real content**: Some colors look good in light but not in dark
3. **Respect system preference**: Use `darkMode: 'media'` for OS-level preference
4. **Smooth transitions**: Add transition utilities for theme changes

```css
/* Global transition for theme changes */
* {
  @apply transition-colors duration-200;
}
```

---

## Container Queries (v4.1+)

Component that responds to its container size, not viewport:

```html
<div class="@container">
  <div class="@lg:text-xl @2xl:text-2xl">Text size based on container, not viewport</div>
</div>
```

Usage in a card component:

```html
<div class="@container w-full">
  <div class="flex flex-col gap-4 @[400px]:flex-row">
    <img class="h-32 w-full object-cover @[400px]:w-32" src="image.jpg" />
    <div>
      <h3 class="text-base font-bold @[400px]:text-lg">Title</h3>
      <p class="text-sm @[400px]:text-base">Description</p>
    </div>
  </div>
</div>
```
