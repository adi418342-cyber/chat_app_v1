import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { MAX_LENGTH } from "@/lib/chat-store";

export function MessageInput({ onSend, isCapReached = false }: { onSend: (content: string) => void | Promise<void>, isCapReached?: boolean }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const tooLong = value.length > MAX_LENGTH;
  const canSend = value.trim().length > 0 && !tooLong && !isCapReached;

  async function submit() {
    if (!canSend || sendingRef.current) return;
    sendingRef.current = true;
    const text = value.trim();
    setValue("");
    // Reset height after clearing
    if (ref.current) {
      ref.current.style.height = "auto";
    }
    try {
      await onSend(text);
    } finally {
      sendingRef.current = false;
      ref.current?.focus();
    }
  }

  function handleBeforeInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const native = e.nativeEvent as InputEvent;
    // Layer 1: block known paste inputTypes before the browser inserts anything.
    if (
      native.inputType === "insertFromPaste" ||
      native.inputType === "insertFromPasteAsQuotation" ||
      native.inputType === "insertFromDrop"
    ) {
      e.preventDefault();
      return;
    }
    // Layer 2: if the data itself is multi-character (some mobile keyboards
    // set inputType="insertText" but still insert clipboard content), block it.
    if (native.data && native.data.length > 1) {
      e.preventDefault();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newVal = e.target.value;
    const charsAdded = newVal.length - value.length;

    // Layer 3: nuclear option — if more than 1 character was added in a single
    // change event, it came from paste/autocomplete, not manual typing.
    // Restore the DOM to the previous value and bail out.
    if (charsAdded > 1) {
      e.target.value = value;
      return;
    }

    setValue(newVal);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div className="border-t border-border bg-card px-3 py-3 sm:px-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={handleChange}
          onBeforeInput={handleBeforeInput}
          disabled={isCapReached}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          placeholder={isCapReached ? "Message limit reached." : "Type a message…"}
          aria-label="Message"
          className="max-h-40 min-h-[42px] flex-1 resize-none overflow-y-auto rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="flex h-[42px] items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
        >
          <SendHorizontal className="size-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
      {tooLong && !isCapReached && (
        <p className="mx-auto mt-2 max-w-3xl text-xs text-destructive">
          Message is too long ({value.length}/{MAX_LENGTH}).
        </p>
      )}
      {isCapReached && (
        <p className="mx-auto mt-2 max-w-3xl text-sm text-destructive font-medium text-center bg-destructive/10 py-1.5 rounded-md">
          Message limit reached. Please ask the administrator to export and reset the database.
        </p>
      )}
    </div>
  );
}
