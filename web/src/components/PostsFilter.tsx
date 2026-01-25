import { useEffect, useMemo, useState } from "react";
import styles from "./PostsFilter.module.css";

type Post = {
	slug: string;
	title: string;
	description: string;
	pubDate: string;
	tags: string[];
	author?: string;
};

type Props = {
	posts: Post[];
	allTags: string[];
};

const POSTS_PER_PAGE = 10;

function getParamsFromURL() {
	if (typeof window === "undefined") {
		return { tags: [] as string[], query: "", page: 1 };
	}
	const params = new URLSearchParams(window.location.search);
	return {
		tags: params.getAll("tag"),
		query: params.get("q") || "",
		page: Number(params.get("page")) || 1,
	};
}

function updateURL(tags: string[], query: string, page: number) {
	const params = new URLSearchParams();
	for (const tag of tags) {
		params.append("tag", tag);
	}
	if (query) params.set("q", query);
	if (page > 1) params.set("page", String(page));

	const newURL = params.toString()
		? `${window.location.pathname}?${params.toString()}`
		: window.location.pathname;

	window.history.replaceState(null, "", newURL);
}

export default function PostsFilter({ posts, allTags }: Props) {
	const initial = getParamsFromURL();
	const [query, setQuery] = useState(initial.query);
	const [activeTags, setActiveTags] = useState<string[]>(initial.tags);
	const [currentPage, setCurrentPage] = useState(initial.page);
	const [showTags, setShowTags] = useState(true);

	// Sync URL on state change
	useEffect(() => {
		updateURL(activeTags, query, currentPage);
	}, [activeTags, query, currentPage]);

	// Handle browser back/forward
	useEffect(() => {
		const handlePopState = () => {
			const params = getParamsFromURL();
			setActiveTags(params.tags);
			setQuery(params.query);
			setCurrentPage(params.page);
		};
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	const filteredPosts = useMemo(() => {
		return posts.filter((post) => {
			const searchText = [post.title, post.description, post.tags.join(" ")]
				.join(" ")
				.toLowerCase();
			const matchesQuery = searchText.includes(query.toLowerCase().trim());
			const matchesTag =
				activeTags.length === 0 ||
				activeTags.some((tag) =>
					post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()),
				);
			return matchesQuery && matchesTag;
		});
	}, [posts, query, activeTags]);

	const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
	const paginatedPosts = filteredPosts.slice(
		(currentPage - 1) * POSTS_PER_PAGE,
		currentPage * POSTS_PER_PAGE,
	);

	const handleTagClick = (tag: string) => {
		setActiveTags((prev) => {
			if (prev.includes(tag)) {
				return prev.filter((t) => t !== tag);
			}
			return [...prev, tag];
		});
		setCurrentPage(1);
	};

	const clearTags = () => {
		setActiveTags([]);
		setCurrentPage(1);
	};

	const handleSearch = (value: string) => {
		setQuery(value);
		setCurrentPage(1);
	};

	const goToPage = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	return (
		<>
			<section className={styles.filters}>
				<div className={styles.search}>
					<label htmlFor="searchInput" className={styles.label}>
						Search
					</label>
					<input
						id="searchInput"
						type="search"
						placeholder="Search title, description, or tags"
						autoComplete="off"
						value={query}
						onChange={(e) => handleSearch(e.target.value)}
					/>
				</div>

				<div className={styles.tagFilterWrapper}>
					<button
						className={styles.toggleTags}
						type="button"
						aria-expanded={showTags}
						onClick={() => setShowTags(!showTags)}
					>
						<span>{showTags ? "Hide Tags" : "Show Tags"}</span>
						<span className={styles.toggleIcon}>{showTags ? "▲" : "▼"}</span>
					</button>
					{showTags && (
						<div className={styles.tagFilter}>
							<button
								className={`${styles.tag} ${activeTags.length === 0 ? styles.active : ""}`}
								type="button"
								onClick={clearTags}
							>
								All
							</button>
							{allTags.map((tag) => (
								<button
									key={tag}
									className={`${styles.tag} ${activeTags.includes(tag) ? styles.active : ""}`}
									type="button"
									onClick={() => handleTagClick(tag)}
								>
									{tag}
								</button>
							))}
						</div>
					)}
				</div>
			</section>

			<section className={styles.posts}>
				{(query || activeTags.length > 0) && (
					<p className={styles.resultMeta}>{filteredPosts.length} results</p>
				)}

				{paginatedPosts.length > 0 ? (
					<ul className={styles.postsList}>
						{paginatedPosts.map((post) => (
							<li key={post.slug} className={styles.postCard}>
								<a className={styles.postLink} href={`/posts/${post.slug}/`}>
									<div className={styles.postMeta}>
										<time dateTime={post.pubDate}>
											{new Date(post.pubDate).toLocaleDateString("en-US")}
										</time>
										{post.author && (
											<span className={styles.author}>by {post.author}</span>
										)}
									</div>
									<h2>{post.title}</h2>
									<p className={styles.description}>{post.description}</p>
									{post.tags.length > 0 && (
										<ul className={styles.tagList}>
											{post.tags.map((tag) => (
												<li key={tag}>{tag}</li>
											))}
										</ul>
									)}
								</a>
							</li>
						))}
					</ul>
				) : (
					<p className={styles.empty}>No posts match your search.</p>
				)}

				{totalPages > 1 && (
					<nav className={styles.pagination}>
						<button
							type="button"
							className={styles.paginationBtn}
							disabled={currentPage === 1}
							onClick={() => goToPage(currentPage - 1)}
						>
							Previous
						</button>
						<span className={styles.pageInfo}>
							Page {currentPage} of {totalPages}
						</span>
						<button
							type="button"
							className={styles.paginationBtn}
							disabled={currentPage === totalPages}
							onClick={() => goToPage(currentPage + 1)}
						>
							Next
						</button>
					</nav>
				)}
			</section>
		</>
	);
}
