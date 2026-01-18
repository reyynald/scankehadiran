import type { FC } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
    </header>
  );
};
