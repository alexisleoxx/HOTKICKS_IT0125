import { Link, useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import ProductConfigurator from '../components/ProductConfigurator.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SectionHead from '../components/SectionHead.jsx';
import { useProduct, useProducts } from '../hooks/useProducts.js';

export default function ProductPage() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { products } = useProducts();

  if (loading) return <div className="page-pad"><div className="spinner" /></div>;
  if (error || !product) {
    return (
      <div className="page-pad empty">
        <h3>Sneaker not found</h3>
        <Link to="/shop" className="btn btn--dark">Back to shop</Link>
      </div>
    );
  }

  const related = products.filter((p) => p.id !== product.id && p.category === product.category)
    .concat(products.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, 4);

  return (
    <PageTransition>
      <section className="product-page">
        <nav className="crumbs">
          <Link to="/">Home</Link> / <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> / <span>{product.name}</span>
        </nav>
        <ProductConfigurator product={product} />
      </section>
      <section className="section">
        <SectionHead eyebrow="YOU MAY ALSO LIKE" title="Related kicks." />
        <div className="grid">{related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
      </section>
    </PageTransition>
  );
}
