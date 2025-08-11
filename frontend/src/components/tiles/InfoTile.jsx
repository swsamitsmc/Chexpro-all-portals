import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

function InfoTile({ icon, title, description, to, className = '' }) {
  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to, className: 'block group' } : { className: 'group' };

  return (
    <Wrapper {...wrapperProps} aria-label={typeof title === 'string' ? title : undefined}>
      <Card
        className={[
          'h-full text-center glassmorphism hover:shadow-xl transition-all duration-300',
          'group-hover:shadow-primary/30 group-hover:bg-primary/5 group-hover:border-primary/30',
          'group-hover:scale-105',
          className,
        ].join(' ')}
      >
        <CardHeader className="items-center">
          <div className="mx-auto mb-4 p-3 inline-block rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300">
            {icon}
          </div>
          <CardTitle className="text-xl text-foreground transition-colors group-hover:text-primary duration-300">
            {title}
          </CardTitle>
        </CardHeader>
        {description ? (
          <CardContent>
            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">{description}</p>
          </CardContent>
        ) : null}
      </Card>
    </Wrapper>
  );
}

export default InfoTile;


