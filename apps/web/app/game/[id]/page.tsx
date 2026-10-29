import { GameClient } from "@/components/game/GameClient";

export default function GamePage({ params }: { params: { id: string } }) {
  return <GameClient gameId={params.id} />;
}
