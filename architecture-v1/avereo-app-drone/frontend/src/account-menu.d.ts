import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'avereo-account-menu': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        placement?: 'sidebar';
        compact?: 'always' | 'sidebar';
      };
    }
  }
}
