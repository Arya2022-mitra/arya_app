import Image from 'next/image';
import DailyPrediction from '@/components/DailyPrediction';

export default function PersonalPrediction({
  prediction: rawPrediction,
}: {
  prediction: any | null;
}) {
  const prediction = (rawPrediction as any)?.data ?? rawPrediction ?? null;
  return (
    <div className="relative overflow-hidden rounded-2xl p-8 pb-28 bg-[#101929] border border-cyan-400">
      <Image
        src="/logo/bg.png"
        alt="MitraVeda watermark"
        width={800}
        height={800}
        className="absolute top-1/2 left-1/2 w-4/5 h-4/5 -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none z-0 object-contain"
        priority={false}
      />
      <div className="relative z-10">
        <DailyPrediction prediction={prediction} />
      </div>
    </div>
  );
}
