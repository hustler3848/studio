"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getInitialContent } from "@/lib/actions";
import type { Content } from "@/types";
import { Header } from "@/components/header";
import { ContentCard } from "@/components/content-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Film, Tv, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/components/hero-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/footer";

interface HomePageClientProps {
  typeFromUrl?: string;
  genreFromUrl?: string;
}

const ContentSection = ({
  title,
  items,
  isLoading,
}: {
  title: string;
  items: Content[];
  isLoading: boolean;
}) => (
  <section className="mb-12">
    <h2 className="text-3xl font-headline font-bold mb-8 text-foreground">
      {title}
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        : items.map((item) => (
            <ContentCard key={`${title}-${item.id}`} content={item} />
          ))}
    </div>
  </section>
);

export function HomePageClient({ typeFromUrl, genreFromUrl }: HomePageClientProps) {
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [filters, setFilters] = useState({
    type: typeFromUrl || "all",
    genre: genreFromUrl || "all",
    year: "all",
  });
  const [latestPage, setLatestPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const router = useRouter();

  useEffect(() => {
    const fetchContent = async () => {
        setIsLoading(true);
        const initialContent = await getInitialContent();
        setContent(initialContent);
        setIsLoading(false);
    };
    fetchContent();
  }, []);

  // Sync router params to local filter state
  useEffect(() => {
    setFilters(prev => ({
        ...prev,
        type: typeFromUrl || 'all',
        genre: genreFromUrl || 'all'
    }))
  }, [typeFromUrl, genreFromUrl]);
  
  const handleFilterChange = useCallback((filterType: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [filterType]: value };

    const params = new URLSearchParams();
    if (newFilters.type !== 'all') params.set('type', newFilters.type);
    if (newFilters.genre !== 'all') params.set('genre', newFilters.genre);

    // Note: We are not adding 'year' to the URL to keep it clean.
    // It will be reset on navigation.

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');

  }, [filters, router]);

  const genresWithCount = useMemo(() => {
    if (!content.length) return [];
    const counts: Record<string, number> = {};
    content.forEach((item) => {
      item.genre.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [content]);

  const years = useMemo(() => {
    if (!content.length) return [];
    const uniqueYears = [...new Set(content.map((item) => item.year.toString()))].sort(
      (a, b) => Number(b) - Number(a)
    );
    return ["all", ...uniqueYears];
  }, [content]);

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const typeMatch =
        filters.type === "all" || item.type.toLowerCase() === filters.type;
      const genreMatch =
        filters.genre === "all" || item.genre.includes(filters.genre);
      const yearMatch =
        filters.year === "all" || item.year.toString() === filters.year;

      return typeMatch && genreMatch && yearMatch;
    });
  }, [content, filters]);
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQuery = searchInputValue.trim();
    if (trimmedQuery) {
        // The search dialog will handle its own state, but if we wanted a dedicated search page:
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const isFiltering = useMemo(
    () =>
      filters.type !== "all" ||
      filters.genre !== "all" ||
      filters.year !== "all",
    [filters]
  );
  
  const heroContent = useMemo(() => [...content].sort((a,b) => b.rating - a.rating).slice(0, 5), [content]);
  const popularContent = useMemo(() => [...content].sort((a,b) => b.rating - a.rating).slice(0, 8), [content]);

  const sortedLatestContent = useMemo(() => {
    return [...content].sort((a, b) => b.year - a.year);
  }, [content]);

  const totalLatestPages = Math.ceil(sortedLatestContent.length / ITEMS_PER_PAGE);

  const paginatedLatestContent = useMemo(() => {
    const startIndex = (latestPage - 1) * ITEMS_PER_PAGE;
    return sortedLatestContent.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedLatestContent, latestPage]);


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      {!isFiltering && (
          isLoading ? 
            <Skeleton className="w-full h-[50vh] md:h-[85vh] mb-8" /> : 
            <HeroSection content={heroContent} />
      )}

      <section className="w-full py-6 md:py-8 bg-background border-b border-border">
        <div className="container mx-auto max-w-screen-2xl px-2 sm:px-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search movies, anime..."
              className="w-full rounded-full bg-muted h-14 pl-12 pr-32 text-base shadow-inner focus:bg-background"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
            <Button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full h-10 px-6">
                Search
            </Button>
          </form>
        </div>
      </section>

      <div className="container mx-auto max-w-screen-2xl px-2 sm:px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-12">
          
          <main className="lg:col-span-3">
             {isFiltering && (
              <div className="mb-8 p-4 bg-secondary/20 rounded-lg border">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">Filtered by:</span>
                    {filters.type !== 'all' && <Badge variant="outline" className="capitalize">{filters.type}</Badge>}
                    {filters.genre !== 'all' && <Badge variant="outline">{filters.genre}</Badge>}
                    {filters.year !== 'all' && <Badge variant="outline">{filters.year}</Badge>}
                  </div>
                  <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => router.push('/')}
                      className="text-primary hover:text-primary/80 px-0"
                  >
                      Clear all filters
                  </Button>
                </div>
              </div>
            )}
            
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : isFiltering ? (
                 <>
                  {filteredContent.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg">No results found.</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your filters or clearing them.</p>
                    </div>
                  ) : (
                    <section className="mb-12">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {filteredContent.map((item) => (
                          <ContentCard key={item.id} content={item} />
                        ))}
                      </div>
                    </section>
                  )}
                 </>
            ) : (
              <>
                <ContentSection title="Most Popular" items={popularContent} isLoading={isLoading}/>
                <ContentSection title="Latest Releases" items={paginatedLatestContent} isLoading={isLoading}/>
                
                {totalLatestPages > 1 && !isLoading && (
                  <div className="flex justify-center items-center gap-4 pb-8">
                    <Button
                        onClick={() => setLatestPage(p => p - 1)}
                        disabled={latestPage === 1}
                        variant="outline"
                        size="icon"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous Page</span>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {latestPage} of {totalLatestPages}
                    </span>
                    <Button
                        onClick={() => setLatestPage(p => p + 1)}
                        disabled={latestPage === totalLatestPages}
                        variant="outline"
                        size="icon"
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next Page</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="lg:col-span-1 mt-12 lg:mt-0">
            <div className="sticky top-24 space-y-8">
              <div>
                 <h3 className="text-lg font-headline font-semibold mb-4 text-foreground">Type</h3>
                 <div className="flex flex-col space-y-2">
                    <Button variant={filters.type === 'all' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleFilterChange('type', 'all')}>All Types</Button>
                    <Button variant={filters.type === 'movie' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleFilterChange('type', 'movie')}><Film className="mr-2 h-4 w-4"/>Movies</Button>
                    <Button variant={filters.type === 'anime' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleFilterChange('type', 'anime')}><Tv className="mr-2 h-4 w-4"/>Anime</Button>
                    <Button variant={filters.type === 'webseries' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleFilterChange('type', 'webseries')}><Tv className="mr-2 h-4 w-4"/>Webseries</Button>
                 </div>
              </div>
              
              <div>
                <h3 className="text-lg font-headline font-semibold mb-4 text-foreground">Year</h3>
                <Select value={filters.year} onValueChange={(value) => setFilters(f => ({...f, year: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                        <SelectItem key={year} value={year}>{year === 'all' ? 'All Years' : year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-lg font-headline font-semibold mb-4 text-foreground">Genres</h3>
                <div className="flex flex-col items-start space-y-2">
                  <Button variant={filters.genre === 'all' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleFilterChange('genre', 'all')}>All Genres</Button>
                  {genresWithCount.map(({name, count}) => (
                      <Button key={name} variant={filters.genre === name ? 'secondary' : 'ghost'} className="w-full justify-between" onClick={() => handleFilterChange('genre', name)}>
                        <span>{name}</span>
                        <Badge variant="outline">{count}</Badge>
                      </Button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
