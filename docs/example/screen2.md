<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Songly - My Library</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#f43e47",
            "background-light": "#f8f5f6",
            "background-dark": "#121212",
          },
          fontFamily: {
            "display": ["Plus Jakarta Sans", "sans-serif"]
          },
          borderRadius: {
            "DEFAULT": "1rem",
            "lg": "1.5rem",
            "xl": "2rem",
            "full": "9999px"
          },
        },
      },
    }
  </script>
<style>
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      font-size: 24px;
    }
    .material-symbols-outlined.fill {
      font-variation-settings: 'FILL' 1;
    }
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display">
<div class="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden text-[#EAEAEA]">
<header class="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
<div class="flex items-center p-4">
<h1 class="text-2xl font-bold leading-tight tracking-tighter text-zinc-900 dark:text-white flex-1">My Library</h1>
<div class="flex items-center gap-2">
<button class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-transparent text-zinc-900 dark:text-white">
<span class="material-symbols-outlined">tune</span>
</button>
<button class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-transparent text-zinc-900 dark:text-white">
<span class="material-symbols-outlined">swap_vert</span>
</button>
</div>
</div>
</header>
<main class="flex-1 pb-24">
<div class="flex flex-col gap-4 p-4">
<div class="flex flex-col gap-4 rounded-xl bg-zinc-100 dark:bg-[#1E1E1E] p-4">
<div class="flex items-start gap-4">
<div class="w-16 h-16 rounded-lg bg-cover bg-center shrink-0" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDZQDWCzwjwNm_-AI2XB1lXxEyqSGoW8Yti9W2m6AwwihcOWe62-Iq6Bh9tOWhWwsEMVIhxoOT4YloI1fe55kQzZh1DduzPQREcYOy74xiceHCob7uzzPrI-m4EdVIHWzToT5YMENkrvCXP-mOKejJRdAB99ftdwl4gzgCuNCCefC5sST-4Z0bcFoH73YqJ82IU2U_pz6UxVmSi28nvR8Q0jbIuKSgQ_7_C8aMmTq4FYfhRa55NjGjigQ8ECKeoVKNiDHXvQXbaSlGp");'></div>
<div class="flex-1">
<div class="flex justify-between items-start">
<p class="font-bold text-zinc-900 dark:text-white">Voor Anne</p>
<span class="material-symbols-outlined text-zinc-500 dark:text-zinc-400">arrow_forward_ios</span>
</div>
<p class="text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">CONTEXT VERZAMELEN</p>
</div>
</div>
<div class="flex flex-col gap-2">
<div class="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-300">
<span>Progress</span>
<span>75%</span>
</div>
<div class="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
<div class="bg-primary h-1.5 rounded-full" style="width: 75%"></div>
</div>
</div>
<div class="bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-3">
<p class="text-sm font-semibold text-zinc-900 dark:text-white mb-1.5">Last 2 messages</p>
<p class="text-sm text-zinc-600 dark:text-zinc-400">Jij: Ja, dat klopt. Ze houdt van de kleur blauw.</p>
<p class="text-sm text-zinc-600 dark:text-zinc-400">AI: Bedankt voor de informatie!</p>
</div>
</div>
<div class="flex flex-col gap-4 rounded-xl bg-zinc-100 dark:bg-[#1E1E1E] p-4">
<div class="flex items-start gap-4">
<div class="w-16 h-16 rounded-lg bg-cover bg-center shrink-0" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDZQDWCzwjwNm_-AI2XB1lXxEyqSGoW8Yti9W2m6AwwihcOWe62-Iq6Bh9tOWhWwsEMVIhxoOT4YloI1fe55kQzZh1DduzPQREcYOy74xiceHCob7uzzPrI-m4EdVIHWzToT5YMENkrvCXP-mOKejJRdAB99ftdwl4gzgCuNCCefC5sST-4Z0bcFoH73YqJ82IU2U_pz6UxVmSi28nvR8Q0jbIuKSgQ_7_C8aMmTq4FYfhRa55NjGjigQ8ECKeoVKNiDHXvQXbaSlGp");'></div>
<div class="flex-1">
<div class="flex justify-between items-start">
<p class="font-bold text-zinc-900 dark:text-white">Mijn Liefdeslied</p>
<span class="material-symbols-outlined text-zinc-500 dark:text-zinc-400">arrow_forward_ios</span>
</div>
<p class="text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">KLAAR OM TE GENEREREN</p>
</div>
</div>
<div class="flex flex-col gap-2">
<div class="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-300">
<span>Progress</span>
<span>100%</span>
</div>
<div class="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
<div class="bg-primary h-1.5 rounded-full" style="width: 100%"></div>
</div>
</div>
<div class="bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-3">
<p class="text-sm font-semibold text-zinc-900 dark:text-white mb-1.5">Last 2 messages</p>
<p class="text-sm text-zinc-600 dark:text-zinc-400">Jij: Geweldig, ik ben er klaar voor!</p>
<p class="text-sm text-zinc-600 dark:text-zinc-400">AI: Perfect! Ik begin met het genereren van je liedje.</p>
</div>
</div>
<div class="flex flex-col gap-4 rounded-xl bg-zinc-100 dark:bg-[#1E1E1E] p-4">
<div class="flex items-start gap-4">
<div class="w-16 h-16 rounded-lg bg-cover bg-center shrink-0" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDZQDWCzwjwNm_-AI2XB1lXxEyqSGoW8Yti9W2m6AwwihcOWe62-Iq6Bh9tOWhWwsEMVIhxoOT4YloI1fe55kQzZh1DduzPQREcYOy74xiceHCob7uzzPrI-m4EdVIHWzToT5YMENkrvCXP-mOKejJRdAB99ftdwl4gzgCuNCCefC5sST-4Z0bcFoH73YqJ82IU2U_pz6UxVmSi28nvR8Q0jbIuKSgQ_7_C8aMmTq4FYfhRa55NjGjigQ8ECKeoVKNiDHXvQXbaSlGp");'></div>
<div class="flex-1">
<div class="flex justify-between items-start">
<p class="font-bold text-zinc-900 dark:text-white">Verrassing voor Emma</p>
<span class="material-symbols-outlined text-zinc-500 dark:text-zinc-400">arrow_forward_ios</span>
</div>
<p class="text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">TEKST GOEDKEUREN</p>
</div>
</div>
<div class="flex flex-col gap-2">
<div class="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-300">
<span>Progress</span>
<span>90%</span>
</div>
<div class="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
<div class="bg-primary h-1.5 rounded-full" style="width: 90%"></div>
</div>
</div>
<div class="bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-3">
<p class="text-sm font-semibold text-zinc-900 dark:text-white mb-1.5">Last 2 messages</p>
<p class="text-sm text-zinc-600 dark:text-zinc-400">Jij: Ik wil 'oceaanogen' veranderen in 'sterrenogen'.</p>
<p class="text-sm text-zinc-600 dark:text-zinc-400">AI: Begrepen. Is er nog iets dat je wilt aanpassen?</p>
</div>
</div>
</div>
</main>
<footer class="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 dark:border-zinc-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
<div class="flex justify-around px-4 pb-3 pt-2">
<a class="flex flex-1 flex-col items-center justify-center gap-1 text-primary" href="#">
<span class="material-symbols-outlined fill">music_note</span>
<p class="text-xs font-bold">Library</p>
</a>
<a class="flex flex-1 flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400" href="#">
<span class="material-symbols-outlined">add_circle</span>
<p class="text-xs font-medium">Generate</p>
</a>
<a class="flex flex-1 flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400" href="#">
<span class="material-symbols-outlined">person</span>
<p class="text-xs font-medium">Profile</p>
</a>
</div>
</footer>
</div>

</body></html>