import * as React from "react";

type Props = React.PropsWithChildren<{ className?: string; id?: string }>;

export function Section({ children, className, id }: Props) {
  return (
    <section id={id} className={`py-12 sm:py-16 lg:py-20 ${className ?? ""}`}>
      {children}
    </section>
  );
}
