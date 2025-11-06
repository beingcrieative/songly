/**
 * Test Script: Song Creation Flow Verification
 * 
 * This script verifies that:
 * 1. Songs are created when lyrics generation starts
 * 2. Songs are linked to the correct user
 * 3. Songs are visible in the library
 * 4. Failed songs are also visible
 */

import { getAdminDb } from '../src/lib/adminDb';

async function testSongCreationFlow() {
  console.log('=== TESTING SONG CREATION FLOW ===\n');

  const admin = getAdminDb();
  if (!admin) {
    console.error('❌ Admin DB not available');
    process.exit(1);
  }

  // Test 1: Check if any songs exist at all
  console.log('📊 Test 1: Checking all songs in database...');
  const allSongs = await admin.query({
    songs: {
      $: {
        order: { createdAt: 'desc' },
        limit: 100,
      } as any,
      user: {},
      conversation: {},
    },
  });

  console.log(`   Found ${allSongs.songs.length} songs total`);
  
  if (allSongs.songs.length === 0) {
    console.log('   ⚠️  No songs found in database!');
    console.log('   This suggests songs are not being created.');
    return;
  }

  // Test 2: Check songs by status
  console.log('\n📊 Test 2: Checking songs by status...');
  const statusCounts: Record<string, number> = {};
  const songsByStatus: Record<string, any[]> = {};

  allSongs.songs.forEach((song: any) => {
    const status = song.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (!songsByStatus[status]) {
      songsByStatus[status] = [];
    }
    songsByStatus[status].push(song);
  });

  console.log('   Status distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count} songs`);
  });

  // Test 3: Check songs with user links
  console.log('\n📊 Test 3: Checking songs with user links...');
  const songsWithUser = allSongs.songs.filter((song: any) => song.user?.id);
  const songsWithoutUser = allSongs.songs.filter((song: any) => !song.user?.id);

  console.log(`   Songs with user link: ${songsWithUser.length}`);
  console.log(`   Songs without user link: ${songsWithoutUser.length}`);

  if (songsWithoutUser.length > 0) {
    console.log('   ⚠️  WARNING: Found songs without user link!');
    console.log('   These songs will not be visible in the library.');
    songsWithoutUser.slice(0, 5).forEach((song: any) => {
      console.log(`   - Song ID: ${song.id}, Status: ${song.status || 'unknown'}, Created: ${song.createdAt ? new Date(song.createdAt).toISOString() : 'unknown'}`);
    });
  }

  // Test 4: Check songs with conversation links
  console.log('\n📊 Test 4: Checking songs with conversation links...');
  const songsWithConversation = allSongs.songs.filter((song: any) => song.conversation?.id);
  const songsWithoutConversation = allSongs.songs.filter((song: any) => !song.conversation?.id);

  console.log(`   Songs with conversation link: ${songsWithConversation.length}`);
  console.log(`   Songs without conversation link: ${songsWithoutConversation.length}`);

  // Test 5: Check recent songs (last 24 hours)
  console.log('\n📊 Test 5: Checking recent songs (last 24 hours)...');
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentSongs = allSongs.songs.filter((song: any) => 
    song.createdAt && song.createdAt > oneDayAgo
  );

  console.log(`   Recent songs (last 24h): ${recentSongs.length}`);
  recentSongs.slice(0, 10).forEach((song: any) => {
    const status = song.status || 'unknown';
    const hasUser = song.user?.id ? '✅' : '❌';
    const hasConversation = song.conversation?.id ? '✅' : '❌';
    const createdAt = song.createdAt ? new Date(song.createdAt).toISOString() : 'unknown';
    console.log(`   - ${status} | User: ${hasUser} | Conv: ${hasConversation} | ${createdAt}`);
  });

  // Test 6: Check failed songs
  console.log('\n📊 Test 6: Checking failed songs...');
  const failedSongs = allSongs.songs.filter((song: any) => 
    song.status === 'failed' || song.errorMessage
  );

  console.log(`   Failed songs: ${failedSongs.length}`);
  failedSongs.slice(0, 10).forEach((song: any) => {
    const hasUser = song.user?.id ? '✅' : '❌';
    const error = song.errorMessage || 'no error message';
    const createdAt = song.createdAt ? new Date(song.createdAt).toISOString() : 'unknown';
    console.log(`   - User: ${hasUser} | Error: ${error.substring(0, 50)} | ${createdAt}`);
  });

  // Test 7: Check songs with lyricsTaskId
  console.log('\n📊 Test 7: Checking songs with lyricsTaskId...');
  const songsWithTaskId = allSongs.songs.filter((song: any) => song.lyricsTaskId);
  const songsWithoutTaskId = allSongs.songs.filter((song: any) => !song.lyricsTaskId);

  console.log(`   Songs with lyricsTaskId: ${songsWithTaskId.length}`);
  console.log(`   Songs without lyricsTaskId: ${songsWithoutTaskId.length}`);

  // Test 8: Check songs in "generating_lyrics" status
  console.log('\n📊 Test 8: Checking songs in "generating_lyrics" status...');
  const generatingSongs = allSongs.songs.filter((song: any) => 
    song.status === 'generating_lyrics'
  );

  console.log(`   Songs generating lyrics: ${generatingSongs.length}`);
  generatingSongs.slice(0, 10).forEach((song: any) => {
    const hasUser = song.user?.id ? '✅' : '❌';
    const hasTaskId = song.lyricsTaskId ? '✅' : '❌';
    const createdAt = song.createdAt ? new Date(song.createdAt).toISOString() : 'unknown';
    const age = song.createdAt ? Math.round((Date.now() - song.createdAt) / 1000 / 60) : 0;
    console.log(`   - User: ${hasUser} | TaskId: ${hasTaskId} | Age: ${age}min | ${createdAt}`);
  });

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total songs: ${allSongs.songs.length}`);
  console.log(`Songs with user link: ${songsWithUser.length} (${(songsWithUser.length / allSongs.songs.length * 100).toFixed(1)}%)`);
  console.log(`Songs without user link: ${songsWithoutUser.length} (${(songsWithoutUser.length / allSongs.songs.length * 100).toFixed(1)}%)`);
  console.log(`Recent songs (24h): ${recentSongs.length}`);
  console.log(`Failed songs: ${failedSongs.length}`);
  console.log(`Generating lyrics: ${generatingSongs.length}`);

  if (songsWithoutUser.length > 0) {
    console.log('\n⚠️  ISSUE FOUND: Songs without user link will not appear in library!');
    console.log('   These songs need to be linked to a user.');
  }

  if (generatingSongs.length > 10) {
    console.log('\n⚠️  ISSUE FOUND: Many songs stuck in "generating_lyrics" status!');
    console.log('   This suggests callbacks are not being received or processed.');
  }
}

// Run the test
testSongCreationFlow()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

