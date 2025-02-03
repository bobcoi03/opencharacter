import Image from "next/image";

interface CreatorDashboardShowcaseProps {
  className?: string;
}

export function CreatorDashboardShowcase({
  className,
}: CreatorDashboardShowcaseProps) {
  return (
    <div className={className}>
      <div className="relative isolate">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-20 flex flex-col gap-8">
          <p className="text-white text-2xl md:text-4xl font-semibold text-center mt-12">Creator Dashboard</p>
          <p className="text-white text-sm md:text-md font-light text-center max-w-xl text-center mx-auto mb-12">
            OpenCharacter Pro comes with a Creator Dashboard. This is where you can manage your characters and see how other users are using them.
          </p>
          <div className="relative mx-auto mt-8 flex w-full max-w-6xl justify-center lg:mt-0">
            <div 
              className="relative rounded-xl"
              style={{
                backgroundImage: 'url("/gradient.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Image
                src="/dashboard.png"
                alt="Dashboard preview"
                width={2432}
                height={1442}
                className="rounded-xl bg-transparent shadow-2xl ring-1 ring-white/10 p-8"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
