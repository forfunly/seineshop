import {redirect} from 'react-router';
// Preserve old submissions; the new index separates every resource family.
export function loader() {
  return redirect('/sitemap.xml', 301);
}
