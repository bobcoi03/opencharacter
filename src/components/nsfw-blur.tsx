"use client"

import { Switch } from "@/components/ui/switch"
import { useLocalStorage } from "@/hooks/use-localstorage";

export default function NSFWBlur() {
    const [isBlurred, setIsBlurred] = useLocalStorage({
        key: 'nsfw-blur',
        defaultValue: true
    });

    const handleToggle = (checked: boolean) => {
        setIsBlurred(checked);
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center">
                <span className="mr-2 text-gray-200 text-sm">Blur NSFW Images</span>
                <Switch checked={isBlurred} onCheckedChange={handleToggle} />
            </div>
            <span className="text-[10px] text-gray-400 mt-1">
                Toggle on to blur NSFW images, off to show them directly
            </span>
        </div>
    );
}
