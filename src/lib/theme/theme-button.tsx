"use client";

import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const icon = theme === "dark" ? <Sun className="w-4 text-gray-400 dark:text-gray-500"/> : <Moon className="w-4 text-gray-400 dark:text-gray-500"/>;

	return (
		<button type="button" onClick={toggleTheme}>
			{icon}
		</button>
	);
}
