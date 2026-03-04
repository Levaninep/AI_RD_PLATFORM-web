"use client";

import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type AlertDialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(): AlertDialogContextValue {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialog components must be used within AlertDialog.");
  }
  return context;
}

export function AlertDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({
  className = "",
  children,
}: HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = useAlertDialogContext();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className={`relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({
  className = "",
  children,
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-1 ${className}`.trim()}>{children}</div>;
}

export function AlertDialogTitle({
  className = "",
  children,
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-base font-semibold text-gray-900 ${className}`.trim()}>
      {children}
    </h3>
  );
}

export function AlertDialogDescription({
  className = "",
  children,
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-gray-600 ${className}`.trim()}>{children}</p>
  );
}

export function AlertDialogFooter({
  className = "",
  children,
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 flex justify-end gap-2 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function AlertDialogCancel({
  className = "",
  onClick,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useAlertDialogContext();

  return (
    <button
      type={type}
      onClick={(event) => {
        onClick?.(event);
        onOpenChange(false);
      }}
      className={`rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 ${className}`.trim()}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      {...props}
    />
  );
}
