import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'avereo-account-menu': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        placement?: 'sidebar';
        'preferences-app'?: string;
        'preferences-label'?: string;
        'preferences-fields'?: string;
        compact?: 'always' | 'sidebar';
      };
    }
  }
}
