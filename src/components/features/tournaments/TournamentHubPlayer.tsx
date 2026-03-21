import { useEffect, useState } from 'react';
import { api } from '@/adapters/http';
import Link from 'next/link';

export function TournamentHubPlayer({ tournamentId }: { tournamentId: string }) {
  // We can fetch just the standings and some matches here for a quick overview
  // Or reuse the page.tsx logic
  return <div>Detalles de torneo</div>
}
