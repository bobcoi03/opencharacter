import Image from 'next/image';

export const runtime = "edge";

export default function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8 text-white mb-12">
            <Image
                src="/OpenCharacterCard.png"
                alt="OpenCharacter.org"
                width={800}
                height={400}
                className="w-full h-auto mb-8 rounded-lg shadow-lg"
            />
            <h1 className="text-4xl font-bold mb-6 text-center">OpenCharacter.org</h1>
            <h2 className="text-2xl font-semibold mb-4 text-center">A project to recreate the old c.ai site and open-source it</h2>
            
            <div className="space-y-6">
                <p className="italic text-gray-300 text-center">Started: September 13, 2024 | Last Updated: October 4, 2024</p>

                <p>I created OpenCharacter because I saw how upset people were at the discontinuation of the old c.ai site. Users found the UI of the new site unfamiliar and, most importantly, noticed a dramatic increase in the level of filters and censorship.</p>

                <p>So, I decided to recreate the old site with the same UI and feature set but use open-source models instead by leveraging OpenRouter. This approach bypasses the filters and censorship. By virtue of being open-source, it will make it easier for users to fully customize their characters, scenarios, roleplays, rooms, etc. (hook it up to LLM, text-to-image, text-to-video models, etc.).</p>

                <p>Currently, OpenCharacter supports public and private character creations, regenerations, edit and delete message features, and Persona capabilities. It&apos;s been just three weeks since I wrote my first line of code.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Why This Will Work (I Think)</h2>

                <p>LLMs are becoming increasingly powerful and affordable! Even c.ai is moving away from developing foundational models and using fine-tuned versions of pre-trained models.</p>

                <blockquote className="border-l-4 border-gray-500 pl-4 py-2 italic my-4">
                    &quot;Given these changes, we see an advantage in making greater use of third-party LLMs alongside our own.&quot;
                    <footer className="text-sm mt-2">- Noam Shazeer, CharacterAI founder</footer>
                </blockquote>

                <p>We&apos;re no longer in 2022 where there was only one provider of LLMs. We&apos;re now in a thriving ecosystem of closed and open-source models that are highly competitive and commoditized, with many players offering different models.</p>

                <p>Given this context, it allows someone like me to build something like this in a weekend and achieve significant usage (people using it for hours) and user growth, with minimal marketing!</p>
                
                <p>The advantage of large companies with big datasets will only diminish as the costs of LLM inference and training reduce dramatically while quality improves.</p>

                <p>Now is the time to &quot;carpe diem!&quot; Not just seize the day, but seize the entire market!</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Future Vision</h2>

                <p>I don&apos;t want OpenCharacter to be just a 1:1 copy of the old c.ai site. I see this initial version as a way to attract users. Ideally, I want to create a very open platform where people can access any LLM, voice, text-to-image, and image-to-text models, allowing them to fully customize their characters, personas, rooms, scenarios, etc., to their heart&apos;s content.</p>

                <p>Want to create a painter character that paints in the style of Vincent van Gogh but answers in the style of Bob Ross? You can do that. Technically, it&apos;s not hard. We just need to allow users to upload a text-to-image LoRA based on Vincent Van Gogh and link it to an OpenAI API-compatible LLM inference trained on Bob Ross, or use a simple system prompt to respond to messages like Bob Ross.</p>

            </div>
        </div>
    );
}