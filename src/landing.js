/* ============================================
   LANDING PAGE — Interactions
   ============================================ */

// Subtle hover parallax on tool cards
document.querySelectorAll('.tool-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    card.style.transform = `translateY(-4px) perspective(600px) rotateY(${x}deg) rotateX(${-y}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});
