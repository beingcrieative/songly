import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/adminDb";

interface SharePageProps {
  params: Promise<{ publicId: string }>;
}

export default async function ShareSongPage({ params }: SharePageProps) {
  const { publicId } = await params;
  const admin = getAdminDb();

  if (!admin) {
    notFound();
  }

  const { songs } = await admin.query({
    songs: {
      $: {
        where: {
          publicId,
          isPublic: true,
        },

      } as any,
      variants: {
        $: {
          order: { order: "asc" as const },
        } as any,
      },
    },
  });

  const song = songs?.[0];
  if (!song) {
    notFound();
  }

  const primaryVariant = song.variants?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">{song.title || "Gedeeld lied"}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Luister naar dit liefdesliedje. Wil je jouw eigen versie maken? Ga naar
            <span className="font-semibold"> studio</span>.
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow">
          {song.imageUrl ? (
            <img src={song.imageUrl} alt={song.title || "Cover"} className="h-64 w-full object-cover" />
          ) : null}
          <div className="space-y-4 p-6">
            <audio
              controls
              className="w-full"
              src={primaryVariant?.streamAudioUrl || song.streamAudioUrl || primaryVariant?.audioUrl || song.audioUrl || undefined}
            >
              Je browser ondersteunt geen audio afspelen.
            </audio>
            {song.lyricsSnippet ? (
              <p className="whitespace-pre-line text-sm text-slate-600">{song.lyricsSnippet}</p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

