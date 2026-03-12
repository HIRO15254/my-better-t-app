import {
	IconChecklist,
	IconHome,
	IconLayoutDashboard,
	IconSearch,
	IconSettings,
} from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType } from "react";

interface NavigationItem {
	icon: ComponentType<{ size?: number; stroke?: number; className?: string }>;
	label: string;
	to: string;
}

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
	{ to: "/", label: "ホーム", icon: IconHome },
	{ to: "/dashboard", label: "ダッシュボード", icon: IconLayoutDashboard },
	{ to: "/todos", label: "Todo", icon: IconChecklist },
	{ to: "/search", label: "検索", icon: IconSearch },
	{ to: "/settings", label: "設定", icon: IconSettings },
] as const;

function isActive(currentPath: string, itemPath: string): boolean {
	if (itemPath === "/") {
		return currentPath === "/";
	}
	return currentPath.startsWith(itemPath);
}

export function MobileNav() {
	const pathname = useRouterState({
		select: (s) => s.location.pathname,
	});

	return (
		<nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
			<ul className="flex h-16 items-center justify-around">
				{NAVIGATION_ITEMS.map((item) => {
					const active = isActive(pathname, item.to);
					return (
						<li key={item.to}>
							<Link
								className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors ${
									active
										? "font-semibold text-primary"
										: "text-muted-foreground"
								}`}
								to={item.to}
							>
								<item.icon size={24} stroke={active ? 2.5 : 1.5} />
								<span>{item.label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
