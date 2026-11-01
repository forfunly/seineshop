import {redirect} from 'react-router';
// Shopify creates a customer account after the first successful email-code login.
export function loader() {
  return redirect('/account/login');
}
