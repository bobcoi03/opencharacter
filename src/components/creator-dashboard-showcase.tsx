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
        <div className="mx-auto max-w-5xl px-6 pb-12 pt-10 sm:pb-16 lg:flex lg:px-8 lg:py-10 flex flex-col gap-8">
          <p className="text-white text-2xl md:text-4xl font-semibold text-center mt-6">Creator Dashboard</p>
          <p className="text-white text-sm md:text-md font-light text-center max-w-xl text-center mx-auto mb-8">
            OpenCharacter Pro comes with a Creator Dashboard. This is where you can manage your characters and see how other users are using them.
          </p>
          <div className="relative mx-auto mt-4 flex w-full max-w-4xl justify-start lg:mt-0">
              <div 
                className="relative rounded-xl w-full relative"
                style={{
                  backgroundImage: 'url("/gradient.jpeg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '500px'
                }}
              >
                <div className="w-full h-full relative rounded-xl">
                    <video 
                        className="w-[85%] absolute bottom-0 left-0 right-0 mx-auto rounded-t-xl"
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        >
                        <source 
                            src="https://random-stuff-everythingcompany.s3.us-west-1.amazonaws.com/dashboard-showcase.mp4" 
                            type="video/mp4" 
                        />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
