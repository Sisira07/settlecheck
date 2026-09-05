import { useEffect, useState, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

/**
 * Animates from 0 (or its previous value) up to `value` whenever value changes.
 * suffix: e.g. '%' — appended after the animated number, not animated itself.
 */
export default function AnimatedNumber({ value, suffix = '' }) {
  const numeric = typeof value === 'number' ? value : parseFloat(value) || 0;
  const spring = useSpring(0, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v * 10) / 10);
  const [text, setText] = useState('0');

  useEffect(() => {
    spring.set(numeric);
  }, [numeric, spring]);

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(v.toString()));
    return unsub;
  }, [display]);

  if (value === '—' || value == null) return <span>—</span>;

  return <motion.span>{text}{suffix}</motion.span>;
}
