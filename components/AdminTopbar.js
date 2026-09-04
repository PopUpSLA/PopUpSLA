import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function AdminTopbar({ active }) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  return (
    <div className="admin-topbar">
      <Link href="/admin" className="wordmark" style={{ color: 'var(--cream)', border: 'none' }}>
        Soutenons Leur Avenir · admin
      </Link>
      <nav>
        <Link href="/admin" style={{ opacity: active === 'dashboard' ? 1 : 0.7 }}>
          Aperçu
        </Link>
        <Link href="/admin/commandites" style={{ opacity: active === 'sponsors' ? 1 : 0.7 }}>
          Commandites
        </Link>
        <Link href="/admin/editions" style={{ opacity: active === 'editions' ? 1 : 0.7 }}>
          Éditions
        </Link>
        <Link href="/admin/participants" style={{ opacity: active === 'participants' ? 1 : 0.7 }}>
          Participants
        </Link>
        <Link href="/admin/plan-de-salle" style={{ opacity: active === 'plan-de-salle' ? 1 : 0.7 }}>
          Plan de salle
        </Link>
        <Link href="/admin/budget" style={{ opacity: active === 'budget' ? 1 : 0.7 }}>
          Budget
        </Link>
        <Link href="/admin/contenu" style={{ opacity: active === 'content' ? 1 : 0.7 }}>
          Contenu du site
        </Link>
        <button onClick={handleLogout}>Déconnexion</button>
      </nav>
    </div>
  );
}
