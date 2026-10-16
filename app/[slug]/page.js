import { redirect } from 'next/navigation';

// Login is by mobile number now, so pathshala links aren't needed; old links land on the login page
export default function OldPathshalaLink() {
  redirect('/');
}
