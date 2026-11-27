export const DISCOVERY_SECTIONS = [
  {handle: 'new-arrivals', title: 'New Arrivals', description: 'Browse the latest products added to the Seine Shop catalog.', kind: 'catalog'},
  {handle: 'eu-top-rankings', title: 'EU Top Rankings', description: 'Explore product rankings for the European market when available.', empty: 'No European market rankings are available yet.', kind: 'catalog'},
  {handle: 'trending-products', title: 'Trending Products', description: 'Discover products that are gaining interest.', empty: 'No verified trends are available yet.', kind: 'catalog'},
  {handle: 'certified-products', title: 'Certified Products', description: 'Explore products with verified certification information.', empty: 'No products with verified certification information are listed here yet.', kind: 'catalog'},
  {handle: 'brand-distributor', title: 'Brand Distributor', description: 'Explore available brand distribution information.', empty: 'No confirmed brand distribution information is listed here yet.', kind: 'brands'},
  {handle: 'handpicked-brands', title: 'Handpicked Brands', description: 'Browse the brands selected for this directory.', empty: 'No brands have been added to this directory yet.', kind: 'brands'},
];
export const discoveryPath = (handle) => `/discover/${handle}`;
export const NEW_ARRIVALS_PATH = discoveryPath('new-arrivals');
