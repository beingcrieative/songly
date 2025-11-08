<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Songly Dashboard</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style type="text/tailwindcss">
    .material-symbols-outlined {
      font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 24
    }
    .material-symbols-outlined.fill {
      font-variation-settings:
        'FILL' 1
    }
  </style>
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#6A11CB",
            "background-light": "#f5f5f7",
            "background-dark": "#120822",
            "card-light": "#ffffff",
            "card-dark": "#1d1430",
            "text-light-primary": "#1E1E1E",
            "text-dark-primary": "#f5f5f7",
            "text-light-secondary": "#8E8E93",
            "text-dark-secondary": "#a29aac",
            "accent": "#FF00A5"
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
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
<style>
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
<body class="font-display bg-background-light dark:bg-background-dark">
<div class="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden pb-28">
<div class="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
<div class="flex size-12 shrink-0 items-center">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" data-alt="User profile avatar" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAD7JG4uHSG1nODXZPa75ibnYSmQOjDBJRNfLPYcHtnLz0jPMksJY4tN93b8bnvx1BuHeWdF26GKtxKO_a4RjRlcPXvXJQQbyE_ixAG6prcKdRaVcPHSa1nGGwKYOtS_KmeSyhBfn_LAQDryfE5UuBRfyFNIoGFTld9PCHfOG7lC6TNMYZQxxGODbdgMi5vRi8RgoZFmV6dm0fdkPKhpEdG_J-lsjujDDzaD5c7HJff3xcmtZvOhsRMatoXkbCoK2eVDNR1oC2eZLov");'></div>
</div>
<h2 class="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Songly</h2>
<div class="flex w-12 items-center justify-end">
<button class="relative flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-transparent text-text-light-primary dark:text-text-dark-primary gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
<span class="material-symbols-outlined text-3xl">notifications</span>
<div class="absolute top-2 right-2 flex size-3 items-center justify-center">
<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
<span class="relative inline-flex size-2 rounded-full bg-accent"></span>
</div>
</button>
</div>
</div>
<div class="flex flex-wrap gap-4 p-4">
<div class="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<p class="text-text-light-secondary dark:text-text-dark-secondary text-sm font-medium leading-normal">Total Songs</p>
<p class="text-text-light-primary dark:text-text-dark-primary tracking-tight text-3xl font-bold leading-tight">42</p>
</div>
<div class="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<p class="text-text-light-secondary dark:text-text-dark-secondary text-sm font-medium leading-normal">Conversations</p>
<p class="text-text-light-primary dark:text-text-dark-primary tracking-tight text-3xl font-bold leading-tight">16</p>
</div>
<div class="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg bg-primary/20 dark:bg-primary/30 p-4 shadow-sm border border-primary/50">
<p class="text-primary dark:text-purple-300 text-sm font-medium leading-normal">Generating</p>
<p class="text-primary dark:text-white tracking-tight text-3xl font-bold leading-tight">2</p>
</div>
</div>
<h2 class="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Action Required</h2>
<div class="px-4">
<div class="flex flex-col items-center justify-center rounded-lg bg-card-light dark:bg-card-dark p-6 text-center shadow-sm">
<div class="text-5xl mb-3">🎉</div>
<p class="font-bold text-text-light-primary dark:text-text-dark-primary mb-1">All Caught Up!</p>
<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">No songs require your action right now.</p>
</div>
</div>
<h2 class="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">Recently Active</h2>
<div class="px-4 space-y-4">
<div class="flex flex-col gap-4 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<div class="flex items-start gap-4">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16 shrink-0" data-alt="Abstract artwork for a love song" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCAHBzPdrggVE7WwMmBbWHQYI4ODrQtt6UNe84I6A6ZOvVqHrE9exUB-Nk_NjRIj5MXA7GD6SwyPRY3zGBF-SRZJXkqW5nlMWlupwfC34cLYeVEyyid_aOefqOMkzljFetIS8rYphUvSmIF1MHk_YAB82NPKOxfNdJo7mFVH-Ot08wzbY7sGO0njDWd6d66_pmDWGpviRbGPdqXpVhRO8q2H_jOkmFQEcfXab9nV6GaSEpKoVXZ4F6ayQstqenJ3ob9gsNmUsyCnhrs");'></div>
<div class="flex-1">
<p class="text-text-light-primary dark:text-text-dark-primary text-base font-bold leading-normal">For Sarah</p>
<p class="text-accent text-xs font-bold leading-normal tracking-wider uppercase">CONTEXT VERZAMELEN</p>
</div>
<button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em]">
<span class="truncate">Continue</span>
</button>
</div>
<div class="space-y-2">
<p class="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">Last 2 messages</p>
<div class="p-3 bg-background-light dark:bg-background-dark/70 rounded-lg">
<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary"><span class="font-medium text-text-light-primary dark:text-text-dark-primary">You:</span> It should be a bit like "Perfect" by Ed Sheeran.</p>
<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary"><span class="font-medium text-text-light-primary dark:text-text-dark-primary">AI:</span> Great choice! What are some specific memories you want to include?</p>
</div>
</div>
<div class="w-full">
<div class="flex justify-between mb-1">
<span class="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">Readiness Score</span>
<span class="text-xs font-medium text-primary dark:text-purple-300">80%</span>
</div>
<div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
<div class="bg-primary h-2.5 rounded-full" style="width: 80%"></div>
</div>
</div>
</div>
<div class="flex flex-col gap-4 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<div class="flex items-start gap-4">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16 shrink-0" data-alt="Abstract artwork for a love song" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuARUhQkdieyyxDLnqNMAGevN-hg6RIlYrZxUjMY-PIhUrklNl5nIzIYOBHI-iPxHsq_500-IxmnTlH-m_gAbAYMm2OWQgodU3lXmhGM00z0LHYOF2OpQw0JSuLjCHwLVWthcfkwZkGr_f6haYIgnKXZyZilns4N8ruUo49FidtWEQy3LfbjYlJ6B8ISRVnTiMXEhwfAEiY-sZpdLG4v4BOSUODBVELzP8gYLuiRoGiMXfM792G81PPzurduPLZ_RODmG8viog2vizRo");'></div>
<div class="flex-1">
<p class="text-text-light-primary dark:text-text-dark-primary text-base font-bold leading-normal">Anniversary Ballad</p>
<p class="text-blue-500 dark:text-blue-400 text-xs font-bold leading-normal tracking-wider uppercase">LYRICS REVIEW</p>
</div>
<button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em]">
<span class="truncate">Review</span>
</button>
</div>
<div class="space-y-2">
<p class="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">Last 2 messages</p>
<div class="p-3 bg-background-light dark:bg-background-dark/70 rounded-lg">
<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary"><span class="font-medium text-text-light-primary dark:text-text-dark-primary">AI:</span> Here are the lyrics based on your story. How does this sound?</p>
<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary"><span class="font-medium text-text-light-primary dark:text-text-dark-primary">You:</span> I love the chorus! Can we change the first verse a bit?</p>
</div>
</div>
<div class="w-full">
<div class="flex justify-between mb-1">
<span class="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">Readiness Score</span>
<span class="text-xs font-medium text-primary dark:text-purple-300">45%</span>
</div>
<div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
<div class="bg-primary h-2.5 rounded-full" style="width: 45%"></div>
</div>
</div>
</div>
<div class="flex flex-col items-center justify-center rounded-lg bg-card-light dark:bg-card-dark p-6 text-center shadow-sm">
<div class="text-5xl mb-3">💬</div>
<p class="font-bold text-text-light-primary dark:text-text-dark-primary mb-2">No More Recent Activity</p>
<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">Start a new conversation to create your next love song.</p>
<button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em]">
<span class="material-symbols-outlined text-base mr-2">add</span>
<span class="truncate">New Conversation</span>
</button>
</div>
</div>
<div class="fixed bottom-0 left-0 z-50 w-full h-20 bg-card-light dark:bg-card-dark border-t border-gray-200 dark:border-gray-800">
<div class="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
<a class="inline-flex flex-col items-center justify-center px-5 text-primary dark:text-purple-300" href="#">
<span class="material-symbols-outlined fill text-3xl mb-1">dashboard</span>
<span class="text-xs">Dashboard</span>
</a>
<a class="inline-flex flex-col items-center justify-center px-5 text-text-light-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-purple-300" href="#">
<span class="material-symbols-outlined text-3xl mb-1">library_music</span>
<span class="text-xs">Library</span>
</a>
<button class="inline-flex flex-col items-center justify-center w-16 h-16 font-medium bg-primary rounded-full text-white -mt-6 mx-auto shadow-lg shadow-primary/40" type="button">
<span class="material-symbols-outlined text-4xl">add</span>
</button>
<a class="inline-flex flex-col items-center justify-center px-5 text-text-light-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-purple-300" href="#">
<span class="material-symbols-outlined text-3xl mb-1">forum</span>
<span class="text-xs">Chats</span>
</a>
<a class="inline-flex flex-col items-center justify-center px-5 text-text-light-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-purple-300" href="#">
<span class="material-symbols-outlined text-3xl mb-1">settings</span>
<span class="text-xs">Settings</span>
</a>
</div>
</div>
</div>

</body></html>