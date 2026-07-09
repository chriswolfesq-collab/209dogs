import DogCard, { DogSummary } from "@/components/DogCard";

export default function DogList({ dogs }: { dogs: DogSummary[] }) {
  if (dogs.length === 0) {
    return (
      <p className="py-12 text-center text-black/60">
        No found dogs match your filters right now.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {dogs.map((dog) => (
        <DogCard key={dog.id} dog={dog} />
      ))}
    </div>
  );
}
