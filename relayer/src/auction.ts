export interface Bid {
  who: string;
  gwei: number;
}

export function runAuction(): { bids: Bid[]; winner: Bid } {
  const bids: Bid[] = [
    { who: 'searcher-a', gwei: Math.floor(Math.random() * 5) + 3 },
    { who: 'searcher-b', gwei: Math.floor(Math.random() * 5) + 3 },
  ];
  const winner = bids.reduce((a, b) => (a.gwei >= b.gwei ? a : b));
  return { bids, winner };
}


