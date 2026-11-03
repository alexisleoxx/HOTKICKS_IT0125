export const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function StatusBadge({ status = 'pending' }) {
  return <span className={`status status--${status}`}>{status}</span>;
}
