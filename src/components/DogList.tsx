import DogCard, { DogSummary } from "@/components/DogCard";

type Props = {
  dogs: DogSummary[];
  activeId?: string | null;
  onHoverDog?: (id: string | null) => void;
  columns?: 1 | 2 | 3;
};

export default function DogList({ dogs, activeId, onHoverDog, columns = 3 }: Props) {
  if (dogs.length === 0) {
    return (
      <p className="py-12 text-center text-black/60">
        No dogs match your filters right now.
      </p>
    );
  }

  const gridCols =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {dogs.map((dog) => (
        <div
          key={dog.id}
          onMouseEnter={() => onHoverDog?.(dog.id)}
          onMouseLeave={() => onHoverDog?.(null)}
        >
          <DogCard dog={dog} active={dog.id === activeId} />
        </div>
      ))}
    </div>
  );
}
