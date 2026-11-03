/* eslint-disable @next/next/no-img-element -- private receipt route / local blob URLs */
"use client";

import { useEffect, useRef } from "react";

/** Native modal traps focus and supports Escape; never opens a public receipt URL. */
export function ReceiptImageDialog({ src, open, onClose, alt = "Enlarged receipt for review" }: {
  src: string | null; open: boolean; onClose: () => void; alt?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && src && !node.open) node.showModal();
    if ((!open || !src) && node.open) node.close();
  }, [open, src]);
  return <dialog ref={dialog} className="receipt-image-dialog" onClose={onClose}
    aria-label="Receipt image preview">
    <div className="receipt-dialog-toolbar">
      <strong>Receipt preview</strong>
      <button type="button" className="button-outline"
        onClick={() => { dialog.current?.close(); onClose(); }}>Close ×</button>
    </div>
    {src && <img src={src} alt={alt}/>}
  </dialog>;
}
