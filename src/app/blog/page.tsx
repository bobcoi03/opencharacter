import React from 'react';
import Link from 'next/link';

interface BlogPost {
  image: string;
  category: string;
  title: string;
  excerpt: string;
  link: string;
}

const BlogCard: React.FC<BlogPost> = ({ image, category, title, excerpt, link }) => (
  <Link href={link} className="block overflow-hidden transition-opacity max-w-md rounded-xl">
    <img src={image} alt={title} className="w-full h-64 rounded-xl" />
    <div className="p-6">
      <p className="text-indigo-400 text-sm mb-2">{category}</p>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-base text-xs">{excerpt}</p>
    </div>
  </Link>
);

const BlogPage: React.FC = () => {
  const blogPosts: BlogPost[] = [
    {
      image: "/OpenCharacterCard.png",
      category: "Announcements",
      title: "Uncensored Alternative to Character.AI",
      excerpt: "Discover OpenCharacter: The open-source, uncensored platform for AI character creation and interaction. Learn how we're pushing the boundaries of AI conversation technology.",
      link: "/blog/uncensored-alternative-to-characterai"
    },
    {
      image: "https://opencharacter.org/c.ai-preview.png",
      category: "Future",
      title: "Future of OpenCharacter",
      excerpt: "Explore the future of OpenCharacter, an open-source, uncensored platform for AI character creation.",
      link: "/blog/future-of-project"
    },
    {
      image: "/paint.webp",
      category: "Why us over CharacterAI?",
      title: "Why us?",
      excerpt: "OpenCharacter vs CharacterAI",
      link: "/blog/characterai-alternative-opencharacter"
    },
  ];

  return (
    <div className="bg-neutral-900 min-h-screen text-white mb-24">
      <div className="mx-auto relative h-[50vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0 md:ml-16 rounded-xl overflow-hidden">
          <img src="/blog-background.webp" alt="Background" className="w-full h-full object-cover rounded-xl" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-wrap text-2xl md:text-5xl font-bold mb-4 text-black">OpenCharacter.org</h1>
          <p className="text-sm text-black max-w-2xl mx-auto">
            The open source, uncensored, alternative to CharacterAI
          </p>
        </div>
      </div>
      
      <div className="container py-6">
        <div className="mx-auto flex-col md:flex-row md:ml-16 md:flex md:flex-wrap gap-4">
          {blogPosts.map((blog, index) => 
            <BlogCard 
              key={index}
              {...blog}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;