"use client"

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PinInputProps {
  length?: number
  value: string
  onChange: (pin: string) => void
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean
}

/**
 * 4-digit PIN input component with individual boxes for each digit
 */
export function PinInput({
  length = 4,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = false,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const digits = value.split("").slice(0, length)
  while (digits.length < length) {
    digits.push("")
  }

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, "").slice(-1)

    const newDigits = [...digits]
    newDigits[index] = digit
    const newPin = newDigits.join("")

    onChange(newPin)

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const digits = pastedData.replace(/\D/g, "").slice(0, length)
    onChange(digits)

    // Focus the next empty input or the last one
    const nextIndex = Math.min(digits.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
    // Select the content for easier replacement
    inputRefs.current[index]?.select()
  }

  const handleBlur = () => {
    setFocusedIndex(null)
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold",
            "border-2 transition-all",
            error
              ? "border-red-500 focus:border-red-600"
              : focusedIndex === index
                ? "border-montron-primary ring-2 ring-montron-primary/20"
                : "border-montron-contrast/30 focus:border-montron-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  )
}

