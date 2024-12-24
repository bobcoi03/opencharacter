"use client"

import { Switch } from "@/components/ui/switch"
import { useLocalStorage } from "@/hooks/use-localstorage";

export default function NSFWToggle() {
    const [isNSFW, setIsNSFW] = useLocalStorage({
        key: 'nsfw',
        defaultValue: false
    });

    const handleToggle = (checked: boolean) => {
        setIsNSFW(checked);
    };

    return (
        <div className="flex flex-col mt-8">
            <div className="flex items-center">
                <span className="mr-2 text-gray-200 text-sm">NSFW Content</span>
                <Switch checked={isNSFW} onCheckedChange={handleToggle} />
            </div>
            <span className="text-[10px] text-gray-400 mt-1">
                Toggle on to show NSFW characters, off to hide them completely
            </span>
        </div>
    );
}