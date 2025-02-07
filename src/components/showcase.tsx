import { models } from "@/lib/llm_models";
import { cn } from "@/lib/utils";

interface ShowcaseProps {
    className?: string;
    videoUrl: string;
    title: string;
    description: string;
    backgroundImage?: string;
    videoClassName?: string;
}
  
export function Showcase({
    className,
    videoUrl,
    title,
    description,
    backgroundImage = '/gradient-2.jpeg',
    videoClassName,
}: ShowcaseProps) {
    return (
      <div className={className}>
        <div className="relative isolate">
            <div className="mx-auto max-w-5xl pb-12 pt-10 sm:pb-16 lg:flex lg:py-10 flex flex-col gap-8">
            <p className="text-white text-2xl md:text-4xl font-semibold text-center mt-6">{title}</p>
            <p className="text-white text-sm md:text-md font-light text-center max-w-xl text-center mx-auto mb-8">
                {description}
            </p>
            <div className="relative mx-auto mt-4 flex w-full max-w-4xl justify-start lg:mt-0 h-[300px] sm:h-[400px] md:h-[500px]">
              <div 
                className="relative rounded-xl w-full relative"
                style={{
                  backgroundImage: `url("${backgroundImage}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '100%'
                }}
              >
                <div className="w-full h-full relative rounded-xl">
                    <video 
                        className={videoClassName}
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        >
                        <source 
                            src={videoUrl}
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