"use client";

import type { ReactNode } from "react";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

type ConfirmTone = "danger" | "accent" | "success";

type ConfirmDialogProps = {
  title: string;
  description: ReactNode;
  note?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: ConfirmTone;
  isProcessing?: boolean;
  processingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  overlayClassName?: string;
  panelClassName?: string;
  actionsClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  noteClassName?: string;
  cancelButtonClassName?: string;
  confirmButtonClassName?: string;
};

const defaultOverlayClass =
  "fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm";
const defaultPanelClass =
  "w-full max-w-[380px] rounded-2xl border border-[#E3E2DE] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.1)]";
const defaultActionsClass = "mt-5 flex justify-end gap-2";
const defaultTitleClass = "mb-2 text-[18px] font-bold text-[#37352F]";
const defaultDescriptionClass = "text-[14px] text-[#787774]";
const defaultNoteClass = "mt-1 text-[12px] text-[#EB5757]";
const defaultCancelButtonClass =
  "rounded-lg bg-[#F7F6F3] px-4 py-2 text-[13px] font-medium text-[#37352F] transition hover:bg-[#F1F1EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";
const toneClasses: Record<ConfirmTone, string> = {
  danger:
    "rounded-lg bg-[#EB5757] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#E04040] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2",
  accent:
    "rounded-lg bg-[#2F80ED] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2",
  success:
    "rounded-lg bg-[#27AE60] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#219653] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2",
};

export default function ConfirmDialog({
  title,
  description,
  note,
  confirmLabel,
  cancelLabel = "취소",
  confirmTone = "danger",
  isProcessing = false,
  processingLabel,
  onCancel,
  onConfirm,
  overlayClassName,
  panelClassName,
  actionsClassName,
  titleClassName,
  descriptionClassName,
  noteClassName,
  cancelButtonClassName,
  confirmButtonClassName,
}: ConfirmDialogProps) {
  return (
    <div className={overlayClassName || defaultOverlayClass} onClick={onCancel}>
      <div className={panelClassName || defaultPanelClass} onClick={(event) => event.stopPropagation()}>
        <h3 className={titleClassName || defaultTitleClass}>{title}</h3>
        <div className={descriptionClassName || defaultDescriptionClass}>{description}</div>
        {note ? <div className={noteClassName || defaultNoteClass}>{note}</div> : null}

        <div className={actionsClassName || defaultActionsClass}>
          <button type="button" className={cancelButtonClassName || defaultCancelButtonClass} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn(confirmButtonClassName || toneClasses[confirmTone])}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? processingLabel || confirmLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
