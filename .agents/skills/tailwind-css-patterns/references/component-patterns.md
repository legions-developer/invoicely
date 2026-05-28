# Tailwind CSS Component Patterns

## Card Component

```html
<div class="overflow-hidden rounded-lg bg-white shadow-lg">
  <img class="h-48 w-full object-cover" src="image.jpg" alt="Card image" />
  <div class="p-6">
    <h3 class="mb-2 text-xl font-bold">Card Title</h3>
    <p class="mb-4 text-gray-700">Card description text goes here.</p>
    <button class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">Action</button>
  </div>
</div>
```

## Responsive User Card

```html
<div class="mx-auto max-w-sm overflow-hidden rounded-xl bg-white shadow-lg sm:flex sm:max-w-2xl">
  <img class="h-48 w-full object-cover sm:h-auto sm:w-48" src="profile.jpg" alt="Profile" />
  <div class="p-8">
    <div class="text-sm font-semibold tracking-wide text-indigo-500 uppercase">Product Engineer</div>
    <h2 class="mt-1 text-xl font-semibold text-gray-900">John Doe</h2>
    <p class="mt-2 text-gray-500">Building amazing products with modern technology.</p>
    <button class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700">Contact</button>
  </div>
</div>
```

## Navigation Bar

```html
<nav class="bg-white shadow-lg">
  <div class="container mx-auto px-4">
    <div class="flex h-16 items-center justify-between">
      <div class="flex items-center">
        <a href="#" class="text-xl font-bold text-gray-800">Logo</a>
      </div>
      <div class="hidden space-x-8 md:flex">
        <a href="#" class="text-gray-700 transition hover:text-blue-600">Home</a>
        <a href="#" class="text-gray-700 transition hover:text-blue-600">About</a>
        <a href="#" class="text-gray-700 transition hover:text-blue-600">Services</a>
        <a href="#" class="text-gray-700 transition hover:text-blue-600">Contact</a>
      </div>
      <button class="md:hidden">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>
  </div>
</nav>
```

## Form Elements

```html
<form class="mx-auto max-w-md space-y-6">
  <div>
    <label class="mb-2 block text-sm font-medium text-gray-700"> Email </label>
    <input
      type="email"
      class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
      placeholder="you@example.com"
    />
  </div>

  <div>
    <label class="mb-2 block text-sm font-medium text-gray-700"> Password </label>
    <input
      type="password"
      class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div class="flex items-center">
    <input type="checkbox" class="mr-2" />
    <label class="text-sm text-gray-600">Remember me</label>
  </div>

  <button
    type="submit"
    class="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
  >
    Sign In
  </button>
</form>
```

## Modal/Dialog

```html
<div class="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black p-4">
  <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-xl font-bold">Modal Title</h3>
      <button class="text-gray-500 hover:text-gray-700">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <p class="mb-6 text-gray-700">Modal content goes here.</p>
    <div class="flex justify-end space-x-4">
      <button class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
      <button class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Confirm</button>
    </div>
  </div>
</div>
```

## React Button Component with Variants

```tsx
import { useState } from "react";

function Button({
  variant = "primary",
  size = "md",
  children,
}: {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  const baseClasses = "font-semibold rounded transition";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  };

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>{children}</button>;
}
```
