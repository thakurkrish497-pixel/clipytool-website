const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'shared.css');

const css = `
/* ============================================
   FEEDBACK SYSTEM (FAB & MODAL)
   ============================================ */
.feedback-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.feedback-fab:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3);
}

.feedback-fab:active {
  transform: translateY(0) scale(0.98);
}

.feedback-fab svg {
  flex-shrink: 0;
}

.feedback-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(9, 9, 11, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  padding: 16px;
}

.feedback-modal.open {
  opacity: 1;
  pointer-events: auto;
}

.feedback-modal__content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  padding: 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform: translateY(20px) scale(0.95);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.feedback-modal.open .feedback-modal__content {
  transform: translateY(0) scale(1);
}

.feedback-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.feedback-modal__header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.btn-close-feedback {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-feedback:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.feedback-label textarea,
.feedback-label input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}

.feedback-label textarea:focus,
.feedback-label input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.feedback-label textarea::placeholder,
.feedback-label input::placeholder {
  color: var(--text-tertiary);
}

.feedback-label textarea {
  resize: vertical;
  min-height: 80px;
}

.feedback-submit {
  margin-top: 8px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  padding: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.feedback-submit:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

.feedback-submit:active {
  transform: translateY(0);
}

/* Make sure the FAB doesn't block critical controls on mobile */
@media (max-width: 768px) {
  .feedback-fab {
    bottom: 16px;
    right: 16px;
    padding: 10px 16px;
    font-size: 0.85rem;
  }
  .feedback-fab span {
    display: none; /* Hide text on mobile to save space */
  }
  .feedback-modal__content {
    padding: 20px;
  }
}
`;

fs.appendFileSync(cssPath, css);
console.log('Appended feedback styles to shared.css');
