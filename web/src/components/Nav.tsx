import { useEffect, useRef, useState } from "react";
import styles from "./Nav.module.css";

type Props = {
	currentPath: string;
};

const links = [
	{ href: "/", label: "Home" },
	{ href: "/posts", label: "Posts" },
];

export default function Nav({ currentPath }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const navRef = useRef<HTMLElement>(null);

	const isActive = (href: string) => {
		if (href === "/") {
			return currentPath === "/";
		}
		return currentPath.startsWith(href);
	};

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (navRef.current && !navRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};

		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	return (
		<nav ref={navRef} className={styles.nav}>
			<button
				type="button"
				className={`${styles.burger} ${isOpen ? styles.open : ""}`}
				aria-label="Toggle menu"
				aria-expanded={isOpen}
				onClick={(e) => {
					e.stopPropagation();
					setIsOpen(!isOpen);
				}}
			>
				<span className={styles.line} />
				<span className={styles.line} />
				<span className={styles.line} />
			</button>

			<ul className={`${styles.menu} ${isOpen ? styles.open : ""}`}>
				{links.map((link) => (
					<li key={link.href}>
						<a
							href={link.href}
							className={isActive(link.href) ? styles.active : ""}
							aria-current={isActive(link.href) ? "page" : undefined}
							onClick={() => setIsOpen(false)}
						>
							{link.label}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
