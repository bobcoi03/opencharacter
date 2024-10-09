import React from 'react';

export const runtime = "edge"

interface BlogLayoutProps {
  children: React.ReactNode;
}

const BlogLayout: React.FC<BlogLayoutProps> = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};

export default BlogLayout;

