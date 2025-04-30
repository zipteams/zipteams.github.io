import {Redirect} from '@docusaurus/router';
import type {ReactNode} from 'react';

// Redirect to the docs homepage (intro.md)
export default function Home(): ReactNode {
  return <Redirect to="/intro" />;
}
