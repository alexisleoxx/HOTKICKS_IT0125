import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';

export default function NotFound() {
  return (
    <PageTransition>
      <section className="page-pad empty">
        <h1 className="big404">404</h1>
        <h3>This pair walked off.</h3>
        <Link to="/" className="btn btn--dark">Back to HOTKICKS</Link>
      </section>
    </PageTransition>
  );
}
