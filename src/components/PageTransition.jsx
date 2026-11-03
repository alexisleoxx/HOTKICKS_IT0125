// Page enter animation in plain CSS, so a page can never get stuck hidden mid-transition
export default function PageTransition({ children }) {
  return (
    <>
      <div className="curtain" aria-hidden="true" />
      <main className="page-enter">{children}</main>
    </>
  );
}
