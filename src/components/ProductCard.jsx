import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import ShoeImage from './ShoeImage.jsx';
import { useShop } from '../hooks/useShop.js';
import { peso } from '../../shared/pricing.js';

export default function ProductCard({ product, rank, index = 0 }) {
  const { addToCart, setQuickView } = useShop();
  const [colorIdx, setColorIdx] = useState(0);
  const color = product.colors[colorIdx];

  return (
    <motion.article
      className="card"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="card__media" style={{ '--accent': product.accent }}>
        {rank && <span className="card__rank">#{rank}</span>}
        <div className="card__tags">
          {product.isNew && <span className="tag">NEW</span>}
          {product.limited && <span className="tag tag--gold">LIMITED</span>}
        </div>
        <Link to={`/product/${product.id}`} className="card__imgs" aria-label={`View ${product.name}`}>
          <ShoeImage className="card__img card__img--main" src={color.images[0]} alt={`${product.name} in ${color.name}`} />
          <ShoeImage className="card__img card__img--alt" src={color.images[1] || color.images[0]} alt="" aria-hidden="true" />
        </Link>
        <div className="card__actions">
          <button className="btn btn--sm btn--light" onClick={() => setQuickView(product)}><Eye size={16} /> Quick View</button>
          <button className="btn btn--sm btn--dark" onClick={() => addToCart(product, { color })}><Plus size={16} /> Add</button>
        </div>
      </div>
      <div className="card__body">
        <div className="card__row">
          <div>
            <span className="card__cat">{product.category} · {product.model}</span>
            <h3 className="card__name"><Link to={`/product/${product.id}`}>{product.name}</Link></h3>
          </div>
          <span className="card__price">{peso(product.price)}</span>
        </div>
        <div className="card__row card__row--extra">
          <div className="swatches swatches--sm">
            {product.colors.map((c, i) => (
              <button key={c.name} title={c.name} aria-label={c.name} className={`swatch ${i === colorIdx ? 'is-active' : ''}`} style={{ background: c.hex }} onMouseEnter={() => setColorIdx(i)} onClick={() => setColorIdx(i)} />
            ))}
          </div>
          <span className="card__rating">★ {product.rating.toFixed(1)}</span>
        </div>
      </div>
    </motion.article>
  );
}
