import SearchPage from "@/components/search-page"

export const runtime = "edge"

export default async function SearchPageEdge() {
    return (
        <SearchPage />
    )
}